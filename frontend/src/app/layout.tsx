import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/components/providers/query-provider';
import { PUBLIC_ASSETS } from '@/constants/assets';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'CareerTrack — Job seeker career workspace',
    template: '%s · CareerTrack',
  },
  description:
    'CareerTrack helps job seekers build ATS resumes, take SkillCheck assessments, match jobs, and track applications — with Resume AI and Hub SSO.',
  icons: {
    icon: [{ url: PUBLIC_ASSETS.favicon, type: 'image/png' }],
    shortcut: PUBLIC_ASSETS.favicon,
    apple: PUBLIC_ASSETS.favicon,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <body className={`${plusJakarta.className} min-h-full antialiased`}>
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
