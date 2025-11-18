import type { Metadata } from 'next';
import Topbar from '@/components/layout/topbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'UHire',
  description: 'AI 기반 이력서 관리 웹앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen flex-col">
          <Topbar />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
