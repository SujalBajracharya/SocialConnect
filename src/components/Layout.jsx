import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Home,
  User,
  Bell,
  Search,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  MessageCircle,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getNotificationsByUserId } from "../services/api";

// Layout component wraps the main app and provides navigation, theme, and user controls
// allows for children like Feed, Profile, Messages, etc to be passed as a children
const Layout = ({ children }) => {
  // Get user and logout function from AuthContext
  const { user, logout } = useAuth();
  // Get current theme and toggle function from ThemeContext
  const { theme, toggleTheme } = useTheme();
  // React Router hooks for navigation and current location
  const navigate = useNavigate();
  const location = useLocation();
  // State for unread notifications
  const [notifications, setNotifications] = useState([]);
  // State for mobile menu open/close
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications when user changes (on login/logout)
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Fetch unread notifications for the current user
  const fetchNotifications = async () => {
    try {
      /*
          response.data = [
            { id: 1, message: "Hi", read: true },
            { id: 2, message: "Hello", read: false },
            { id: 3, message: "Hey", read: false }
          ];
      */
      const response = await getNotificationsByUserId(user.id);
      // Filter only unread notifications
      const unreadNotifications = response.data.filter((n) => !n.read);
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Handle user logout and redirect to login page
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper to check if a nav item is active based on current path
  // https://example.com/home   home = location.pathname
  const isActive = (path) => location.pathname === path;

  // Navigation items for sidebar and mobile menu
  const navItems = [
    { path: "/feed", icon: Home, label: "Feed" },
    { path: `/profile/${user?.id}`, icon: User, label: "Profile" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    {
      path: "/notifications",
      icon: Bell,
      label: "Notifications",
      badge: notifications.length,
    },
    { path: "/search", icon: Search, label: "Search" },
    // Show admin link only if user is admin
    // user?.isAdmin = checks if the user exists and if isAdmin is true.
    // const b = [0, ...a, 3]; // [0, 1, 2, 3]
    ...(user?.isAdmin
      ? [{ path: "/admin", icon: Shield, label: "Admin" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header: shows app name and menu button */}
      <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
        <Link to="/feed" className="text-xl font-bold text-primary">
          SocialConnect
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {/* Show menu or close icon based on menu state */}
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />   // from lucide-react
          ) : (
            <Menu className="h-5 w-5" />  // from lucide-react
          )}
        </Button>
      </div>

      {/* Mobile Menu: slides down when menu is open */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border p-4">
          <div className="flex flex-col space-y-2">
            {/* Render navigation items */}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-card border-r border-border">
            <div className="flex items-center h-16 px-6 border-b border-border">
              <Link to="/feed" className="text-xl font-bold text-primary">
                SocialConnect
              </Link>
            </div>

            <div className="flex-1 flex flex-col justify-between p-4">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profilePicture} />
                    {/* user?.name → optional chaining ensures no error if user is undefined. */}
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={toggleTheme}>
                    {theme === "light" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    <span className="ml-2">
                      {theme === "light" ? "Dark" : "Light"}
                    </span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
