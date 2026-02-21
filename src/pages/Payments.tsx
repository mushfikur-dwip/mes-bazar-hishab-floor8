import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useLang } from '@/contexts/LangContext';
import { usePayments, useProfiles } from '@/hooks/useMonthData';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const methods = ['cash', 'bkash', 'nagad', 'bank'];

export default function Payments() {
  const { isAdmin } = useAuth();
  const { monthKey } = useMonth();
  const { lang } = useLang();
  const payments = usePayments(monthKey);
  const profiles = useProfiles();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newAmount, setNewAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const totalPaid = (payments.data || []).reduce((s, p) => s + Number(p.amount), 0);

  const profileMap = new Map((profiles.data || []).map(p => [p.id, p.full_name]));

  const handleAdd = async () => {
    if (!memberId || !newAmount) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('payments').insert({
        month_key: monthKey,
        user_id: memberId,
        date: newDate,
        amount: parseFloat(newAmount),
        method,
        note,
      });
      if (error) throw error;
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['payments', monthKey] });
      setDialogOpen(false);
      setNewAmount('');
      setNote('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('common.success'));
    queryClient.invalidateQueries({ queryKey: ['payments', monthKey] });
  };

  if (payments.isLoading || profiles.isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('payments.title')}</h2>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />{t('payments.add')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('payments.add')}</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger><SelectValue placeholder={t('payments.member')} /></SelectTrigger>
                  <SelectContent>
                    {(profiles.data || []).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                <Input type="number" placeholder={t('payments.amount')} value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder={t('payments.note')} value={note} onChange={e => setNote(e.target.value)} />
                <Button className="w-full" onClick={handleAdd} disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-primary/30">
        <CardContent className="pt-3 pb-3 flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">{t('payments.total')}</span>
          <span className="text-lg font-bold">৳{totalPaid.toFixed(0)}</span>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(payments.data || []).map(p => (
          <Card key={p.id}>
            <CardContent className="pt-3 pb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{profileMap.get(p.user_id) || 'Unknown'} — ৳{Number(p.amount).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{p.method} • {p.date}</p>
                {p.note && <p className="text-[10px] text-muted-foreground">{p.note}</p>}
              </div>
              {isAdmin && (
                <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {(!payments.data || payments.data.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
