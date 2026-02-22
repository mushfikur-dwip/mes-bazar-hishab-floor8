import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Megaphone, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return query;
}

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await (supabase as any).from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await (supabase as any).from('notifications').update({ is_read: true }).eq('id', n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="h-4 w-4 text-primary" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm">নোটিফিকেশন</SheetTitle>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" className="text-xs" onClick={markAllRead}>
                সব পড়া হয়েছে
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-3">
          <div className="space-y-2">
            {notifications.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">কোনো নোটিফিকেশন নেই</p>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border text-xs space-y-1 cursor-pointer transition-colors ${
                  n.is_read ? 'bg-background border-border' : 'bg-primary/5 border-primary/20'
                }`}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <div className="flex items-center gap-2">
                  {getIcon(n.type)}
                  <span className="font-medium text-sm">{n.title}</span>
                </div>
                <p className="text-muted-foreground">{n.message}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
