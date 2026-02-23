import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useLang } from '@/contexts/LangContext';
import { useMealWeights, useProfiles, useMemberMonthStatus, useExtraCosts } from '@/hooks/useMonthData';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Moon, Sun, LogOut, Plus, Trash2, Clock, UserMinus, Mail, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReminderSettingsEditor } from '@/components/ReminderSettings';

const extraCategories = ['gas', 'electricity', 'wifi', 'cleaner', 'water', 'others'];

export default function Settings() {
  const { isAdmin, signOut } = useAuth();
  const { monthKey, setMonthKey } = useMonth();
  const { lang, setLang } = useLang();
  const weights = useMealWeights(monthKey);
  const profiles = useProfiles();
  const monthStatus = useMemberMonthStatus(monthKey);
  const extras = useExtraCosts(monthKey);
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t('settings.title')}</h2>

      {/* Month Selector */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('settings.monthSelect')}</CardTitle></CardHeader>
          <CardContent>
            <Input
              type="month"
              value={monthKey}
              onChange={e => setMonthKey(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Theme & Language */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('settings.theme')}</span>
            <Button size="sm" variant="outline" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
              {theme === 'dark' ? t('settings.light') : t('settings.dark')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('settings.language')}</span>
            <div className="flex gap-1">
              <Button size="sm" variant={lang === 'bn' ? 'default' : 'outline'} onClick={() => setLang('bn')}>বাংলা</Button>
              <Button size="sm" variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')}>EN</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Weights - Admin */}
      {isAdmin && <MealWeightsEditor monthKey={monthKey} weights={weights.data} />}

      {/* Cutoff Settings - Admin */}
      {isAdmin && <CutoffSettingsEditor monthKey={monthKey} />}

      {/* Extra Costs - Admin */}
      {isAdmin && <ExtraCostsManager monthKey={monthKey} extras={extras.data || []} />}

      {/* Member Management - Admin */}
      {isAdmin && (
        <MemberManager
          monthKey={monthKey}
          profiles={profiles.data || []}
          statusData={monthStatus.data || []}
        />
      )}

      {/* Reminder Settings - Admin */}
      {isAdmin && <ReminderSettingsEditor />}

      {/* Account Settings - All users */}
      <AccountSettings />

      {/* Telegram & Notification Link */}
      <TelegramLinkCard />

      {/* Logout */}
      <Button variant="destructive" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" />{t('auth.logout')}
      </Button>
    </div>
  );
}

function MealWeightsEditor({ monthKey, weights }: { monthKey: string; weights: any }) {
  const [bw, setBw] = useState(String(weights?.breakfast_weight ?? 0.5));
  const [lw, setLw] = useState(String(weights?.lunch_weight ?? 1));
  const [dw, setDw] = useState(String(weights?.dinner_weight ?? 1));
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('meal_weight_settings').upsert({
        month_key: monthKey,
        breakfast_weight: parseFloat(bw),
        lunch_weight: parseFloat(lw),
        dinner_weight: parseFloat(dw),
      }, { onConflict: 'month_key' });
      if (error) throw error;
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['meal_weights', monthKey] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{t('settings.mealWeights')}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 items-center">
          <span className="text-xs w-16">{t('meals.breakfast')}</span>
          <Input type="number" step="0.1" value={bw} onChange={e => setBw(e.target.value)} className="h-8" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs w-16">{t('meals.lunch')}</span>
          <Input type="number" step="0.1" value={lw} onChange={e => setLw(e.target.value)} className="h-8" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs w-16">{t('meals.dinner')}</span>
          <Input type="number" step="0.1" value={dw} onChange={e => setDw(e.target.value)} className="h-8" />
        </div>
        <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </CardContent>
    </Card>
  );
}

function ExtraCostsManager({ monthKey, extras }: { monthKey: string; extras: any[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState('gas');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleAdd = async () => {
    if (!amount) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('extra_costs').insert({
        month_key: monthKey,
        category,
        amount: parseFloat(amount),
        note,
      });
      if (error) throw error;
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['extra_costs', monthKey] });
      setDialogOpen(false);
      setAmount('');
      setNote('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('extra_costs').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['extra_costs', monthKey] });
  };

  const totalExtra = extras.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{t('settings.extraCosts')}</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="h-3 w-3" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('settings.extraCosts')}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {extraCategories.map(c => (
                    <SelectItem key={c} value={c}>{t(`extra.${c}` as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" placeholder={t('bazar.amount')} value={amount} onChange={e => setAmount(e.target.value)} />
              <Input placeholder={t('payments.note')} value={note} onChange={e => setNote(e.target.value)} />
              <Button className="w-full" onClick={handleAdd} disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
          <span>মোট: ৳{totalExtra.toFixed(0)}</span>
        </div>
        {extras.map(e => (
          <div key={e.id} className="flex items-center justify-between py-1 border-b border-border text-xs">
            <span>{t(`extra.${e.category}` as any)} — ৳{Number(e.amount).toFixed(0)}</span>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleDelete(e.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MemberManager({ monthKey, profiles, statusData }: {
  monthKey: string; profiles: { id: string; full_name: string }[];
  statusData: any[];
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const statusMap = new Map(statusData.map(s => [s.user_id, s]));
  const [deleting, setDeleting] = useState<string | null>(null);

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const existing = statusMap.get(userId);
    try {
      if (existing) {
        const { error } = await supabase.from('member_month_status')
          .update({ is_active: !currentActive })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('member_month_status').insert({
          user_id: userId,
          month_key: monthKey,
          is_active: !currentActive,
        });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['member_month_status', monthKey] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast.error('নিজেকে ডিলিট করা যাবে না');
      return;
    }
    setDeleting(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');
      toast.success('সদস্য ডিলিট হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['member_month_status', monthKey] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{t('settings.members')}</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {profiles.map(p => {
          const status = statusMap.get(p.id);
          const isActive = status ? status.is_active : true;
          const isSelf = p.id === user?.id;
          return (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-sm">{p.full_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {isActive ? t('settings.active') : t('settings.inactive')}
                </span>
                <Switch checked={isActive} onCheckedChange={() => toggleActive(p.id, isActive)} className="scale-75" />
                {!isSelf && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={deleting === p.id}>
                        <UserMinus className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>সদস্য ডিলিট করুন</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong>{p.full_name}</strong> এর সকল ডাটা (মিল, বাজার, পেমেন্ট) সহ একাউন্ট ডিলিট হবে। এটি undo করা যাবে না।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(p.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          ডিলিট করুন
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

const DEFAULT_CUTOFFS = {
  breakfast_cutoff_hour: 22,
  breakfast_cutoff_prev_day: true,
  lunch_cutoff_hour: 9,
  lunch_cutoff_prev_day: false,
  dinner_cutoff_hour: 14,
  dinner_cutoff_prev_day: false,
};

function CutoffSettingsEditor({ monthKey }: { monthKey: string }) {
  const queryClient = useQueryClient();
  const { data: cutoffs, isLoading } = useQuery({
    queryKey: ['meal_cutoff_settings', monthKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('meal_cutoff_settings')
        .select('*')
        .eq('month_key', monthKey)
        .maybeSingle();
      return (data as typeof DEFAULT_CUTOFFS | null) || DEFAULT_CUTOFFS;
    },
  });

  const [values, setValues] = useState(DEFAULT_CUTOFFS);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (cutoffs && !initialized) {
    setValues({
      breakfast_cutoff_hour: cutoffs.breakfast_cutoff_hour,
      breakfast_cutoff_prev_day: cutoffs.breakfast_cutoff_prev_day,
      lunch_cutoff_hour: cutoffs.lunch_cutoff_hour,
      lunch_cutoff_prev_day: cutoffs.lunch_cutoff_prev_day,
      dinner_cutoff_hour: cutoffs.dinner_cutoff_hour,
      dinner_cutoff_prev_day: cutoffs.dinner_cutoff_prev_day,
    });
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('meal_cutoff_settings')
        .upsert({
          month_key: monthKey,
          ...values,
        }, { onConflict: 'month_key' });
      if (error) throw error;
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['meal_cutoff_settings', monthKey] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderMealCutoff = (
    label: string,
    hourKey: 'breakfast_cutoff_hour' | 'lunch_cutoff_hour' | 'dinner_cutoff_hour',
    prevDayKey: 'breakfast_cutoff_prev_day' | 'lunch_cutoff_prev_day' | 'dinner_cutoff_prev_day',
  ) => (
    <div className="space-y-1.5 py-2 border-b border-border last:border-0">
      <span className="text-xs font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <Select
          value={String(values[hourKey])}
          onValueChange={v => setValues(prev => ({ ...prev, [hourKey]: parseInt(v) }))}
        >
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hours.map(h => (
              <SelectItem key={h} value={String(h)}>
                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={values[prevDayKey] ? 'default' : 'outline'}
          className="text-[10px] h-8"
          onClick={() => setValues(prev => ({ ...prev, [prevDayKey]: !prev[prevDayKey] }))}
        >
          {values[prevDayKey] ? t('meals.prevDay') : t('meals.sameDay')}
        </Button>
      </div>
    </div>
  );

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('meals.cutoffSettings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {renderMealCutoff(t('meals.cutoffBreakfast'), 'breakfast_cutoff_hour', 'breakfast_cutoff_prev_day')}
        {renderMealCutoff(t('meals.cutoffLunch'), 'lunch_cutoff_hour', 'lunch_cutoff_prev_day')}
        {renderMealCutoff(t('meals.cutoffDinner'), 'dinner_cutoff_hour', 'dinner_cutoff_prev_day')}
        <Button size="sm" className="w-full mt-3" onClick={handleSave} disabled={saving}>
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountSettings() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('ইমেইল আপডেট লিঙ্ক পাঠানো হয়েছে নতুন ইমেইলে');
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error('পাসওয়ার্ড মিলছে না');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('পাসওয়ার্ড আপডেট হয়েছে');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {t('settings.account')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current email display */}
        <div className="text-xs text-muted-foreground">
          বর্তমান ইমেইল: <span className="font-medium text-foreground">{user?.email}</span>
        </div>

        {/* Change Email */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium flex items-center gap-1">
            <Mail className="h-3 w-3" /> {t('settings.changeEmail')}
          </span>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t('settings.newEmail')}
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="h-8 text-xs"
            />
            <Button size="sm" onClick={handleChangeEmail} disabled={saving || !newEmail}>
              {t('settings.update')}
            </Button>
          </div>
        </div>

        {/* Change Password */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium flex items-center gap-1">
            <Lock className="h-3 w-3" /> {t('settings.changePassword')}
          </span>
          <Input
            type="password"
            placeholder={t('settings.newPassword')}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="password"
            placeholder={t('settings.confirmPassword')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" className="w-full" onClick={handleChangePassword} disabled={saving || !newPassword}>
            {saving ? t('common.loading') : t('settings.update')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TelegramLinkCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatId, setChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile-telegram', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from('profiles')
        .select('telegram_chat_id, fcm_token')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (profile && !initialized) {
    setChatId(profile.telegram_chat_id || '');
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ telegram_chat_id: chatId || null })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('টেলিগ্রাম Chat ID সেভ হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['profile-telegram', user.id] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { requestNotificationPermission } = await import('@/lib/push');
      const token = await requestNotificationPermission();
      if (!token) {
        toast.error('পুশ নোটিফিকেশন অনুমতি দেওয়া হয়নি বা সাপোর্ট করে না');
        return;
      }
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('পুশ নোটিফিকেশন সক্রিয় হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['profile-telegram', user.id] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasFcmToken = !!profile?.fcm_token;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">নোটিফিকেশন সংযোগ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Push Notification */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium">পুশ নোটিফিকেশন</span>
          {hasFcmToken ? (
            <p className="text-xs text-green-600 dark:text-green-400">সক্রিয় আছে</p>
          ) : (
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleEnablePush} disabled={saving}>
              পুশ নোটিফিকেশন চালু করুন
            </Button>
          )}
        </div>

        {/* Telegram */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium">টেলিগ্রাম</span>
          <p className="text-[10px] text-muted-foreground">
            @userinfobot এ /start পাঠিয়ে Chat ID পাবেন
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Chat ID"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              className="h-8"
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? '...' : t('common.save')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
