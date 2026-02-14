import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Heart,
  MessageCircle,
  Share,
  UserPlus,
  UserMinus,
  Edit,
  Loader2
} from 'lucide-react';
import {
  getUserById,
  getPostsByUserId,
  getFollowersByUserId,
  getFollowingByUserId,
  getFollowRelation,
  createFollow,
  deleteFollow,
  updateUser,
  getLikesByPostId,
  getCommentsByPostId,
  getLikeByUserAndPost,
  createLike,
  deleteLike,
  createNotification
} from '../services/api';
import { formatDistanceToNow } from 'date-fns';

// Profile page displays user info, posts, followers, and allows editing or following
const Profile = () => {
  const { id } = useParams(); // Get profile user ID from route params
  const { user, updateUser: updateAuthUser } = useAuth(); // Get current user and update function from AuthContext

  // State for profile user info, posts, followers, following, and UI controls
  const [profileUser, setProfileUser] = useState(null); // Profile user data
  const [posts, setPosts] = useState([]); // Posts by profile user
  const [followers, setFollowers] = useState([]); // List of followers
  const [following, setFollowing] = useState([]); // List of users this profile is following
  const [isFollowing, setIsFollowing] = useState(false); // If current user follows this profile
  const [followRelationId, setFollowRelationId] = useState(null); // ID of follow relationship
  const [loading, setLoading] = useState(true); // Loading state for profile data
  const [editDialogOpen, setEditDialogOpen] = useState(false); // Dialog open state for editing profile
  const [editName, setEditName] = useState(''); // Edit form: name
  const [editBio, setEditBio] = useState(''); // Edit form: bio
  const [editProfilePicture, setEditProfilePicture] = useState(''); // Edit form: profile picture URL
  const [editLoading, setEditLoading] = useState(false); // Loading state for edit form

  const isOwnProfile = user?.id === parseInt(id); // Check if viewing own profile

  // Fetch profile data when ID or user changes
  useEffect(() => {
    fetchProfileData();
  }, [id, user]);

  // Fetch profile user info, posts, followers, following, and follow status
  const fetchProfileData = async () => {
    try {
      // Fetch user, posts, followers, following in parallel
      const [userResponse, postsResponse, followersResponse, followingResponse] = await Promise.all([
        getUserById(id),
        getPostsByUserId(id),
        getFollowersByUserId(id),
        getFollowingByUserId(id)
      ]);

      setProfileUser(userResponse.data);
      setFollowers(followersResponse.data);
      setFollowing(followingResponse.data);

      // Fetch likes and comments for each post
      const postsWithDetails = await Promise.all(
        postsResponse.data.map(async (post) => {
          const [likesResponse, commentsResponse] = await Promise.all([
            getLikesByPostId(post.id),
            getCommentsByPostId(post.id)
          ]);
          
          // Check if current user liked this post
          const userLike = await getLikeByUserAndPost(user.id, post.id);
          
          return {
            ...post,
            likes: likesResponse.data,
            comments: commentsResponse.data,
            isLiked: userLike.data.length > 0,
            userLikeId: userLike.data[0]?.id
          };
        })
      );

      setPosts(postsWithDetails);

      // Check if current user is following this profile (if not own profile)
      if (!isOwnProfile && user) {
        const followRelation = await getFollowRelation(id, user.id);
        if (followRelation.data.length > 0) {
          setIsFollowing(true);
          setFollowRelationId(followRelation.data[0].id);
        } else {
          setIsFollowing(false);
          setFollowRelationId(null);
        }
      }

      // Set edit form values if viewing own profile
      if (isOwnProfile) {
        setEditName(userResponse.data.name);
        setEditBio(userResponse.data.bio || '');
        setEditProfilePicture(userResponse.data.profilePicture || '');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setLoading(false);
    }
  };

  // Handle follow/unfollow button click
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        // Unfollow: delete follow relationship
        await deleteFollow(followRelationId);
        setIsFollowing(false);
        setFollowRelationId(null);
        setFollowers(followers.filter(f => f.followerId !== user.id));
      } else {
        // Follow: create follow relationship
        const followData = {
          userId: parseInt(id),
          followerId: user.id
        };
        const response = await createFollow(followData);
        setIsFollowing(true);
        setFollowRelationId(response.data.id);
        setFollowers([...followers, { ...response.data, follower: user }]);

        // Create notification for profile user
        await createNotification({
          userId: parseInt(id),
          type: 'follow',
          relatedId: user.id,
          message: `${user.name} started following you`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Handle profile edit form submission
  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const updatedData = {
        ...profileUser,
        name: editName,
        bio: editBio,
        profilePicture: editProfilePicture
      };

      await updateUser(user.id, updatedData); // Update user in backend
      setProfileUser(updatedData); // Update local state
      updateAuthUser(updatedData); // Update global auth context
      setEditDialogOpen(false); // Close dialog
    } catch (error) {
      console.error('Error updating profile:', error);
    }

    setEditLoading(false);
  };

  // Handle like/unlike for a post
  const handleLike = async (post) => {
    try {
      if (post.isLiked) {
        // Unlike: delete like
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
        // Like: create like
        const likeData = {
          postId: post.id,
          userId: user.id
        };
        const response = await createLike(likeData);
        
        // Create notification for post owner if not self
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

  // Show loading spinner while profile data is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show message if user not found
  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Profile Header: avatar, name, bio, stats, edit/follow button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* User avatar */}
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileUser.profilePicture} />
              <AvatarFallback className="text-2xl">{profileUser.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            
            {/* User info and stats */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profileUser.name}</h1>
              <p className="text-muted-foreground mt-1">{profileUser.email}</p>
              {profileUser.bio && (
                <p className="mt-3 text-foreground">{profileUser.bio}</p>
              )}
              
              {/* Stats: posts, followers, following */}
              <div className="flex justify-center sm:justify-start space-x-6 mt-4">
                <div className="text-center">
                  <p className="font-semibold">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{followers.length}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{following.length}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
            
            {/* Edit profile button (if own profile) or follow/unfollow button */}
            <div className="flex space-x-2">
              {isOwnProfile ? (
                // Edit profile dialog
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    {/* Edit profile form */}
                    <form onSubmit={handleEditProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profilePicture">Profile Picture URL</Label>
                        <Input
                          id="profilePicture"
                          type="url"
                          value={editProfilePicture}
                          onChange={(e) => setEditProfilePicture(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={editLoading}>
                        {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : (
                // Follow/unfollow button for other users
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Posts</h2>
        {/* Show message if no posts */}
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No posts yet</p>
            </CardContent>
          </Card>
        ) : (
          // List of posts
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={profileUser.profilePicture} />
                      <AvatarFallback>{profileUser.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profileUser.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;


