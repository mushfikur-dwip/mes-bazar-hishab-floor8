import React, { useEffect } from 'react';
import BottomNav from './BottomNav';
import { NotificationBell } from './NotificationBell';
import { useMonth } from '@/contexts/MonthContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { monthKey } = useMonth();
  const { isAdmin } = useAuth();

  // Listen for foreground FCM messages
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    import('@/lib/firebase').then(({ onForegroundMessage }) => {
      unsubscribe = onForegroundMessage((payload) => {
        const title = payload.notification?.title || 'নোটিফিকেশন';
        const body = payload.notification?.body || '';
        toast(title, { description: body });
      });
    }).catch(() => {});
    return () => { unsubscribe?.(); };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">{t('app.name')}</h1>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
            {monthKey}
          </span>
          {isAdmin && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              Admin
            </span>
          )}
          <NotificationBell />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
