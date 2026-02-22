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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isToday, isFuture, isPast } from 'date-fns';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Clock, Users } from 'lucide-react';

// Default cutoff settings
const DEFAULT_CUTOFFS = {
  breakfast_cutoff_hour: 22,
  breakfast_cutoff_prev_day: true,
  lunch_cutoff_hour: 9,
  lunch_cutoff_prev_day: false,
  dinner_cutoff_hour: 14,
  dinner_cutoff_prev_day: false,
};

function useCutoffSettings(monthKey: string) {
  return useQuery({
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
}

function isCutoffPassed(mealType: 'breakfast' | 'lunch' | 'dinner', dateStr: string, cutoffs: typeof DEFAULT_CUTOFFS): boolean {
  const now = new Date();
  const targetDate = new Date(dateStr + 'T00:00:00');
  
  let cutoffHour: number;
  let isPrevDay: boolean;
  
  if (mealType === 'breakfast') {
    cutoffHour = cutoffs.breakfast_cutoff_hour;
    isPrevDay = cutoffs.breakfast_cutoff_prev_day;
  } else if (mealType === 'lunch') {
    cutoffHour = cutoffs.lunch_cutoff_hour;
    isPrevDay = cutoffs.lunch_cutoff_prev_day;
  } else {
    cutoffHour = cutoffs.dinner_cutoff_hour;
    isPrevDay = cutoffs.dinner_cutoff_prev_day;
  }
  
  const cutoffDate = new Date(targetDate);
  if (isPrevDay) {
    cutoffDate.setDate(cutoffDate.getDate() - 1);
  }
  cutoffDate.setHours(cutoffHour, 0, 0, 0);
  
  return now > cutoffDate;
}

export default function Meals() {
  const { isAdmin, user } = useAuth();
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

      {/* Member self-management section */}
      {!isAdmin && user && (
        <MemberMealSelfManager userId={user.id} monthKey={monthKey} />
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} className="font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {Array.from({ length: start.getDay() }).map((_,i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = getMealCount(dateStr);
          const todayCheck = dateStr === format(new Date(), 'yyyy-MM-dd');
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
                ${todayCheck ? 'ring-2 ring-primary' : ''}
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

// ========== Member Self-Management Component ==========
function MemberMealSelfManager({ userId, monthKey }: { userId: string; monthKey: string }) {
  const queryClient = useQueryClient();
  const cutoffs = useCutoffSettings(monthKey);
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    return format(d, 'yyyy-MM-dd');
  });

  // Only show dates within the current monthKey
  const [year, month] = monthKey.split('-').map(Number);
  const validDates = next7Days.filter(d => d.startsWith(monthKey));

  const meals = useMealEntries(monthKey);
  const [saving, setSaving] = useState<string | null>(null);

  const cutoffData = cutoffs.data || DEFAULT_CUTOFFS;

  const getUserMealForDate = (dateStr: string) => {
    return (meals.data || []).find(m => m.user_id === userId && m.date === dateStr);
  };

  const toggleMeal = async (dateStr: string, mealType: 'breakfast' | 'lunch' | 'dinner', currentVal: boolean) => {
    if (isCutoffPassed(mealType, dateStr, cutoffData)) {
      toast.error(t('meals.cutoffPassed'));
      return;
    }

    setSaving(dateStr + mealType);
    try {
      const existing = getUserMealForDate(dateStr);
      const upsertData: Record<string, any> = {
        user_id: userId,
        date: dateStr,
        month_key: monthKey,
        breakfast: existing?.breakfast ?? true,
        lunch: existing?.lunch ?? true,
        dinner: existing?.dinner ?? true,
        [mealType]: !currentVal,
        updated_by: userId,
      };

      const { error } = await supabase
        .from('meal_entries')
        .upsert(upsertData as any, { onConflict: 'user_id,date,month_key' });
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['meal_entries', monthKey] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (meals.isLoading) return <Skeleton className="h-32" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('meals.myMeals')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {validDates.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('common.noData')}</p>
        )}
        {validDates.map(dateStr => {
          const existing = getUserMealForDate(dateStr);
          const dayDate = new Date(dateStr + 'T00:00:00');
          const dayLabel = isToday(dayDate) ? 'আজ' : format(dayDate, 'dd MMM');
          
          return (
            <div key={dateStr} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-xs font-medium w-16">{dayLabel}</span>
              <div className="flex gap-3">
                {(['breakfast', 'lunch', 'dinner'] as const).map(type => {
                  const val = existing ? existing[type] : true; // default ON
                  const cutoffPassed = isCutoffPassed(type, dateStr, cutoffData);
                  return (
                    <div key={type} className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-muted-foreground">
                        {type === 'breakfast' ? 'সকাল' : type === 'lunch' ? 'দুপুর' : 'রাত'}
                      </span>
                      <Switch
                        checked={val}
                        onCheckedChange={() => toggleMeal(dateStr, type, val)}
                        disabled={cutoffPassed || saving !== null}
                        className="scale-75"
                      />
                      {cutoffPassed && (
                        <span className="text-[7px] text-destructive">{t('meals.timeOver')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ========== Admin Day Meal Editor with Guest Count ==========
function DayMealEditor({ date, monthKey, profiles, existingMeals, weights, onSaved }: {
  date: string;
  monthKey: string;
  profiles: { id: string; full_name: string }[];
  existingMeals: any[];
  weights: { breakfast_weight: number; lunch_weight: number; dinner_weight: number };
  onSaved: () => void;
}) {
  const mealMap = new Map(existingMeals.map(m => [m.user_id, m]));
  
  interface EntryState {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    breakfast_guest_count: number;
    lunch_guest_count: number;
    dinner_guest_count: number;
  }

  const [entries, setEntries] = useState<Record<string, EntryState>>(() => {
    const init: Record<string, EntryState> = {};
    profiles.forEach(p => {
      const existing = mealMap.get(p.id);
      init[p.id] = {
        breakfast: existing?.breakfast || false,
        lunch: existing?.lunch || false,
        dinner: existing?.dinner || false,
        breakfast_guest_count: existing?.breakfast_guest_count || 0,
        lunch_guest_count: existing?.lunch_guest_count || 0,
        dinner_guest_count: existing?.dinner_guest_count || 0,
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
        if (allOn) {
          // Turning off - reset guest count
          (next[p.id] as any)[`${type}_guest_count`] = 0;
        }
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
        breakfast_guest_count: entries[p.id]?.breakfast_guest_count || 0,
        lunch_guest_count: entries[p.id]?.lunch_guest_count || 0,
        dinner_guest_count: entries[p.id]?.dinner_guest_count || 0,
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
          <div key={p.id} className="py-2 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate max-w-[120px]">{p.full_name}</span>
              <div className="flex gap-4">
                {(['breakfast', 'lunch', 'dinner'] as const).map(type => (
                  <div key={type} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground">
                      {type === 'breakfast' ? 'সকাল' : type === 'lunch' ? 'দুপুর' : 'রাত'}
                    </span>
                    <Switch
                      checked={entries[p.id]?.[type] || false}
                      onCheckedChange={val => {
                        setEntries(prev => ({
                          ...prev,
                          [p.id]: {
                            ...prev[p.id],
                            [type]: val,
                            ...(val ? {} : { [`${type}_guest_count`]: 0 }),
                          },
                        }));
                      }}
                      className="scale-75"
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Guest count row */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {t('meals.guest')}
              </span>
              <div className="flex gap-4">
                {(['breakfast', 'lunch', 'dinner'] as const).map(type => {
                  const guestKey = `${type}_guest_count` as keyof EntryState;
                  const mealOn = entries[p.id]?.[type] || false;
                  return (
                    <div key={type} className="w-[44px] flex justify-center">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={Number(entries[p.id]?.[guestKey] || 0)}
                        disabled={!mealOn}
                        onChange={e => {
                          const val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                          setEntries(prev => ({
                            ...prev,
                            [p.id]: { ...prev[p.id], [guestKey]: val },
                          }));
                        }}
                        className="h-6 w-10 text-center text-xs px-1"
                      />
                    </div>
                  );
                })}
              </div>
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
