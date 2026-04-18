import { createContext, useContext, useState, useEffect } from "react";

// ❌ REMOVED: axios (no longer using JSON-server)
// import axios from "axios";

// ✅ ADDED: Firebase Firestore
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import bcrypt from "bcryptjs";

// Create the authentication context
const AuthContext = createContext();

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 🔐 LOGIN (Firebase version)
  const login = async (email, password) => {
    try {
      // ❌ OLD (JSON-server):
      // const response = await axios.get("http://localhost:4000/users");
      // const users = response.data;
      // const foundUser = users.find(...)

      // ✅ NEW (Firebase Firestore)
      const snapshot = await getDocs(collection(db, "users"));

      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Finding user and checking password (supports both plain text for old accounts and bcrypt for new)
      let foundUser = null;
      for (const u of users) {
        if (u.email === email) {
          const isHashed = u.password && u.password.startsWith("$2");
          const isMatch = isHashed ? await bcrypt.compare(password, u.password) : u.password === password;
          if (isMatch) {
            foundUser = u;
            break;
          }
        }
      }

      if (foundUser) {
        // remove password before storing in frontend
        const userWithoutPassword = { ...foundUser };
        delete userWithoutPassword.password;

        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));

        return { success: true };
      }

      return { success: false, error: "Invalid credentials" };
    } catch (error) {
      return { success: false, error: "Login failed" };
    }
  };

  // 📝 REGISTER (Firebase version)
  const register = async (name, email, password) => {
    try {
      // ❌ OLD:
      // const response = await axios.get("/users")
      // const createResponse = await axios.post("/users")

      // ✅ NEW: Fetch users from Firestore
      const snapshot = await getDocs(collection(db, "users"));

      const users = snapshot.docs.map((doc) => doc.data());

      // check if user exists
      const existingUser = users.find((u) => u.email === email);

      if (existingUser) {
        return { success: false, error: "User already exists" };
      }

      // Hash the password before storing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // create new user object
      const newUser = {
        name,
        email,
        password: hashedPassword,
        bio: "",
        profilePicture:
          "https://as2.ftcdn.net/v2/jpg/05/89/93/27/1000_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.webp",
        isAdmin: false,
        isBanned: false,
      };

      // ✅ Firestore create document (replaces axios.post)
      const docRef = await addDoc(collection(db, "users"), newUser);

      const createdUser = {
        id: docRef.id,
        ...newUser,
      };

      // remove password before saving to frontend
      delete createdUser.password;

      setUser(createdUser);
      localStorage.setItem("user", JSON.stringify(createdUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: "Registration failed" };
    }
  };

  // 🚪 LOGOUT (unchanged)
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // ✏️ UPDATE USER (unchanged for now)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};