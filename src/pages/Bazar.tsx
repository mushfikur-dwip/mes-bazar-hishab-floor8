import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useLang } from '@/contexts/LangContext';
import { useBazarEntries } from '@/hooks/useMonthData';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Bazar() {
  const { isAdmin, user } = useAuth();
  const { monthKey } = useMonth();
  const { lang } = useLang();
  const bazars = useBazarEntries(monthKey);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const totalBazar = (bazars.data || []).reduce((s, b) => s + Number(b.amount), 0);

  const handleAdd = async () => {
    if (!newAmount) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('bazar_entries').insert({
        month_key: monthKey,
        date: newDate,
        amount: parseFloat(newAmount),
        description: newDesc,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['bazar_entries', monthKey] });
      setDialogOpen(false);
      setNewAmount('');
      setNewDesc('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('bazar_entries').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('common.success'));
    queryClient.invalidateQueries({ queryKey: ['bazar_entries', monthKey] });
  };

  if (bazars.isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('bazar.title')}</h2>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />{t('bazar.add')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('bazar.add')}</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                <Input type="number" placeholder={t('bazar.amount')} value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                <Input placeholder={t('bazar.description')} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                <Button className="w-full" onClick={handleAdd} disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Total */}
      <Card className="border-primary/30">
        <CardContent className="pt-3 pb-3 flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">{t('bazar.total')}</span>
          <span className="text-lg font-bold text-foreground">৳{totalBazar.toFixed(0)}</span>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {(bazars.data || []).map(b => (
          <Card key={b.id}>
            <CardContent className="pt-3 pb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">৳{Number(b.amount).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
                <p className="text-[10px] text-muted-foreground">{b.date}</p>
              </div>
              {isAdmin && (
                <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {(!bazars.data || bazars.data.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
