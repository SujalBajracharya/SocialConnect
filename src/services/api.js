import axios from "axios";

// Base URL for the backend API
const API_BASE_URL = "http://localhost:4000";

// Create an Axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// ==================== Users API ====================

// Get all users
export const getUsers = () => api.get("/users");

// Get a user by ID
export const getUserById = (id) => api.get(`/users/${id}`);

// Update user info by ID
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);

// Delete a user by ID (admin only)
export const deleteUser = (id) => api.delete(`/users/${id}`); // Admin function

// ==================== Posts API ====================

// Get paginated posts, sorted by timestamp, with user info expanded
/*  {
      "id": 15,
      "title": "New Post",
      "content": "Hello world",
      "timestamp": 12,
      "userId": 3,
      "user": {      // <-- added because of _expand=user
        "id": 3,
        "name": "Sujal",
        "email": "sujal@example.com"
      }
    }
*/
export const getPosts = (page = 1, limit = 10) => api.get(`/posts?_page=${page}&_limit=${limit}&_sort=timestamp&_order=desc&_expand=user`);

// Get a single post by ID, with user info expanded
export const getPostById = (id) => api.get(`/posts/${id}?_expand=user`);

// Create a new post
export const createPost = (postData) => api.post("/posts", postData);

// Update a post by ID
export const updatePost = (id, postData) => api.put(`/posts/${id}`, postData);

// Delete a post by ID (admin only)
export const deletePost = (id) => api.delete(`/posts/${id}`); // Admin function

// Get all posts by a specific user, sorted by timestamp
export const getPostsByUserId = (userId) =>
  api.get(`/posts?userId=${userId}&_sort=timestamp&_order=desc`);

// ==================== Comments API ====================

// Get all comments for a post, with user info expanded, sorted by timestamp
export const getCommentsByPostId = (postId) =>
  api.get(`/comments?postId=${postId}&_expand=user&_sort=timestamp&_order=asc`);

// Create a new comment
export const createComment = (commentData) =>
  api.post("/comments", commentData);

// Delete a comment by ID (admin only)
export const deleteComment = (id) => api.delete(`/comments/${id}`); // Admin function

// ==================== Likes API ====================

// Get all likes for a post
export const getLikesByPostId = (postId) => api.get(`/likes?postId=${postId}`);

// Create a new like
export const createLike = (likeData) => api.post("/likes", likeData);

// Delete a like by ID
export const deleteLike = (id) => api.delete(`/likes/${id}`);

// Get a like by user and post (to check if user already liked the post)
export const getLikeByUserAndPost = (userId, postId) =>
  api.get(`/likes?userId=${userId}&postId=${postId}`);

// ==================== Followers API ====================

// Get all followers for a user, with follower info expanded
export const getFollowersByUserId = (userId) =>
  api.get(`/followers?userId=${userId}&_expand=follower`);

// Get all users a user is following, with user info expanded
export const getFollowingByUserId = (userId) =>
  api.get(`/followers?followerId=${userId}&_expand=user`);

// Create a new follow relationship
export const createFollow = (followData) => api.post("/followers", followData);

// Delete a follow relationship by ID
export const deleteFollow = (id) => api.delete(`/followers/${id}`);

// Get a specific follow relationship between two users
export const getFollowRelation = (userId, followerId) =>
  api.get(`/followers?userId=${userId}&followerId=${followerId}`);

// ==================== Notifications API ====================

// Get all notifications for a user, sorted by timestamp
export const getNotificationsByUserId = (userId) =>
  api.get(`/notifications?userId=${userId}&_sort=timestamp&_order=desc`);

// Create a new notification
export const createNotification = (notificationData) =>
  api.post("/notifications", notificationData);

// Update a notification by ID
export const updateNotification = (id, notificationData) =>
  api.put(`/notifications/${id}`, notificationData);

// Delete a notification by ID
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// ==================== Search API ====================

// Search users by name (case-insensitive, partial match)
export const searchUsers = (query) => api.get(`/users?name_like=${query}`);

// ==================== Chat API ====================

// Get all chats for a user (client-side filter due to json-server limitations)
export const getChatsByUserId = (userId) => {
  // Get all chats and filter on client side since json-server doesn't support complex OR queries
  return api.get("/chats").then((response) => {
    const filteredChats = response.data.filter(
      (chat) => chat.user1Id === userId || chat.user2Id === userId
    );
    return { data: filteredChats };
  });
};

// Get a chat by its ID
export const getChatById = (chatId) => api.get(`/chats/${chatId}`);

// Create a new chat
export const createChat = (chatData) => api.post("/chats", chatData);

// Get a chat by participant IDs (client-side filter)
export const getChatByParticipants = (user1Id, user2Id) => {
  return api.get("/chats").then((response) => {
    const filteredChats = response.data.filter(
      (chat) =>
        (chat.user1Id === user1Id && chat.user2Id === user2Id) ||
        (chat.user1Id === user2Id && chat.user2Id === user1Id)
    );
    return { data: filteredChats };
  });
};

// ==================== Messages API ====================

// Get all messages for a chat, sorted by timestamp
export const getMessagesByChatId = (chatId) =>
  api.get(`/messages?chatId=${chatId}&_sort=timestamp&_order=asc`);

// Create a new message
export const createMessage = (messageData) =>
  api.post("/messages", messageData);

// Export the Axios instance for custom requests if needed
export default api;
