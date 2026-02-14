import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Trash2, 
  Shield, 
  ShieldOff,
  Loader2
} from 'lucide-react';
import { 
  getUsers, 
  getPosts, 
  getCommentsByPostId,
  deleteUser,
  deletePost,
  deleteComment,
  updateUser
} from '../services/api';
import { formatDistanceToNow } from 'date-fns';

// Admin page for managing users, posts, and comments
const Admin = () => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [users, setUsers] = useState([]); // List of all users
  const [posts, setPosts] = useState([]); // List of all posts
  const [comments, setComments] = useState([]); // List of all comments
  const [loading, setLoading] = useState(true); // Loading state for initial data
  const [actionLoading, setActionLoading] = useState(null); // Loading state for admin actions

  // Fetch all users, posts, and comments on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch users, posts, and comments for admin view
  const fetchData = async () => {
    try {
      // Fetch users and posts in parallel
      const [usersResponse, postsResponse] = await Promise.all([
        getUsers(),
        getPosts(1, 100) // Get more posts for admin view
      ]);
      
      setUsers(usersResponse.data);
      setPosts(postsResponse.data);
      
      // Fetch all comments for all posts
      const allComments = [];
      for (const post of postsResponse.data) {
        try {
          const commentsResponse = await getCommentsByPostId(post.id);
          allComments.push(...commentsResponse.data);
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error);
        }
      }
      setComments(allComments);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  // Delete a user (admin only)
  const handleDeleteUser = async (userId) => {
    setActionLoading(`user-${userId}`);
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
    setActionLoading(null);
  };

  // Ban or unban a user (admin only)
  const handleBanUser = async (userId) => {
    setActionLoading(`ban-${userId}`);
    try {
      const userToUpdate = users.find(u => u.id === userId);
      await updateUser(userId, { ...userToUpdate, isBanned: !userToUpdate.isBanned });
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, isBanned: !u.isBanned }
          : u
      ));
    } catch (error) {
      console.error('Error banning/unbanning user:', error);
    }
    setActionLoading(null);
  };

  // Delete a post (admin only)
  const handleDeletePost = async (postId) => {
    setActionLoading(`post-${postId}`);
    try {
      await deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
    setActionLoading(null);
  };

  // Delete a comment (admin only)
  const handleDeleteComment = async (commentId) => {
    setActionLoading(`comment-${commentId}`);
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
    setActionLoading(null);
  };

  // Show access denied if user is not admin
  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Admin panel header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, posts, and comments</p>
      </div>

      {/* Tabs for users, posts, and comments management */}
      {/* <Tabs> manages the active tab state internally*/}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab: Manage users, ban/unban, delete */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(userData => (
                  <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={userData.profilePicture} />
                        <AvatarFallback>{userData.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{userData.name}</p>
                          {userData.isAdmin && <Badge variant="secondary">Admin</Badge>}
                          {userData.isBanned && <Badge variant="destructive">Banned</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{userData.email}</p>
                        <p className="text-sm text-muted-foreground">{userData.bio}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Ban/Unban and Delete buttons for non-admin users */}
                      {!userData.isAdmin && (
                        <>
                          {/* Ban/Unban user dialog */}
                          <AlertDialog>
                            {/*asChild means it uses the child element (<Button> in this case) as the trigger. */}
                            {/* AlertDialogTrigger listens for a click event. */}
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={actionLoading === `ban-${userData.id}`}
                              >
                                {actionLoading === `ban-${userData.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : userData.isBanned ? (
                                  <>
                                    <Shield className="h-4 w-4 mr-1" />
                                    Unban
                                  </>
                                ) : (
                                  <>
                                    <ShieldOff className="h-4 w-4 mr-1" />
                                    Ban
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {userData.isBanned ? 'Unban User' : 'Ban User'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {userData.isBanned 
                                    ? `Are you sure you want to unban ${userData.name}? They will regain access to the platform.`
                                    : `Are you sure you want to ban ${userData.name}? They will lose access to the platform.`
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBanUser(userData.id)}>
                                  {userData.isBanned ? 'Unban' : 'Ban'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Delete user dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={actionLoading === `user-${userData.id}`}
                              >
                                {actionLoading === `user-${userData.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {userData.name}? This action cannot be undone and will remove all their posts and comments.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(userData.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab: Manage posts, delete */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Post Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map(post => {
                  const postUser = users.find(u => u.id == post.userId);
                  return (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={postUser?.profilePicture} />
                            <AvatarFallback>{postUser?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{postUser?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {/* Delete post dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={actionLoading === `post-${post.id}`}
                            >
                              {actionLoading === `post-${post.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this post? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p className="mb-3">{post.content}</p>
                      {post.image && (
                        <img 
                          src={post.image} 
                          alt="Post" 
                          className="w-full max-w-md rounded-lg"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab: Manage comments, delete */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.map(comment => {
                  const commentUser = users.find(u => u.id == comment.userId);
                  const post = posts.find(p => p.id == comment.postId);
                  return (
                    <div key={comment.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={commentUser?.profilePicture} />
                            <AvatarFallback>{commentUser?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{commentUser?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              On post: "{post?.content?.substring(0, 50)}..."
                            </p>
                          </div>
                        </div>
                        {/* Delete comment dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={actionLoading === `comment-${comment.id}`}
                            >
                              {actionLoading === `comment-${comment.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p>{comment.text}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;

