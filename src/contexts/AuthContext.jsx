import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component to wrap the app and provide auth state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores the current user object
  const [loading, setLoading] = useState(true); // Tracks loading state

  // On mount, check localStorage for a logged-in user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function: checks credentials against backend
  const login = async (email, password) => {
    try {
      const response = await axios.get("http://localhost:4000/users");
      const users = response.data;
      // Find user with matching email and password
      const foundUser = users.find(
        (u) => u.email === email && u.password === password
      );

      if (foundUser) {
        // Remove password before storing user info
        const userWithoutPassword = { ...foundUser };
        delete userWithoutPassword.password;
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        return { success: true };
      } else {
        return { success: false, error: "Invalid credentials" };
      }
    } catch (error) {
      return { success: false, error: "Login failed" };
    }
  };

  // Register function: creates a new user if email is not taken
  const register = async (name, email, password) => {
    try {
      const response = await axios.get("http://localhost:4000/users");
      const users = response.data;
      // Check if user already exists
      const existingUser = users.find((u) => u.email === email);

      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      // Create new user object
      const newUser = {
        name,
        email,
        password,
        bio: "",
        profilePicture: `https://as2.ftcdn.net/v2/jpg/05/89/93/27/1000_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.webp`,
      };

      // Send POST request to create user
      const createResponse = await axios.post(
        "http://localhost:4000/users",
        newUser
      );
      const createdUser = { ...createResponse.data };
      delete createdUser.password;

      setUser(createdUser);
      localStorage.setItem("user", JSON.stringify(createdUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: "Registration failed" };
    }
  };

  // Logout function: clears user state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Update user info in state and localStorage
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Context value to be provided to consumers
  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  // Provide the context to child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
