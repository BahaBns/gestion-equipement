// utils/auth.ts
import { setCookie, deleteCookie, getCookie } from "cookies-next";

// Create a unique session ID when the browser loads
export const initSession = () => {
  if (typeof window !== "undefined") {
    // Check if the browser was closed by comparing sessionStorage
    const sessionCheck = sessionStorage.getItem("browser_session_active");

    if (!sessionCheck) {
      // Browser was closed and reopened - clear localStorage token
      localStorage.removeItem("token");
      localStorage.removeItem("selectedDatabase");
    }

    // Set session marker in sessionStorage (will be cleared when browser closes)
    sessionStorage.setItem("browser_session_active", "true");
  }
};

// Improved cookie setting function
export const setAuthToken = (token: string, selectedDatabase?: string) => {
  if (typeof window !== "undefined") {
    // Set token in localStorage as backup
    localStorage.setItem("token", token);
    
    // For debugging
    console.log("Setting auth token in localStorage and cookie:", !!token);
  }

  // IMPORTANT: Set cookie with correct attributes
  setCookie("token", token, {
    path: "/",                                // Make sure this cookie applies to all paths
    secure: process.env.NODE_ENV === "production", // Secure in production only
    sameSite: "lax",                          // Important for cross-page navigation
    maxAge: 60 * 60 * 24 * 7,                 // 7 days in seconds
    // Do NOT set httpOnly: true, as we need JavaScript access
  });

  if (selectedDatabase) {
    localStorage.setItem("selectedDatabase", selectedDatabase);
    // Also set database in cookie for server-side access
    setCookie("selectedDatabase", selectedDatabase, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
};

// Important: Add this debugging function
export const debugTokenStatus = () => {
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("token");
    const cookieToken = getCookie("token");

    console.log("Token debug - localStorage:", !!localToken);
    console.log("Token debug - cookie:", !!cookieToken);

    return {
      localStorage: !!localToken,
      cookie: !!cookieToken,
    };
  }
  return { localStorage: false, cookie: false };
};

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedDatabase");
  }
  // Clear from both localStorage and cookies
  deleteCookie("token", { path: "/" });
  deleteCookie("selectedDatabase", { path: "/" });
};

// Get the selected database from localStorage
export const getSelectedDatabase = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("selectedDatabase");
  }
  return null;
};

export const getToken = (): string | null => {
  // Try to get from cookies first (works on server and client)
  const cookieToken = getCookie("token");
  if (cookieToken) {
    return cookieToken.toString();
  }

  // Fallback to localStorage (client-side only)
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("token");
    
    // IMPORTANT: If token exists in localStorage but not in cookie,
    // sync it back to cookie and return it
    if (localToken && !cookieToken) {
      console.log("Re-setting token from localStorage to cookie");
      setCookie("token", localToken, {
        path: "/", 
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      return localToken;
    }
    
    return localToken;
  }

  return null;
};

// Verify if the token is valid (you may want to add JWT validation logic here)
export const isValidToken = (token: string): boolean => {
  // Add your token validation logic here
  // For example, check if it's a valid JWT and not expired
  return !!token && token.length > 0;
};

// Function to synchronize token between localStorage and cookie
export const syncTokenFromLocalStorage = () => {
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("token");
    const hasCookie = !!getCookie("token");
    
    if (localToken && !hasCookie) {
      console.log("Syncing token from localStorage to cookie");
      setCookie("token", localToken, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      return true;
    }
  }
  return false;
};
