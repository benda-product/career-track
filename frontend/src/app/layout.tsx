import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/components/providers/query-provider';
import { PUBLIC_ASSETS } from '@/constants/assets';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'CareerTrack - AI-Powered Candidate Platform',
  description: 'Create resumes, search jobs, track applications, and accelerate your career.',
  icons: {
    icon: [{ url: PUBLIC_ASSETS.favicon, type: 'image/png' }],
    shortcut: PUBLIC_ASSETS.favicon,
    apple: PUBLIC_ASSETS.favicon,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
