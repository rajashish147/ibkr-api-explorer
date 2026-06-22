import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'IBKR API Explorer',
  description: 'Professional API Explorer for Interactive Brokers Web API — OpenAPI, Swagger, Postman-style request builder with IBKR-specific trading features.',
  keywords: ['IBKR', 'Interactive Brokers', 'API', 'OpenAPI', 'Swagger', 'REST', 'Trading', 'Futures'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#0a0a0f] text-gray-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
