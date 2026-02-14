# SocialConnect - Social Media Platform

A fully functional social media platform built with React and json-server, featuring authentication, posts, likes, comments, following system, notifications, and dark mode.

## Features

- **Authentication**: Login and registration with simulated backend
- **News Feed**: View posts from all users with infinite scroll
- **Post Management**: Create, edit, and delete posts with optional images
- **Interactions**: Like and comment on posts
- **User Profiles**: View and edit user profiles with follower/following counts
- **Follow System**: Follow/unfollow users with real-time updates
- **Search**: Find users by name
- **Notifications**: Get notified about likes, comments, and new followers
- **Dark/Light Mode**: Toggle between themes with preference persistence
- **Chat Feature**: One-on-one messaging system similar to Instagram
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, React Router, Tailwind CSS, shadcn/ui
- **Backend Simulation**: json-server (REST API from JSON file)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Prerequisites

- Node.js (v16 or higher)
- pnpm (or npm/yarn)

## Installation & Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the json-server (backend)**:
   ```bash
   pnpm run server
   ```
   This will start the API server on http://localhost:4000

3. **Start the React development server** (in a new terminal):
   ```bash
   pnpm run dev
   ```
   This will start the frontend on http://localhost:5173

4. **Open your browser** and navigate to http://localhost:5173

## Demo Accounts

You can use these pre-configured accounts to test the application:

- **Alice**: alice@mail.com / 1234
- **Bob**: bob@mail.com / 1234  
- **Carol**: carol@mail.com / 1234

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── Layout.jsx       # Main layout with navigation
│   └── ProtectedRoute.jsx # Route protection component
├── contexts/
│   ├── AuthContext.jsx  # Authentication context
│   └── ThemeContext.jsx # Theme management context
├── pages/
│   ├── Login.jsx        # Login page
│   ├── Register.jsx     # Registration page
│   ├── Feed.jsx         # Main news feed
│   ├── Profile.jsx      # User profile page
│   ├── Messages.jsx     # Chat interface (NEW!)
│   ├── Notifications.jsx # Notifications page
│   └── Search.jsx       # User search page
├── services/
│   └── api.js           # API service functions
├── App.jsx              # Main app component with routing
└── main.jsx             # App entry point
```

## API Endpoints

The json-server provides the following REST endpoints:

- `GET /users` - Get all users
- `GET /posts` - Get all posts (supports pagination)
- `GET /comments` - Get comments
- `GET /likes` - Get likes
- `GET /followers` - Get follow relationships
- `GET /notifications` - Get notifications
- `GET /chats` - Get chat conversations (NEW!)
- `GET /messages` - Get chat messages (NEW!)

All endpoints support standard REST operations (GET, POST, PUT, DELETE) and json-server query parameters for filtering, sorting, and pagination.

## Database Schema

The application uses a JSON file (`db.json`) as a database with the following structure:

- **users**: User accounts with profile information
- **posts**: User posts with content and images
- **comments**: Comments on posts
- **likes**: Like relationships between users and posts
- **followers**: Follow relationships between users
- **notifications**: User notifications for various activities
- **chats**: Chat conversations between users (NEW!)
- **messages**: Individual messages within chats (NEW!)

## Features in Detail

### Authentication
- Simulated login/registration system
- User session persistence with localStorage
- Protected routes requiring authentication

### Posts & Feed
- Create posts with text and optional image URLs
- Infinite scroll pagination
- Real-time like/unlike functionality
- Comment system with user attribution

### User Profiles
- View any user's profile with their posts
- Edit your own profile (name, bio, profile picture)
- Follow/unfollow functionality
- Follower and following counts

### Notifications
- Real-time notifications for likes, comments, and follows
- Mark notifications as read
- Badge indicators for unread notifications

### Search
- Search users by name
- Follow/unfollow directly from search results
- User profile previews

### Chat System (NEW!)
- One-on-one messaging similar to Instagram/WhatsApp
- Start conversations with any user
- Real-time message sending and receiving
- Chat list with last message preview
- Message history with timestamps
- User search within chat interface

### Theme System
- Dark and light mode toggle
- System preference detection
- Theme persistence across sessions

## Development

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run server` - Start json-server backend
- `pnpm run lint` - Run ESLint

### Adding New Features

1. **API Functions**: Add new API calls in `src/services/api.js`
2. **Components**: Create new components in `src/components/`
3. **Pages**: Add new pages in `src/pages/` and update routing in `App.jsx`
4. **Context**: Add new context providers in `src/contexts/`

## Production Deployment

1. Build the application:
   ```bash
   pnpm run build
   ```

2. The built files will be in the `dist/` directory

3. For the backend, you'll need to deploy json-server or replace it with a real backend API

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure json-server is running on port 4000
2. **API Connection**: Verify the API_BASE_URL in `src/services/api.js`
3. **Build Errors**: Clear node_modules and reinstall dependencies
4. **Image Loading**: Ensure image URLs are accessible and valid

### Development Tips

- Keep json-server running in a separate terminal
- Use browser dev tools to inspect API calls
- Check the console for any JavaScript errors
- Use React Developer Tools for debugging

## License

This project is for educational purposes and demonstration of React development skills.


## How to Run
terminal 1: npm run server

terminal 2: npm run dev

ctrl + c to shutdown ports
