import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { siteConfig } from '@/config/site';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import RouteProgress from '@/components/ui/RouteProgress';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import './globals.css';
import 'katex/dist/katex.min.css';

const PlexusBackground = dynamic(() => import('@/components/ui/PlexusBackground'), { ssr: false });
const AskAnythingWidget = dynamic(() => import('@/components/ui/AskAnythingWidget'), { ssr: false });

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'O-Level / IGCSE Mathematics',
    'A-Level Mathematics',
    'IGCSE Maths',
    'Solved Past Papers',
    'Topical Worksheets',
    'Video Lectures',
    '4024',
    '9709',
    'Cambridge',
    'CIE',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isAdmin = pathname.startsWith('/admin');

  // Resolve the auth session server-side so the client Navbar can render the
  // correct auth UI on first paint (no flicker between "Log In" and the
  // account menu after hydration). AUDIT_REPORT.md → Finding H-33.
  let initialUser: { id: string; email: string | null } | null = null;
  if (!isAdmin) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        initialUser = { id: data.user.id, email: data.user.email ?? null };
      }
    } catch {
      // Anon / cookie-less request — leave as null
    }
  }

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* FOUC prevention — set theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('examstitch-theme');if(t&&['default','dark','beach','forest'].indexOf(t)!==-1){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','default')}}catch(e){document.documentElement.setAttribute('data-theme','default')}})()`,
          }}
        />
        {/* Preconnect: cuts DNS+TLS round-trip for Supabase, YouTube, Google Drive */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://drive.google.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <RouteProgress />
          {isAdmin ? (
            // Admin pages: no public Navbar/Footer/WhatsAppFloat
            <>{children}</>
          ) : (
            // Public pages: full layout with Navbar, Footer, WhatsApp button
            <>
              <PlexusBackground />
              <Navbar initialUser={initialUser} />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsAppFloat />
              <AskAnythingWidget />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
