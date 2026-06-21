import type { Metadata } from 'next';
import { Inter, Amiri, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/providers/SessionProvider';


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
  manifest: "/manifest.json",
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
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${amiri.variable} ${outfit.variable} antialiased font-sans`}>
        <SessionProvider>
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
        </SessionProvider>
      </body>
    </html>
  );
}

