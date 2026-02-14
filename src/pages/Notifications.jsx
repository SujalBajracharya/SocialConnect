import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Heart, MessageCircle, UserPlus, Loader2 } from 'lucide-react';
import { 
  getNotificationsByUserId, 
  updateNotification,
  getUserById,
  getPostById
} from '../services/api';
import { formatDistanceToNow } from 'date-fns';

// Notifications page displays all notifications for the current user
const Notifications = () => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [notifications, setNotifications] = useState([]); // List of notifications
  const [loading, setLoading] = useState(true); // Loading state for notifications

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch notifications and enrich with related user/post info
  const fetchNotifications = async () => {
    try {
      const response = await getNotificationsByUserId(user.id);
      const notificationsData = response.data;

      // For each notification, fetch related user or post if needed
      const notificationsWithDetails = await Promise.all(
        notificationsData.map(async (notification) => {
          let relatedUser = null;
          let relatedPost = null;

          // If notification is a follow, get the user who followed
          if (notification.type === 'follow') {
            const userResponse = await getUserById(notification.relatedId);
            relatedUser = userResponse.data;
          } 
          // If notification is a like or comment, get the related post
          else if (notification.type === 'like' || notification.type === 'comment') {
            const postResponse = await getPostById(notification.relatedId);
            relatedPost = postResponse.data;
          }

          return {
            ...notification,
            relatedUser,
            relatedPost
          };
        })
      );

      setNotifications(notificationsWithDetails); // Set notifications with extra info
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        await updateNotification(notificationId, { ...notification, read: true });
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  // Get content for notification based on type
  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <div>
            <p className="font-medium">{notification.message}</p>
            {notification.relatedPost && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                "{notification.relatedPost.content}"
              </p>
            )}
          </div>
        );
      case 'comment':
        return (
          <div>
            <p className="font-medium">{notification.message}</p>
            {notification.relatedPost && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                "{notification.relatedPost.content}"
              </p>
            )}
          </div>
        );
      case 'follow':
        return (
          <div>
            <p className="font-medium">{notification.message}</p>
          </div>
        );
      default:
        return <p className="font-medium">{notification.message}</p>;
    }
  };

  // Show loading spinner while notifications are loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header card for notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
      </Card>

      {/* Show message if no notifications */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        // List of notifications
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-colors ${
                !notification.read ? 'bg-accent/50' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Notification icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Notification message and related post content */}
                  <div className="flex-1 min-w-0">
                    {getNotificationContent(notification)}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {/* Badge for unread and avatar for related user */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {!notification.read && (
                      <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                    )}
                    {notification.relatedUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={notification.relatedUser.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {notification.relatedUser.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Button to mark all notifications as read */}
      {notifications.length > 0 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => {
              const unreadNotifications = notifications.filter(n => !n.read);
              unreadNotifications.forEach(n => markAsRead(n.id));
            }}
            disabled={notifications.every(n => n.read)}
          >
            Mark All as Read
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notifications;

