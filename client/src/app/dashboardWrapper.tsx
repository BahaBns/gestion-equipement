"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";
import { getToken, initSession } from "@/utils/auth";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div
      className={`${
        isDarkMode ? "dark" : "light"
      } flex bg-gray-50 text-gray-900 w-full min-h-screen`}
    >
      <Sidebar />
      <main
        className={`flex flex-col w-full h-full py-7 px-9 bg-gray-50 ${
          isSidebarCollapsed ? "md:pl-24" : "md:pl-72"
        }`}
      >
        <Navbar />
        {children}
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Initialize session tracking to detect browser close
  useEffect(() => {
    // Initialize the session to detect browser closes
    initSession();
  }, []);

  // Define routes where the Sidebar and Navbar should be shown
  const protectedRoutes = [
    "/dashboard",
    "/categories",
    "/actif",
    "/employee",
    "/administration",
  ];

  // Check if the current route is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      if (token) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);

        // Redirect to login if the user is not logged in and tries to access a protected route
        if (isProtectedRoute) {
          router.push("/login");
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router, isProtectedRoute]);

  // Show a loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <StoreProvider>
      {isLoggedIn && isProtectedRoute ? (
        <DashboardLayout>{children}</DashboardLayout>
      ) : (
        // Render only the children for non-protected routes (e.g., /login)
        children
      )}
    </StoreProvider>
  );
};

export default DashboardWrapper;
