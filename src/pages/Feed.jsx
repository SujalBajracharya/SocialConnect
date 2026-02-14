import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Plus,
  Image as ImageIcon,
  Loader2,
  Send
} from 'lucide-react';
import {
  getPosts,
  createPost,
  getLikesByPostId,
  createLike,
  deleteLike,
  getLikeByUserAndPost,
  getCommentsByPostId,
  createComment,
  createNotification,
  getUserById
} from '../services/api';
import { formatDistanceToNow } from 'date-fns';

// Feed page displays posts, allows creating posts, liking, commenting, and loading more
const Feed = () => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [posts, setPosts] = useState([]); // List of posts with details
  const [loading, setLoading] = useState(true); // Loading state for initial posts
  const [newPostContent, setNewPostContent] = useState(''); // Content for new post
  const [newPostImage, setNewPostImage] = useState(''); // Image URL for new post
  const [createPostLoading, setCreatePostLoading] = useState(false); // Loading state for creating post
  const [createPostOpen, setCreatePostOpen] = useState(false); // Dialog open state for creating post
  const [page, setPage] = useState(1); // Current page for pagination
  const [hasMore, setHasMore] = useState(true); // If there are more posts to load
  const [loadingMore, setLoadingMore] = useState(false); // Loading state for "Load More"
  const [commentText, setCommentText] = useState({}); // Text for each comment input
  const [commentLoading, setCommentLoading] = useState({}); // Loading state for each comment

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch posts and enrich with likes, comments, user info
  const fetchPosts = async (pageNum = 1) => {
    try {
      const response = await getPosts(pageNum, 10);
      const postsData = response.data;
      
      // For each post, fetch likes, comments, and user info
      // Promise.all() allows you to run multiple promises at the same time (in parallel).
      const postsWithDetails = await Promise.all(
        postsData.map(async (post) => {
          const [likesResponse, commentsResponse] = await Promise.all([
            getLikesByPostId(post.id),
            getCommentsByPostId(post.id)
          ]);
          
          const userLike = await getLikeByUserAndPost(user.id, post.id);
          
          // Fetch user details for the post owner
          const postUserResponse = await getUserById(post.userId);
          const postUser = postUserResponse.data;

          // Fetch user details for each comment
          const commentsWithUsers = await Promise.all(
            commentsResponse.data.map(async (comment) => {
              const commentUserResponse = await getUserById(comment.userId);
              return { ...comment, user: commentUserResponse.data };
            })
          );
          
          return {
            ...post,
            user: postUser,
            likes: likesResponse.data,
            comments: commentsWithUsers,
            isLiked: userLike.data.length > 0,
            userLikeId: userLike.data[0]?.id
          };
        })
      );

      // Set posts for first page or append for next pages
      if (pageNum === 1) {
        setPosts(postsWithDetails);
      } else {
        setPosts(prev => [...prev, ...postsWithDetails]);
      }
      
      setHasMore(postsData.length === 10); // If less than 10, no more posts
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle creating a new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setCreatePostLoading(true);
    try {
      const postData = {
        userId: user.id,
        content: newPostContent,
        image: newPostImage,
        timestamp: new Date().toISOString()
      };

      await createPost(postData);
      setNewPostContent('');
      setNewPostImage('');
      setCreatePostOpen(false);
      fetchPosts(); // Refresh posts after creating
    } catch (error) {
      console.error('Error creating post:', error);
    }
    setCreatePostLoading(false);
  };

  // Handle liking or unliking a post
  const handleLike = async (post) => {
    try {
      if (post.isLiked) {
        // Unlike the post
        await deleteLike(post.userLikeId);
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                likes: p.likes.filter(like => like.id !== post.userLikeId),
                isLiked: false,
                userLikeId: null
              }
            : p
        ));
      } else {
        // Like the post
        const likeData = {
          postId: post.id,
          userId: user.id
        };
        const response = await createLike(likeData);
        
        // Notify post owner if not self
        if (post.userId !== user.id) {
          await createNotification({
            userId: post.userId,
            type: 'like',
            relatedId: post.id,
            message: `${user.name} liked your post`,
            timestamp: new Date().toISOString(),
            read: false
          });
        }

        setPosts(posts.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                likes: [...p.likes, response.data],
                isLiked: true,
                userLikeId: response.data.id
              }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle adding a comment to a post
  const handleComment = async (postId) => {
    if (!commentText[postId] || !commentText[postId].trim()) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const commentData = {
        postId,
        userId: user.id,
        text: commentText[postId],
        timestamp: new Date().toISOString()
      };
      const response = await createComment(commentData);
      
      // Fetch the user details for the new comment
      const commentUserResponse = await getUserById(user.id);
      const newCommentWithUser = { ...response.data, user: commentUserResponse.data };

      // Add new comment to post
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, comments: [...p.comments, newCommentWithUser] }
          : p
      ));
      setCommentText(prev => ({ ...prev, [postId]: '' }));

      // Create notification for post owner if not self
      const postOwner = posts.find(p => p.id === postId)?.user;
      if (postOwner && postOwner.id !== user.id) {
        await createNotification({
          userId: postOwner.id,
          type: 'comment',
          relatedId: postId,
          message: `${user.name} commented on your post`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

    } catch (error) {
      console.error('Error creating comment:', error);
    }
    setCommentLoading(prev => ({ ...prev, [postId]: false }));
  };

  // Load more posts for pagination
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  // Show loading spinner while fetching posts
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Create Post Button and Dialog */}
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-muted-foreground">
                  What's on your mind, {user?.name}?
                </div>
                <Plus className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          {/* Form for creating a new post */}
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">What's on your mind?</Label>
              <Textarea
                id="content"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL (optional)</Label>
              <Input
                id="image"
                type="url"
                value={newPostImage}
                onChange={(e) => setNewPostImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {/* Image preview if URL is entered */}
              {newPostImage && (
                <div className="mt-2">
                  <img 
                    src={newPostImage} 
                    alt="Preview" 
                    className="max-w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={createPostLoading}>
              {createPostLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* List of Posts */}
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              {/* Post owner info */}
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.user?.profilePicture} />
                  <AvatarFallback>{post.user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.user?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {/* More options button (future use) */}
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Post content and image */}
            <p className="text-foreground">{post.content}</p>
            {post.image && (
              <img 
                src={post.image} 
                alt="Post content" 
                className="w-full rounded-lg max-h-96 object-cover"
              />
            )}
            
            {/* Like, comment, share actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(post)}
                className={post.isLiked ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
                {post.likes.length}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                {post.comments.length}
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Comments Section */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-md font-semibold">Comments ({post.comments.length})</h4>
              {/* Show message if no comments */}
              {post.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
              ) : (
                post.comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user?.profilePicture} />
                      <AvatarFallback>{comment.user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-sm">{comment.user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}

              {/* Add comment input and button */}
              <div className="flex items-center space-x-2 pt-2">
                <Input
                  placeholder="Add a comment..."
                  value={commentText[post.id] || ''}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment(post.id);
                    }
                  }}
                />
                <Button 
                  size="icon" 
                  onClick={() => handleComment(post.id)}
                  disabled={commentLoading[post.id] || !commentText[post.id]?.trim()}
                >
                  {commentLoading[post.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load More Button for pagination */}
      {hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}

      {/* Message when no more posts */}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground">No more posts to load</p>
      )}
    </div>
  );
};

export default Feed;

