import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Check if the route is protected (requires authentication)
function isProtectedRoute(pathname: string) {
  const protectedRoutes = ["/home", "/shared-with-me", "/trash", "/settings"];
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

// Check if the route is an authentication route (login/sign-up)
function isAuthRoute(pathname: string) {
  const authRoutes = ["/login", "/sign-up"];
  return authRoutes.includes(pathname);
}

// function isPublicRoute(pathname: string) {
//   const publicRoutes = ["/"];
//   return publicRoutes.includes(pathname);
// }

// Check if the user has permission to access the route
// Extend this function to check for roles/permissions as needed
// function hasPermission(user: User, pathname: string) {
// }

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/sign-up",
  },
  callbacks: {
    // Authorization callback for NextAuth middleware
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && (isAuthRoute(pathname) || pathname === "/")) {
        return Response.redirect(new URL("/home", nextUrl));
      }

      // If the route is protected, check authentication and permissions
      if (isProtectedRoute(pathname)) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl));
        }
        // Check user permissions (extend as needed)
        // if (!hasPermission(auth.user, pathname)) {
        //   // Optionally redirect to an error page or return false to block access
        //   return false;
        // }
        return true;
      }

      // Allow access to public or other routes
      return true;
    },
  },
  providers: [Google, Credentials],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;
