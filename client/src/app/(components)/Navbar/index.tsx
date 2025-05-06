"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { Bell, Menu, Moon, Settings, Sun, LogOut } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelectedDatabase } from "@/utils/auth";

const Navbar = () => {
  const [databaseName, setDatabaseName] = useState<string>("");
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const router = useRouter();

  useEffect(() => {
    // Get the selected database on component mount
    const selectedDb = getSelectedDatabase();
    console.log("Selected database:", selectedDb); // Debugging
    setDatabaseName(selectedDb || "");

    // Add an event listener to handle localStorage changes
    const handleStorageChange = () => {
      const updatedDb = getSelectedDatabase();
      setDatabaseName(updatedDb || "");
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const toggleDarkMode = () => {
    dispatch(setIsDarkMode(!isDarkMode));
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedDatabase"); // Also remove the database selection
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";

    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    }).catch((err) => console.error("Logout error:", err));

    window.location.href = "/login";
  };

  // Function to get display name
  const getDisplayName = () => {
    // Convert to lowercase and trim to handle case insensitivity and spaces
    const dbName = (databaseName || "").toLowerCase().trim();

    if (dbName === "lagom") {
      return "Lagom";
    } else if (dbName === "insight") {
      return "Insight-Times";
    } else {
      return "No Database Selected";
    }
  };

  return (
    <div className="flex justify-between items-center w-full mb-7">
      {/* LEFT SIDE */}
      <div className="flex justify-between items-center gap-5">
        <button
          className="px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex justify-between items-center gap-5">
        <div className="hidden md:flex justify-between items-center gap-5">
          <div>
            <button onClick={toggleDarkMode}>
              {isDarkMode ? (
                <Sun className="cursor-pointer text-gray-500" size={24} />
              ) : (
                <Moon className="cursor-pointer text-gray-500" size={24} />
              )}
            </button>
          </div>
          <hr className="w-0 h-7 border border-solid border-l border-gray-300 mx-3" />
          <div className="flex items-center gap-3 cursor-pointer">
            <span className="font-semibold">{getDisplayName()}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span>déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
