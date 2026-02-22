import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMonth } from '@/contexts/MonthContext';
import { DEFAULT_WEIGHTS, calcMonthSummaries, calcMealRate, type MealWeight, type MealEntry } from '@/lib/calculations';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, phone');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMealWeights(monthKey: string) {
  return useQuery({
    queryKey: ['meal_weights', monthKey],
    queryFn: async () => {
      const { data } = await supabase
        .from('meal_weight_settings')
        .select('*')
        .eq('month_key', monthKey)
        .maybeSingle();
      return data ? {
        breakfast_weight: Number(data.breakfast_weight),
        lunch_weight: Number(data.lunch_weight),
        dinner_weight: Number(data.dinner_weight),
      } : DEFAULT_WEIGHTS;
    },
  });
}

export function useMealEntries(monthKey: string) {
  return useQuery({
    queryKey: ['meal_entries', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_entries')
        .select('*')
        .eq('month_key', monthKey);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBazarEntries(monthKey: string) {
  return useQuery({
    queryKey: ['bazar_entries', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bazar_entries')
        .select('*')
        .eq('month_key', monthKey)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useExtraCosts(monthKey: string) {
  return useQuery({
    queryKey: ['extra_costs', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extra_costs')
        .select('*')
        .eq('month_key', monthKey);
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePayments(monthKey: string) {
  return useQuery({
    queryKey: ['payments', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('month_key', monthKey)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMemberMonthStatus(monthKey: string) {
  return useQuery({
    queryKey: ['member_month_status', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_month_status')
        .select('*')
        .eq('month_key', monthKey);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBalanceLedger(monthKey: string) {
  return useQuery({
    queryKey: ['balance_ledger', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balance_ledger')
        .select('*')
        .eq('month_key', monthKey);
      if (error) throw error;
      return data || [];
    },
  });
}

// Get previous month key
export function getPrevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // month is 0-indexed
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function usePrevBalanceLedger(monthKey: string) {
  const prevMonth = getPrevMonthKey(monthKey);
  return useQuery({
    queryKey: ['balance_ledger', prevMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balance_ledger')
        .select('*')
        .eq('month_key', prevMonth);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMonthSummary() {
  const { monthKey } = useMonth();
  const profiles = useProfiles();
  const weights = useMealWeights(monthKey);
  const meals = useMealEntries(monthKey);
  const bazars = useBazarEntries(monthKey);
  const extras = useExtraCosts(monthKey);
  const payments = usePayments(monthKey);
  const monthStatus = useMemberMonthStatus(monthKey);
  const prevBalances = usePrevBalanceLedger(monthKey);

  const isLoading = profiles.isLoading || weights.isLoading || meals.isLoading ||
    bazars.isLoading || extras.isLoading || payments.isLoading ||
    monthStatus.isLoading || prevBalances.isLoading;

  if (isLoading || !profiles.data || !weights.data || !meals.data || !bazars.data ||
      !extras.data || !payments.data) {
    return { summaries: [], mealRate: 0, totalBazar: 0, totalMealUnits: 0, isLoading };
  }

  const allProfiles = profiles.data;
  const memberNames: Record<string, string> = {};
  allProfiles.forEach(p => { memberNames[p.id] = p.full_name || 'Unknown'; });

  // Get active members
  const statusMap = new Map((monthStatus.data || []).map(s => [s.user_id, s.is_active]));
  const activeIds = allProfiles
    .filter(p => statusMap.get(p.id) !== false) // default active
    .map(p => p.id);

  const w = weights.data;
  const totalBazar = bazars.data.reduce((s, b) => s + Number(b.amount), 0);
  const totalExtraCosts = extras.data.reduce((s, e) => s + Number(e.amount), 0);

  const openingBalances: Record<string, number> = {};
  (prevBalances.data || []).forEach(b => {
    openingBalances[b.user_id] = Number(b.closing_balance);
  });

  const mealEntries: MealEntry[] = meals.data.map(m => ({
    user_id: m.user_id,
    breakfast: m.breakfast,
    lunch: m.lunch,
    dinner: m.dinner,
    breakfast_guest_count: (m as any).breakfast_guest_count || 0,
    lunch_guest_count: (m as any).lunch_guest_count || 0,
    dinner_guest_count: (m as any).dinner_guest_count || 0,
  }));

  const paymentsList = payments.data.map(p => ({
    user_id: p.user_id,
    amount: Number(p.amount),
  }));

  const summaries = calcMonthSummaries(
    activeIds, memberNames, mealEntries, w, totalBazar,
    totalExtraCosts, activeIds.length, paymentsList, openingBalances,
  );

  const totalMealUnits = mealEntries.reduce((s, e) => {
    let u = 0;
    if (e.breakfast) u += (1 + (e.breakfast_guest_count || 0)) * w.breakfast_weight;
    if (e.lunch) u += (1 + (e.lunch_guest_count || 0)) * w.lunch_weight;
    if (e.dinner) u += (1 + (e.dinner_guest_count || 0)) * w.dinner_weight;
    return s + u;
  }, 0);

  const mealRate = calcMealRate(totalBazar, totalMealUnits);

  return { summaries, mealRate, totalBazar, totalMealUnits, isLoading };
}
