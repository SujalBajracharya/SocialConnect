import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Search as SearchIcon, 
  UserPlus, 
  UserMinus,
  Loader2
} from 'lucide-react';
import { 
  searchUsers, 
  getFollowRelation,
  createFollow,
  deleteFollow,
  createNotification
} from '../services/api';

// Search page for finding users and following/unfollowing them
const Search = () => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [searchQuery, setSearchQuery] = useState(''); // Search input value
  const [searchResults, setSearchResults] = useState([]); // List of users matching search
  const [loading, setLoading] = useState(false); // Loading state for search
  const [followStates, setFollowStates] = useState({}); // Follow status/loading for each user

  // Perform search when searchQuery changes
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Search users and check follow status for each
  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await searchUsers(searchQuery);
      // Exclude current user from results
      const users = response.data.filter(u => u.id !== user.id);
      
      // For each user, check if current user is following them
      const usersWithFollowStatus = await Promise.all(
        users.map(async (searchUser) => {
          const followRelation = await getFollowRelation(searchUser.id, user.id);
          return {
            ...searchUser,
            isFollowing: followRelation.data.length > 0,
            followRelationId: followRelation.data[0]?.id
          };
        })
      );

      setSearchResults(usersWithFollowStatus);
      
      // Initialize follow states for UI
      const states = {};
      usersWithFollowStatus.forEach(u => {
        states[u.id] = {
          isFollowing: u.isFollowing,
          followRelationId: u.followRelationId,
          loading: false
        };
      });
      setFollowStates(states);
      
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setLoading(false);
  };

  // Handle follow/unfollow button click for a user
  const handleFollow = async (targetUser) => {
    const currentState = followStates[targetUser.id];
    
    // Set loading state for this user
    setFollowStates(prev => ({
      ...prev,
      [targetUser.id]: { ...currentState, loading: true }
    }));

    try {
      if (currentState.isFollowing) {
        // Unfollow: delete follow relationship
        await deleteFollow(currentState.followRelationId);
        setFollowStates(prev => ({
          ...prev,
          [targetUser.id]: {
            isFollowing: false,
            followRelationId: null,
            loading: false
          }
        }));
      } else {
        // Follow: create follow relationship
        const followData = {
          userId: targetUser.id,
          followerId: user.id
        };
        const response = await createFollow(followData);
        
        // Create notification for followed user
        await createNotification({
          userId: targetUser.id,
          type: 'follow',
          relatedId: user.id,
          message: `${user.name} started following you`,
          timestamp: new Date().toISOString(),
          read: false
        });

        setFollowStates(prev => ({
          ...prev,
          [targetUser.id]: {
            isFollowing: true,
            followRelationId: response.data.id,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowStates(prev => ({
        ...prev,
        [targetUser.id]: { ...currentState, loading: false }
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Search input card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Show loading spinner while searching */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Show message if no users found */}
      {searchQuery && !loading && searchResults.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No users found for "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}

      {/* List of search results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((searchUser) => {
            const followState = followStates[searchUser.id] || {};
            
            return (
              <Card key={searchUser.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Link to user profile */}
                    <Link 
                      to={`/profile/${searchUser.id}`}
                      className="flex items-center space-x-3 flex-1 hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={searchUser.profilePicture} />
                        <AvatarFallback>{searchUser.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{searchUser.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{searchUser.email}</p>
                        {searchUser.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {searchUser.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                    
                    {/* Follow/Unfollow button */}
                    <Button
                      onClick={() => handleFollow(searchUser)}
                      variant={followState.isFollowing ? "outline" : "default"}
                      size="sm"
                      disabled={followState.loading}
                      className="ml-4"
                    >
                      {followState.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : followState.isFollowing ? (
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Show prompt if no search query entered */}
      {!searchQuery && (
        <Card>
          <CardContent className="p-6 text-center">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Start typing to search for users</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Search;

