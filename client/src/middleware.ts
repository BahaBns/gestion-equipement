// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    console.log("Middleware - token exists:", !!token);
    console.log("Current path:", req.nextUrl.pathname);

    // Check for a temporary bypass flag
    const bypassAuth = req.nextUrl.searchParams.get("bypassAuth");
    
    // If no token and trying to access protected route
    if (
      !token &&
      !bypassAuth && // Skip auth check if bypass flag exists
      req.nextUrl.pathname !== "/login" &&
      !req.nextUrl.pathname.startsWith("/_next") &&
      !req.nextUrl.pathname.startsWith("/api")
    ) {
      console.log("No token found - redirecting to login");
      // Redirect to login
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // If has token and trying to access login page
    if (token && req.nextUrl.pathname === "/login") {
      console.log("Token found on login page - redirecting to dashboard");
      // Redirect to dashboard
      const dashboardUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    console.log("Continuing with request");
    // Continue normally
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

// Only apply middleware to protected routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/categories/:path*",
    "/actif/:path*",
    "/employee/:path*",
    "/parametres/:path*",
    "/administration/:path*",
    "/login",
  ],
};
