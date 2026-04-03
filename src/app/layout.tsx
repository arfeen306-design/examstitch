import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { siteConfig } from '@/config/site';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import RouteProgress from '@/components/ui/RouteProgress';
import './globals.css';

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

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* FOUC prevention — set theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('examstitch-theme');if(t&&['default','dark','beach','forest'].indexOf(t)!==-1){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','beach')}}catch(e){document.documentElement.setAttribute('data-theme','beach')}})()`,
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
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsAppFloat />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
