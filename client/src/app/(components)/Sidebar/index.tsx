"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  Archive,
  CircleDollarSign,
  Clipboard,
  Layout,
  LucideIcon,
  Menu,
  SlidersHorizontal,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getSelectedDatabase, debugTokenStatus, getToken } from "@/utils/auth";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href} onClick={onClick}>
      <div
        className={`cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        }
        hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
          isActive ? "bg-blue-200 text-white" : ""
        }
      }`}
      >
        <Icon className="w-6 h-6 !text-gray-700" />

        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-medium text-gray-700`}
        >
          {label}
        </span>
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const [databaseName, setDatabaseName] = useState<string>("");
  const [tokenValid, setTokenValid] = useState<boolean>(false);

  useEffect(() => {
    // Get the selected database on component mount
    const selectedDb = getSelectedDatabase();
    setDatabaseName(selectedDb || "");

    // Debug token status
    const tokenStatus = debugTokenStatus();
    console.log("Sidebar mount - token status:", tokenStatus);
    setTokenValid(tokenStatus.cookie || tokenStatus.localStorage);

    // Check token periodically
    const intervalId = setInterval(() => {
      const token = getToken();
      if (!token) {
        console.log("Token lost - redirecting to login");
        // Token is missing, redirect to login
        window.location.href = "/login";
      }
    }, 5000);

    // Add an event listener to handle localStorage changes
    const handleStorageChange = () => {
      const updatedDb = getSelectedDatabase();
      setDatabaseName(updatedDb || "");
      
      // Also check token status when storage changes
      const tokenStatus = debugTokenStatus();
      console.log("Storage change - token status:", tokenStatus);
      setTokenValid(tokenStatus.cookie || tokenStatus.localStorage);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  // Function to handle navigation with token verification
  const handleNavigation = (path: string) => {
    // Verify token before navigation
    const tokenStatus = debugTokenStatus();
    console.log(`Navigation to ${path} - token status:`, tokenStatus);
    
    if (!tokenStatus.cookie && !tokenStatus.localStorage) {
      console.log("No token found during navigation - redirecting to login");
      window.location.href = "/login";
      return;
    }
  };

  // Function to check if current database is insight
  const isInsightDb = () => {
    const dbName = (databaseName || "").toLowerCase().trim();
    return dbName === "insight";
  };

  // Function to get display name
  const getDisplayName = () => {
    const dbName = (databaseName || "").toLowerCase().trim();
    return dbName === "lagom" ? "Lagom" : "Insight-Times";
  };

  // Function to get copyright text
  const getCopyrightText = () => {
    const dbName = (databaseName || "").toLowerCase().trim();
    return dbName === "lagom"
      ? "© 2025 Lagom-consulting"
      : "© 2025 Insight-Times";
  };

  const sidebarClassNames = `fixed flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } bg-white transition-all duration-300 overflow-hidden h-full shadow-md z-40`;

  return (
    <div className={sidebarClassNames}>
      {/* TOP LOGO */}
      {/* TOP LOGO - Different layout for collapsed and expanded */}
      {isSidebarCollapsed ? (
        /* When sidebar is collapsed, only show the centered logo */
        <div className="flex justify-center items-center w-full pt-6">
          {isInsightDb() && (
            <div className="flex-shrink-0">
              <Image
                src="/icons/insight.png"
                alt="Insight Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          )}
        </div>
      ) : (
        /* When sidebar is expanded, show logo + text + button */
        <div className="flex gap-3 items-center pt-8 px-8 justify-between md:justify-normal">
          {isInsightDb() && (
            <div className="flex-shrink-0">
              <Image
                src="/icons/insight.png"
                alt="Insight Logo"
                width={45}
                height={45}
                className="object-contain"
              />
            </div>
          )}

          <h1 className="font-extrabold text-lg">{getDisplayName()}</h1>

          <button
            className="md:hidden px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
            onClick={toggleSidebar}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LINKS */}
      <div className="flex-grow mt-8">
        <SidebarLink
          href="/dashboard"
          icon={Layout}
          label="Tableau de bord"
          isCollapsed={isSidebarCollapsed}
          onClick={() => handleNavigation("/dashboard")}
        />
        <SidebarLink
          href="/categories"
          icon={Archive}
          label="Catégories"
          isCollapsed={isSidebarCollapsed}
          onClick={() => handleNavigation("/categories")}
        />
        <SidebarLink
          href="/actif"
          icon={Clipboard}
          label="Équipements"
          isCollapsed={isSidebarCollapsed}
          onClick={() => handleNavigation("/actif")}
        />
        <SidebarLink
          href="/employee"
          icon={User}
          label="Employés"
          isCollapsed={isSidebarCollapsed}
          onClick={() => handleNavigation("/employee")}
        />
        <SidebarLink
          href="/administration"
          icon={SlidersHorizontal}
          label="administration"
          isCollapsed={isSidebarCollapsed}
          onClick={() => handleNavigation("/administration")}
        />
      </div>

      {/* Token status indicator (helpful for debugging) */}
      {process.env.NODE_ENV !== "production" && (
        <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-2 px-4`}>
          <p className="text-xs text-gray-500">
            Token: {tokenValid ? "✓ Valid" : "✗ Invalid"}
          </p>
        </div>
      )}

      {/* FOOTER */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-10`}>
        <p className="text-center text-xs text-gray-500">
          {getCopyrightText()}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
