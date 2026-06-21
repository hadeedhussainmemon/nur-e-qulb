import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    // Protect pages only — exclude ALL api routes, auth, static files, and public assets
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/|logo.png|og.png|images/|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|login|register|$).*)',
  ],
};
