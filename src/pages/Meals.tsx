import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useLang } from '@/contexts/LangContext';
import { useMealEntries, useProfiles, useMealWeights } from '@/hooks/useMonthData';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import { calcMealUnits } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function Meals() {
  const { isAdmin } = useAuth();
  const { monthKey } = useMonth();
  const { lang } = useLang();
  const profiles = useProfiles();
  const meals = useMealEntries(monthKey);
  const weights = useMealWeights(monthKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const [year, month] = monthKey.split('-').map(Number);
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });

  const getMealsForDay = (dateStr: string) =>
    (meals.data || []).filter(m => m.date === dateStr);

  const getMealCount = (dateStr: string) => {
    const dayMeals = getMealsForDay(dateStr);
    return dayMeals.reduce((sum, m) => {
      let c = 0;
      if (m.breakfast) c++;
      if (m.lunch) c++;
      if (m.dinner) c++;
      return sum + c;
    }, 0);
  };

  if (meals.isLoading || profiles.isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t('meals.title')}</h2>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} className="font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {/* Offset for first day */}
        {Array.from({ length: start.getDay() }).map((_,i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = getMealCount(dateStr);
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
          return (
            <button
              key={dateStr}
              onClick={() => {
                if (isAdmin) {
                  setSelectedDate(dateStr);
                  setDrawerOpen(true);
                }
              }}
              className={`
                aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-colors
                ${isToday ? 'ring-2 ring-primary' : ''}
                ${count > 0 ? 'bg-primary/10 text-primary font-medium' : 'bg-secondary text-foreground'}
                ${isAdmin ? 'cursor-pointer hover:bg-primary/20' : 'cursor-default'}
              `}
            >
              <span>{day.getDate()}</span>
              {count > 0 && <span className="text-[8px]">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Day Detail Sheet */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedDate} - {t('meals.title')}</SheetTitle>
          </SheetHeader>
          {selectedDate && isAdmin && (
            <DayMealEditor
              date={selectedDate}
              monthKey={monthKey}
              profiles={profiles.data || []}
              existingMeals={getMealsForDay(selectedDate)}
              weights={weights.data || { breakfast_weight: 0.5, lunch_weight: 1, dinner_weight: 1 }}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ['meal_entries', monthKey] });
                setDrawerOpen(false);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DayMealEditor({ date, monthKey, profiles, existingMeals, weights, onSaved }: {
  date: string;
  monthKey: string;
  profiles: { id: string; full_name: string }[];
  existingMeals: any[];
  weights: { breakfast_weight: number; lunch_weight: number; dinner_weight: number };
  onSaved: () => void;
}) {
  const mealMap = new Map(existingMeals.map(m => [m.user_id, m]));
  
  const [entries, setEntries] = useState<Record<string, { breakfast: boolean; lunch: boolean; dinner: boolean }>>(() => {
    const init: Record<string, { breakfast: boolean; lunch: boolean; dinner: boolean }> = {};
    profiles.forEach(p => {
      const existing = mealMap.get(p.id);
      init[p.id] = {
        breakfast: existing?.breakfast || false,
        lunch: existing?.lunch || false,
        dinner: existing?.dinner || false,
      };
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const toggleAll = (type: 'breakfast' | 'lunch' | 'dinner') => {
    const allOn = profiles.every(p => entries[p.id]?.[type]);
    setEntries(prev => {
      const next = { ...prev };
      profiles.forEach(p => {
        next[p.id] = { ...next[p.id], [type]: !allOn };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upserts = profiles.map(p => ({
        user_id: p.id,
        date,
        month_key: monthKey,
        breakfast: entries[p.id]?.breakfast || false,
        lunch: entries[p.id]?.lunch || false,
        dinner: entries[p.id]?.dinner || false,
      }));

      const { error } = await supabase
        .from('meal_entries')
        .upsert(upserts, { onConflict: 'user_id,date,month_key' });
      
      if (error) throw error;
      toast.success(t('common.success'));
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 pt-4">
      {/* Bulk actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => toggleAll('breakfast')}>{t('meals.breakfast')}</Button>
        <Button size="sm" variant="outline" onClick={() => toggleAll('lunch')}>{t('meals.lunch')}</Button>
        <Button size="sm" variant="outline" onClick={() => toggleAll('dinner')}>{t('meals.dinner')}</Button>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {profiles.map(p => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm font-medium truncate max-w-[120px]">{p.full_name}</span>
            <div className="flex gap-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map(type => (
                <div key={type} className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-muted-foreground">
                    {type === 'breakfast' ? 'ส' : type === 'lunch' ? 'দ' : 'র'}
                  </span>
                  <Switch
                    checked={entries[p.id]?.[type] || false}
                    onCheckedChange={val => {
                      setEntries(prev => ({
                        ...prev,
                        [p.id]: { ...prev[p.id], [type]: val },
                      }));
                    }}
                    className="scale-75"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving ? t('common.loading') : t('meals.save')}
      </Button>
    </div>
  );
}
