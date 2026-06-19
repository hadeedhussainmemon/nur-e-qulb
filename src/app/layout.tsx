import type { Metadata } from 'next';
import { Inter, Amiri, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalAudioPlayer } from '@/components/quran/GlobalAudioPlayer';
import { InstallPrompt } from '@/components/layout/InstallPrompt';
import { WazeefahReminderEngine } from '@/components/layout/WazeefahReminderEngine';
import { ThemeSyncEngine } from '@/components/layout/ThemeSyncEngine';

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
  themeColor: "#059669",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nur E Qalbb",
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
            <div className="h-full relative">
              <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar />
              </div>
              <main className="md:pl-72 flex flex-col h-full bg-background">
                <InstallPrompt />
                <Navbar />
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                  {children}
                </div>
              </main>
              <GlobalAudioPlayer />
              <WazeefahReminderEngine />
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

