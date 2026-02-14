import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  MessageCircle, 
  Send, 
  Plus,
  Search,
  Loader2
} from 'lucide-react';
import { 
  getChatsByUserId,
  getUsers,
  getChatByParticipants,
  createChat,
  getMessagesByChatId,
  createMessage,
  getUserById
} from '../services/api';
import { formatDistanceToNow } from 'date-fns';

// Messages page for chat functionality between users
const Messages = () => {
  const { user } = useAuth(); // Get current user from AuthContext

  // State for chat list, selected chat, and messages
  const [chats, setChats] = useState([]); // All chats for the user
  const [selectedChat, setSelectedChat] = useState(null); // Currently selected chat
  const [messages, setMessages] = useState([]); // Messages in the selected chat

  // State for message input and loading indicators
  const [newMessage, setNewMessage] = useState(''); // Message input value
  const [loading, setLoading] = useState(true); // Loading state for chats
  const [messageLoading, setMessageLoading] = useState(false); // Loading state for messages
  const [sendLoading, setSendLoading] = useState(false); // Loading state for sending message

  // State for new chat dialog and user search
  const [newChatOpen, setNewChatOpen] = useState(false); // Dialog open state for new chat
  const [searchQuery, setSearchQuery] = useState(''); // Search input for users
  const [searchResults, setSearchResults] = useState([]); // Search results for users
  const [searchLoading, setSearchLoading] = useState(false); // Loading state for user search

  // Fetch all chats for the user on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  // Fetch chats and enrich with participant info and last message
  const fetchChats = async () => {
    try {
      const response = await getChatsByUserId(user.id);
      const chatsData = response.data;
      
      // For each chat, get the other participant and last message
      const enhancedChats = await Promise.all(
        chatsData.map(async (chat) => {
          const otherUserId = chat.user1Id === user.id ? chat.user2Id : chat.user1Id;
          const otherUserResponse = await getUserById(otherUserId);
          const otherUser = otherUserResponse.data;
          
          // Get last message for preview
          const messagesResponse = await getMessagesByChatId(chat.id);
          const lastMessage = messagesResponse.data[messagesResponse.data.length - 1];
          
          return {
            ...chat,
            otherUser,
            lastMessage
          };
        })
      );
      
      setChats(enhancedChats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setLoading(false);
    }
  };

  // Fetch all messages for a chat
  const fetchMessages = async (chatId) => {
    setMessageLoading(true);
    try {
      const response = await getMessagesByChatId(chatId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setMessageLoading(false);
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setSendLoading(true);
    try {
      const messageData = {
        chatId: selectedChat.id,
        senderId: user.id,
        text: newMessage,
        timestamp: new Date().toISOString()
      };

      const response = await createMessage(messageData);
      const newMessageWithSender = { ...response.data, sender: user };
      
      setMessages(prev => [...prev, newMessageWithSender]);
      setNewMessage('');
      
      // Update chat's last message in the chat list
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: newMessageWithSender }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setSendLoading(false);
  };

  // Search users to start a new chat
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await getUsers();
      // Filter users by name, exclude self
      const filteredUsers = response.data.filter(u => 
        u.id !== user.id && 
        u.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setSearchLoading(false);
  };

  // Start a new chat with a selected user or select existing chat
  const startNewChat = async (otherUser) => {
    try {
      // Check if chat already exists between users
      const existingChatResponse = await getChatByParticipants(user.id, otherUser.id);
      
      if (existingChatResponse.data.length > 0) {
        // Chat exists, select it
        const existingChat = existingChatResponse.data[0];
        const enhancedChat = {
          ...existingChat,
          otherUser,
          lastMessage: null
        };
        setSelectedChat(enhancedChat);
        setNewChatOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        return;
      }

      // Create new chat if not exists
      const chatData = {
        user1Id: user.id,
        user2Id: otherUser.id,
        createdAt: new Date().toISOString()
      };

      const response = await createChat(chatData);
      const newChat = {
        ...response.data,
        otherUser,
        lastMessage: null
      };

      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
      setNewChatOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  // Show loading spinner while chats are loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        {/* Chat List Sidebar */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Messages</h2>
                {/* Button to open dialog for starting a new chat */}
                <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Chat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* User search input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchUsers(e.target.value);
                          }}
                          className="pl-10"
                        />
                      </div>
                      {/* Search results list */}
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {searchLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          searchResults.map(searchUser => (
                            <div
                              key={searchUser.id}
                              className="flex items-center space-x-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                              onClick={() => startNewChat(searchUser)}
                            >
                              <Avatar>
                                <AvatarImage src={searchUser.profilePicture} />
                                <AvatarFallback>{searchUser.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{searchUser.name}</p>
                                <p className="text-sm text-muted-foreground">{searchUser.email}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {/* Show message if no chats */}
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start a new chat to begin messaging</p>
                  </div>
                ) : (
                  // List of chats
                  chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`flex items-center space-x-3 p-4 hover:bg-accent cursor-pointer ${
                        selectedChat?.id === chat.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <Avatar>
                        <AvatarImage src={chat.otherUser?.profilePicture} />
                        <AvatarFallback>{chat.otherUser?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.otherUser?.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage ? chat.lastMessage.text : 'Start a conversation'}
                        </p>
                      </div>
                      {/* Show time since last message */}
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header with participant info */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedChat.otherUser?.profilePicture} />
                      <AvatarFallback>{selectedChat.otherUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedChat.otherUser?.name}</p>
                      <p className="text-sm text-muted-foreground">Active now</p>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages list */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  {messageLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No messages yet</p>
                      <p>Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Render each message, align right if sent by current user */}
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderId === user.id 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                {/* Message Input Box */}
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={sendLoading || !newMessage.trim()}>
                      {sendLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              // Show prompt if no chat is selected
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p>Choose from your existing conversations or start a new one</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;

