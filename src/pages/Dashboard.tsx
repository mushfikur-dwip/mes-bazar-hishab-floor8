import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useMonthSummary } from '@/hooks/useMonthData';
import { useLang } from '@/contexts/LangContext';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, ShoppingCart, Wallet, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, isAdmin, profile } = useAuth();
  const { monthKey } = useMonth();
  const { lang } = useLang();
  const { summaries, mealRate, totalBazar, totalMealUnits, isLoading } = useMonthSummary();
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
