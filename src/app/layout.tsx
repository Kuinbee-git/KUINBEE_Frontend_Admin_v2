import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/providers/query-provider';
import { Toaster } from 'sonner';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

const themeInitializationScript = `
  (() => {
    try {
      const stored = localStorage.getItem('kuinbee-theme-storage');
      const parsed = stored ? JSON.parse(stored) : null;
      const theme = parsed?.state?.theme === 'dark' ? 'dark' : 'light';
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      root.classList.toggle('dark', theme === 'dark');
      root.style.colorScheme = theme;
    } catch {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  })();
`;

export const metadata: Metadata = {
  title: 'Kuinbee Marketplace Admin',
  description: 'Admin panel for Kuinbee Data Marketplace v2',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
