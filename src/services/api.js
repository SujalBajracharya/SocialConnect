// src/services/api.js

// ❌ REMOVED: axios (no longer using JSON-server)
// import axios from "axios";

// ✅ ADDED: Firebase Firestore
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";

// Helper to simulate axios response format so we don't break existing components
const toAxiosRes = (data) => ({ data });

// ==================== Users API ====================

// Get all users
export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return toAxiosRes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

// Get a user by ID
export const getUserById = async (id) => {
  const docSnap = await getDoc(doc(db, "users", String(id)));
  return toAxiosRes({ id: docSnap.id, ...docSnap.data() });
};

// Update user info by ID
export const updateUser = async (id, userData) => {
  const userRef = doc(db, "users", String(id));
  await updateDoc(userRef, userData);
  const updated = await getDoc(userRef);
  return toAxiosRes({ id: updated.id, ...updated.data() });
};

// Delete a user by ID (admin only)
export const deleteUser = async (id) => {
  await deleteDoc(doc(db, "users", String(id)));
  return toAxiosRes({});
};

// ==================== Posts API ====================

// Get paginated posts, sorted by timestamp, with user info expanded
export const getPosts = async (page = 1, limit = 10) => {
  // Using basic firestore query to fetch posts and order by timestamp
  const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(postsQuery);
  const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Apply pagination manually client-side (for simplicity handling _page logic)
  const startIndex = (page - 1) * limit;
  const paginatedPosts = allPosts.slice(startIndex, startIndex + limit);

  // Simulate json-server's _expand=user
  const postsWithUser = await Promise.all(paginatedPosts.map(async (post) => {
    const userSnap = await getDoc(doc(db, "users", String(post.userId)));
    return { ...post, user: { id: userSnap.id, ...userSnap.data() } };
  }));

  return toAxiosRes(postsWithUser);
};

// Get a single post by ID, with user info expanded
export const getPostById = async (id) => {
  const docSnap = await getDoc(doc(db, "posts", String(id)));
  const post = { id: docSnap.id, ...docSnap.data() };

  // Expand user info
  const userSnap = await getDoc(doc(db, "users", String(post.userId)));
  post.user = { id: userSnap.id, ...userSnap.data() };

  return toAxiosRes(post);
};

// Create a new post
export const createPost = async (postData) => {
  const docRef = await addDoc(collection(db, "posts"), postData);
  return toAxiosRes({ id: docRef.id, ...postData });
};

// Update a post by ID
export const updatePost = async (id, postData) => {
  const postRef = doc(db, "posts", String(id));
  await updateDoc(postRef, postData);
  const updated = await getDoc(postRef);
  return toAxiosRes({ id: updated.id, ...updated.data() });
};

// Delete a post by ID (admin only)
export const deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", String(id)));
  return toAxiosRes({});
};

// Get all posts by a specific user, sorted by timestamp
export const getPostsByUserId = async (userId) => {
  const q = query(collection(db, "posts"), where("userId", "==", String(userId)));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return toAxiosRes(posts);
};

// ==================== Comments API ====================

// Get all comments for a post, with user info expanded, sorted by timestamp
export const getCommentsByPostId = async (postId) => {
  const q = query(collection(db, "comments"), where("postId", "==", String(postId)));
  const snapshot = await getDocs(q);
  const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Expand user info
  const commentsWithUser = await Promise.all(comments.map(async (comment) => {
    const userSnap = await getDoc(doc(db, "users", String(comment.userId)));
    return { ...comment, user: { id: userSnap.id, ...userSnap.data() } };
  }));

  return toAxiosRes(commentsWithUser);
};

// Create a new comment
export const createComment = async (commentData) => {
  const docRef = await addDoc(collection(db, "comments"), commentData);
  return toAxiosRes({ id: docRef.id, ...commentData });
};

// Delete a comment by ID (admin only)
export const deleteComment = async (id) => {
  await deleteDoc(doc(db, "comments", String(id)));
  return toAxiosRes({});
};

// ==================== Likes API ====================

// Get all likes for a post
export const getLikesByPostId = async (postId) => {
  const q = query(collection(db, "likes"), where("postId", "==", String(postId)));
  const snapshot = await getDocs(q);
  return toAxiosRes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

// Create a new like
export const createLike = async (likeData) => {
  const docRef = await addDoc(collection(db, "likes"), likeData);
  return toAxiosRes({ id: docRef.id, ...likeData });
};

// Delete a like by ID
export const deleteLike = async (id) => {
  await deleteDoc(doc(db, "likes", String(id)));
  return toAxiosRes({});
};

// Get a like by user and post (to check if user already liked the post)
export const getLikeByUserAndPost = async (userId, postId) => {
  const q = query(collection(db, "likes"), where("userId", "==", String(userId)), where("postId", "==", String(postId)));
  const snapshot = await getDocs(q);
  return toAxiosRes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

// ==================== Followers API ====================

// Get all followers for a user, with follower info expanded
export const getFollowersByUserId = async (userId) => {
  const q = query(collection(db, "followers"), where("userId", "==", String(userId)));
  const snapshot = await getDocs(q);
  const followers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Expand follower info
  const expanded = await Promise.all(followers.map(async (f) => {
    const followerSnap = await getDoc(doc(db, "users", String(f.followerId)));
    return { ...f, follower: { id: followerSnap.id, ...followerSnap.data() } };
  }));
  return toAxiosRes(expanded);
};

// Get all users a user is following, with user info expanded
export const getFollowingByUserId = async (userId) => {
  const q = query(collection(db, "followers"), where("followerId", "==", String(userId)));
  const snapshot = await getDocs(q);
  const following = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Expand user info
  const expanded = await Promise.all(following.map(async (f) => {
    const userSnap = await getDoc(doc(db, "users", String(f.userId)));
    return { ...f, user: { id: userSnap.id, ...userSnap.data() } };
  }));
  return toAxiosRes(expanded);
};

// Create a new follow relationship
export const createFollow = async (followData) => {
  const docRef = await addDoc(collection(db, "followers"), followData);
  return toAxiosRes({ id: docRef.id, ...followData });
};

// Delete a follow relationship by ID
export const deleteFollow = async (id) => {
  await deleteDoc(doc(db, "followers", String(id)));
  return toAxiosRes({});
};

// Get a specific follow relationship between two users
export const getFollowRelation = async (userId, followerId) => {
  const q = query(collection(db, "followers"), where("userId", "==", String(userId)), where("followerId", "==", String(followerId)));
  const snapshot = await getDocs(q);
  return toAxiosRes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};

// ==================== Notifications API ====================

// Get all notifications for a user, sorted by timestamp
export const getNotificationsByUserId = async (userId) => {
  const q = query(collection(db, "notifications"), where("userId", "==", String(userId)));
  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return toAxiosRes(notifications);
};

// Create a new notification
export const createNotification = async (notificationData) => {
  const docRef = await addDoc(collection(db, "notifications"), notificationData);
  return toAxiosRes({ id: docRef.id, ...notificationData });
};

// Update a notification by ID
export const updateNotification = async (id, notificationData) => {
  const notifRef = doc(db, "notifications", String(id));
  await updateDoc(notifRef, notificationData);
  const updated = await getDoc(notifRef);
  return toAxiosRes({ id: updated.id, ...updated.data() });
};

// Delete a notification by ID
export const deleteNotification = async (id) => {
  await deleteDoc(doc(db, "notifications", String(id)));
  return toAxiosRes({});
};

// ==================== Search API ====================

// Search users by name (case-insensitive, partial match)
export const searchUsers = async (queryStr) => {
  // Client side filtering since firestore doesn't natively support partial string matches out of the box
  const snapshot = await getDocs(collection(db, "users"));
  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const filtered = users.filter(user => user.name && user.name.toLowerCase().includes(queryStr.toLowerCase()));
  return toAxiosRes(filtered);
};

// ==================== Chat API ====================

// Get all chats for a user
export const getChatsByUserId = async (userId) => {
  const snapshot = await getDocs(collection(db, "chats"));
  const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const filteredChats = chats.filter(
    (chat) => chat.user1Id === String(userId) || chat.user2Id === String(userId)
  );
  return toAxiosRes(filteredChats);
};

// Get a chat by its ID
export const getChatById = async (chatId) => {
  const docSnap = await getDoc(doc(db, "chats", String(chatId)));
  return toAxiosRes({ id: docSnap.id, ...docSnap.data() });
};

// Create a new chat
export const createChat = async (chatData) => {
  const docRef = await addDoc(collection(db, "chats"), chatData);
  return toAxiosRes({ id: docRef.id, ...chatData });
};

// Get a chat by participant IDs
export const getChatByParticipants = async (user1Id, user2Id) => {
  const snapshot = await getDocs(collection(db, "chats"));
  const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const filteredChats = chats.filter(
    (chat) =>
      (chat.user1Id === String(user1Id) && chat.user2Id === String(user2Id)) ||
      (chat.user1Id === String(user2Id) && chat.user2Id === String(user1Id))
  );
  return toAxiosRes(filteredChats);
};

// ==================== Messages API ====================

// Get all messages for a chat, sorted by timestamp
export const getMessagesByChatId = async (chatId) => {
  const q = query(collection(db, "messages"), where("chatId", "==", String(chatId)));
  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return toAxiosRes(messages);
};

// Create a new message
export const createMessage = async (messageData) => {
  const docRef = await addDoc(collection(db, "messages"), messageData);
  return toAxiosRes({ id: docRef.id, ...messageData });
};
