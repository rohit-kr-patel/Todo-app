import { createContext, useContext, useState, useEffect } from "react";
import { apiGet, apiPut, endpoints, getApiBaseUrl } from "../api.js";

// Create context for user profile
const UserContext = createContext();

// useUser hook: access user context in components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// UserProvider: supplies user profile state and actions to children
export const UserProvider = ({ children }) => {
  // User state
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    avatar: null,
    isLoading: false,
    error: null,
  });

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      setUser((prev) => ({ ...prev, isLoading: true, error: null }));
      const userData = await apiGet(endpoints.me);

      const fullName = [userData.fn, userData.ln].filter(Boolean).join(" ").trim();

      // Ensure avatar is an absolute URL so frontend loads from backend
      const avatarUrl = userData.avatarUrl ? `${getApiBaseUrl()}${userData.avatarUrl}` : null;
      setUser({
        id: userData.id,
        firstName: userData.fn || "",
        lastName: userData.ln || "",
        fullName,
        email: userData.email || "",
        avatar: avatarUrl,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser((prev) => ({ ...prev, isLoading: false, error: "Failed to load profile" }));
    }
  };

  // Refresh profile (alias for fetchUserProfile)
  const refreshProfile = fetchUserProfile;

  // Re-fetch profile when auth state changes (login/logout)
  useEffect(() => {
    const handler = () => fetchUserProfile();
    window.addEventListener('authChanged', handler);
    return () => window.removeEventListener('authChanged', handler);
  }, []);

  // Update first name / last name
  const updateProfile = async ({ fn, ln }) => {
    setUser((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Optimistic UI update
      setUser((prev) => ({ ...prev, firstName: fn, lastName: ln }));

      // Send to backend
      await apiPut(endpoints.me, { fn, ln });

      // Update full name
      setUser((prev) => ({
        ...prev,
        fullName: [fn, ln].filter(Boolean).join(" ").trim(),
      }));
    } catch (error) {
      console.error("Failed to update profile:", error);
      await fetchUserProfile(); // revert if failed
    } finally {
      setUser((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Update avatar URL in state
  const updateAvatar = (avatarUrl) => {
    setUser((prev) => ({ ...prev, avatar: avatarUrl }));
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Context value
  const value = {
    user,
    updateProfile,    
    updateAvatar,
    refreshProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
