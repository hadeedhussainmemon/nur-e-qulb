import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    // Protect all routes except auth routes, login/register pages, root home, and static assets
    '/((?!api/auth|login|register|^/$|_next/static|_next/image|favicon.ico|manifest.json|icons/|logo.png|images/|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
