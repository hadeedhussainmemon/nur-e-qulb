import type { Metadata } from 'next';
import { Inter, Amiri, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { SWRProvider } from '@/components/providers/SWRProvider';

import { ThemeSyncEngine } from '@/components/layout/ThemeSyncEngine';

import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: "Nur E Qalbb",
  description: "An elegant, premium, distraction-free Islamic productivity platform.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nur E Qalbb",
  },
  openGraph: {
    title: "Nur E Qalbb",
    description: "An elegant, premium, distraction-free Islamic productivity platform.",
    url: "https://nur-e-qulb.vercel.app",
    siteName: "Nur E Qalbb",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Nur E Qalbb Social Sharing Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nur E Qalbb",
    description: "An elegant, premium, distraction-free Islamic productivity platform.",
    images: ["/og.png"],
  },
};

export const viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('nur-theme');
                  if (theme && theme !== 'default') {
                    document.documentElement.classList.add('theme-' + theme);
                  }
                  
                  var loggedIn = localStorage.getItem('nurequlb_logged_in') === 'true';
                  if (!loggedIn && window.location.pathname === '/') {
                    document.documentElement.classList.add('hide-splash');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          #pwa-splash {
            position: fixed;
            inset: 0;
            background: #020617;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            transition: opacity 0.4s ease-in-out, visibility 0.4s ease-in-out;
            opacity: 1;
            visibility: visible;
          }
          #pwa-splash img {
            color: transparent;
          }
          html.hide-splash #pwa-splash {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          @keyframes pwa-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(0.96); }
          }
        ` }} />
      </head>
      <body className={`${inter.variable} ${amiri.variable} ${outfit.variable} antialiased font-sans`}>
        {/* PWA Splash Loader to prevent hydration flash for logged in users */}
        <div id="pwa-splash">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <img src="/logo.png" alt="Nur E Qalbb Logo" style={{ width: '75px', height: '75px', objectFit: 'contain', animation: 'pwa-pulse 2s infinite ease-in-out' }} />
            <div style={{ fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc', letterSpacing: '0.05em' }}>NUR E QALBB</div>
          </div>
        </div>

        <SessionProvider>
          <SWRProvider>
            <ThemeSyncEngine />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AppShell>
                {children}
              </AppShell>
            </ThemeProvider>
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

