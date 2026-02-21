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
import { useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, LogOut, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const statusMap = new Map(statusData.map(s => [s.user_id, s]));

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

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{t('settings.members')}</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {profiles.map(p => {
          const status = statusMap.get(p.id);
          const isActive = status ? status.is_active : true; // default active
          return (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-sm">{p.full_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {isActive ? t('settings.active') : t('settings.inactive')}
                </span>
                <Switch checked={isActive} onCheckedChange={() => toggleActive(p.id, isActive)} className="scale-75" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
