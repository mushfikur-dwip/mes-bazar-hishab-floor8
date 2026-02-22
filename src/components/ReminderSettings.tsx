import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Clock, UtensilsCrossed, Wallet, ShoppingCart, BarChart3, Calendar, Lightbulb, ClipboardList } from 'lucide-react';
import { t } from '@/lib/i18n';

const REMINDER_ICONS: Record<string, React.ReactNode> = {
  meal_cutoff_breakfast: <UtensilsCrossed className="h-4 w-4 text-orange-500" />,
  meal_cutoff_lunch: <UtensilsCrossed className="h-4 w-4 text-amber-600" />,
  meal_cutoff_dinner: <UtensilsCrossed className="h-4 w-4 text-indigo-500" />,
  negative_balance: <Wallet className="h-4 w-4 text-red-500" />,
  bazar_rotation: <ShoppingCart className="h-4 w-4 text-emerald-500" />,
  monthly_summary: <BarChart3 className="h-4 w-4 text-blue-500" />,
  new_month: <Calendar className="h-4 w-4 text-purple-500" />,
  extra_expense: <Lightbulb className="h-4 w-4 text-yellow-500" />,
  daily_meal_summary: <ClipboardList className="h-4 w-4 text-teal-500" />,
};

interface ReminderSetting {
  id: string;
  reminder_key: string;
  is_enabled: boolean;
  hour_utc6: number;
  minute_utc6: number;
  description: string;
}

export function ReminderSettingsEditor() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminder_settings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('reminder_settings')
        .select('*')
        .order('reminder_key');
      if (error) throw error;
      return data as ReminderSetting[];
    },
  });

  const handleToggle = async (reminder: ReminderSetting) => {
    setSaving(reminder.id);
    try {
      const { error } = await (supabase as any)
        .from('reminder_settings')
        .update({ is_enabled: !reminder.is_enabled, updated_at: new Date().toISOString() })
        .eq('id', reminder.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['reminder_settings'] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleTimeChange = async (reminder: ReminderSetting, hour: number, minute: number) => {
    setSaving(reminder.id);
    try {
      const { error } = await (supabase as any)
        .from('reminder_settings')
        .update({ hour_utc6: hour, minute_utc6: minute, updated_at: new Date().toISOString() })
        .eq('id', reminder.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['reminder_settings'] });
      toast.success('সময় আপডেট হয়েছে');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) return null;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4" />
          অটো রিমাইন্ডার সেটিংস
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {(reminders || []).map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{REMINDER_ICONS[r.reminder_key] || <Bell className="h-4 w-4" />}</span>
                <span className="text-xs font-medium truncate">{r.description}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <div className="flex gap-1">
                  <Select
                    value={String(r.hour_utc6)}
                    onValueChange={(v) => handleTimeChange(r, parseInt(v), r.minute_utc6)}
                    disabled={!r.is_enabled}
                  >
                    <SelectTrigger className="h-6 w-[70px] text-[10px] px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={String(h)} className="text-xs">
                          {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(r.minute_utc6)}
                    onValueChange={(v) => handleTimeChange(r, r.hour_utc6, parseInt(v))}
                    disabled={!r.is_enabled}
                  >
                    <SelectTrigger className="h-6 w-[52px] text-[10px] px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={String(m)} className="text-xs">
                          :{String(m).padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Switch
              checked={r.is_enabled}
              onCheckedChange={() => handleToggle(r)}
              disabled={saving === r.id}
              className="scale-75"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
