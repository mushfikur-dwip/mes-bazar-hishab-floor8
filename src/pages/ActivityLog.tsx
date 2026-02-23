import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useMonth } from '@/contexts/MonthContext';
import { useLang } from '@/contexts/LangContext';
import { t } from '@/lib/i18n';
import { Loader2, UtensilsCrossed, ShoppingCart, Wallet, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  description: string;
  metadata: any;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
}

const tableIcons: Record<string, typeof UtensilsCrossed> = {
  meal_entries: UtensilsCrossed,
  bazar_entries: ShoppingCart,
  payments: Wallet,
};

const tableColors: Record<string, string> = {
  meal_entries: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  bazar_entries: 'bg-green-500/10 text-green-600 dark:text-green-400',
  payments: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const actionColors: Record<string, string> = {
  insert: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  update: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  delete: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const actionLabels: Record<string, { bn: string; en: string }> = {
  insert: { bn: 'যোগ', en: 'Add' },
  update: { bn: 'আপডেট', en: 'Update' },
  delete: { bn: 'মুছে ফেলা', en: 'Delete' },
};

const tableLabels: Record<string, { bn: string; en: string }> = {
  meal_entries: { bn: 'মিল', en: 'Meal' },
  bazar_entries: { bn: 'বাজার', en: 'Bazar' },
  payments: { bn: 'পেমেন্ট', en: 'Payment' },
};

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('activity-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs(prev => [payload.new as ActivityLog, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const [logsRes, profilesRes] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('profiles').select('id, full_name'),
    ]);

    if (logsRes.data) setLogs(logsRes.data);
    if (profilesRes.data) {
      const map: Record<string, string> = {};
      profilesRes.data.forEach(p => { map[p.id] = p.full_name; });
      setProfiles(map);
    }
    setLoading(false);
  }

  function getMetaDetail(log: ActivityLog): string {
    const m = log.metadata;
    if (!m) return '';

    if (log.table_name === 'meal_entries') {
      const parts: string[] = [];
      if (m.date) parts.push(m.date);
      if (m.breakfast) parts.push(lang === 'bn' ? 'সকাল' : 'B');
      if (m.lunch) parts.push(lang === 'bn' ? 'দুপুর' : 'L');
      if (m.dinner) parts.push(lang === 'bn' ? 'রাত' : 'D');
      return parts.join(' · ');
    }
    if (log.table_name === 'bazar_entries') {
      const parts: string[] = [];
      if (m.date) parts.push(m.date);
      if (m.amount) parts.push(`৳${m.amount}`);
      if (m.description) parts.push(m.description);
      return parts.join(' · ');
    }
    if (log.table_name === 'payments') {
      const parts: string[] = [];
      if (m.date) parts.push(m.date);
      if (m.amount) parts.push(`৳${m.amount}`);
      if (m.method) parts.push(m.method);
      return parts.join(' · ');
    }
    return '';
  }

  function getTargetUser(log: ActivityLog): string | null {
    const targetId = log.metadata?.target_user_id || log.metadata?.user_id;
    if (targetId && targetId !== log.user_id) {
      return profiles[targetId] || null;
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('nav.activityLog')}</h2>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {t('common.noData')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const Icon = tableIcons[log.table_name] || Clock;
            const userName = profiles[log.user_id] || (lang === 'bn' ? 'অজানা' : 'Unknown');
            const targetUser = getTargetUser(log);
            const detail = getMetaDetail(log);
            const tLabel = tableLabels[log.table_name]?.[lang] || log.table_name;
            const aLabel = actionLabels[log.action]?.[lang] || log.action;
            const timeAgo = formatDistanceToNow(new Date(log.created_at), {
              addSuffix: true,
              locale: lang === 'bn' ? bn : undefined,
            });

            return (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${tableColors[log.table_name] || 'bg-muted'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{userName}</span>
                        {targetUser && (
                          <span className="text-xs text-muted-foreground">
                            → {targetUser}
                          </span>
                        )}
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${actionColors[log.action] || ''}`}>
                          {aLabel}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tLabel}
                        </Badge>
                      </div>
                      {detail && (
                        <p className="text-xs text-muted-foreground truncate">{detail}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70">{timeAgo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
