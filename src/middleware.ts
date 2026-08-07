import NextAuth from "next-auth";
import { apiAuthRoutePrefix, authRoutes, publicRoutes } from "./routes";
import authConfig from "./auth.config";

const { auth } = NextAuth({ ...authConfig });

export default auth(async (req) => {
  const { nextUrl } = req;
  const session = !!req.auth;
  const { pathname } = nextUrl;

  // Never touch static/public assets — bail out immediately
  if (pathname.startsWith("/uploads") || pathname.startsWith("/_next")) {
    return;
  }

  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiAuthRoute = pathname.startsWith(apiAuthRoutePrefix);
  const isApiRoute = pathname.startsWith("/api"); // treat ALL api routes as exempt from page-auth redirect logic

  if (session && isAuthRoute) {
    return Response.redirect(new URL("/", nextUrl));
  }

  if (
    !session &&
    !isPublicRoute &&
    !isApiRoute &&
    !isApiAuthRoute &&
    !isAuthRoute
  ) {
    const callbackUrl = pathname;
    const encodeCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(
      new URL(`/login?redirect=${encodeCallbackUrl}`, nextUrl),
    );
  }
});

export const config = {
  matcher: [
    "/((?!_next|uploads|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
