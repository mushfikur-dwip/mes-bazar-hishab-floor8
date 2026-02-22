import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useMonthSummary, useBazarEntries } from '@/hooks/useMonthData';
import { useLang } from '@/contexts/LangContext';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, ShoppingCart, Wallet, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminAnnouncementSender } from '@/components/AdminAnnouncement';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
];

export default function Dashboard() {
  const { user, isAdmin, profile } = useAuth();
  const { monthKey } = useMonth();
  const { lang } = useLang();
  const { summaries, mealRate, totalBazar, totalMealUnits, isLoading } = useMonthSummary();
  const bazars = useBazarEntries(monthKey);
  const navigate = useNavigate();

  const mySummary = summaries.find(s => s.userId === user?.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  // Bazar trend data (daily cumulative)
  const bazarData = (bazars.data || [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce((acc: { date: string; amount: number; cumulative: number }[], b) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      const amt = Number(b.amount);
      acc.push({ date: b.date.slice(5), amount: amt, cumulative: prev + amt });
      return acc;
    }, []);

  // Member cost pie data
  const pieData = summaries
    .filter(s => s.totalCost > 0)
    .map(s => ({ name: s.fullName, value: Math.round(s.totalCost) }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {profile?.full_name ? `${profile.full_name} 👋` : t('dashboard.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{monthKey}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<UtensilsCrossed className="h-4 w-4" />}
          label={t('dashboard.totalMeals')}
          value={totalMealUnits.toFixed(1)}
        />
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label={t('dashboard.totalBazar')}
          value={`৳${totalBazar.toFixed(0)}`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t('dashboard.mealRate')}
          value={`৳${mealRate.toFixed(2)}`}
          highlight
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label={t('dashboard.myBalance')}
          value={mySummary ? `৳${mySummary.closingBalance.toFixed(0)}` : '৳0'}
          highlight={mySummary ? mySummary.closingBalance < 0 : false}
          negative={mySummary ? mySummary.closingBalance < 0 : false}
        />
      </div>

      {/* My Summary */}
      {mySummary && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('dashboard.myMeals')}</span>
              <span className="font-medium">{mySummary.mealUnits}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('dashboard.myCost')}</span>
              <span className="font-medium">৳{mySummary.totalCost.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('dashboard.myPaid')}</span>
              <span className="font-medium">৳{mySummary.paid.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bazar Trend Chart */}
      {bazarData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dashboard.bazarTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={bazarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={45} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="মোট বাজার"
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--chart-2, 160 60% 45%))"
                  strokeWidth={1.5}
                  dot={false}
                  name="দৈনিক"
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Member Cost Pie Chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dashboard.memberCost')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name.split(' ')[0]} ৳${value}`}
                  labelLine={false}
                  style={{ fontSize: 10 }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Admin Announcement */}
      {isAdmin && <AdminAnnouncementSender />}

      {/* Admin Quick Actions */}
      {isAdmin && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{t('dashboard.quickActions')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => navigate('/meals')}>
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-[10px]">{t('dashboard.addMeal')}</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => navigate('/bazar')}>
              <ShoppingCart className="h-4 w-4" />
              <span className="text-[10px]">{t('dashboard.addBazar')}</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => navigate('/payments')}>
              <Wallet className="h-4 w-4" />
              <span className="text-[10px]">{t('dashboard.addPayment')}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, highlight, negative }: {
  icon: React.ReactNode; label: string; value: string;
  highlight?: boolean; negative?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary/30' : ''}>
      <CardContent className="pt-3 pb-3 px-3">
        <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
          {icon}
          <span className="text-[11px]">{label}</span>
        </div>
        <p className={`text-lg font-bold ${negative ? 'text-destructive' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
