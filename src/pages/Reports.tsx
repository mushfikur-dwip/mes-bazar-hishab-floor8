import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useLang } from '@/contexts/LangContext';
import { useMonthSummary } from '@/hooks/useMonthData';
import { exportToPdf, exportToExcel } from '@/lib/export';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, FileSpreadsheet } from 'lucide-react';

export default function Reports() {
  const { user, isAdmin } = useAuth();
  const { monthKey } = useMonth();
  const { lang } = useLang();
  const { summaries, mealRate, isLoading } = useMonthSummary();

  const visibleSummaries = isAdmin ? summaries : summaries.filter(s => s.userId === user?.id);

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('reports.title')}</h2>
        {isAdmin && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => exportToPdf(summaries, monthKey, mealRate)}>
              <FileText className="h-3 w-3 mr-1" />PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportToExcel(summaries, monthKey, mealRate)}>
              <FileSpreadsheet className="h-3 w-3 mr-1" />Excel
            </Button>
          </div>
        )}
      </div>

      <Card className="border-primary/30">
        <CardContent className="pt-3 pb-3 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('dashboard.mealRate')}</span>
          <span className="text-lg font-bold">৳{mealRate.toFixed(2)}</span>
        </CardContent>
      </Card>

      {/* Mobile-friendly card-based report */}
      <div className="space-y-3">
        {visibleSummaries.map(s => (
          <Card key={s.userId}>
            <CardContent className="pt-3 pb-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{s.fullName}</span>
                <span className={`text-sm font-bold ${s.closingBalance < 0 ? 'text-destructive' : 'text-primary'}`}>
                  ৳{s.closingBalance.toFixed(0)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('reports.opening')}:</span>
                  <span className="text-foreground">৳{s.openingBalance.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('reports.mealUnits')}:</span>
                  <span className="text-foreground">{s.mealUnits}</span>
                </div>
                {s.guestMealUnits > 0 && (
                  <div className="flex justify-between">
                    <span>{t('meals.guestMealUnits')}:</span>
                    <span className="text-foreground">{s.guestMealUnits}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('reports.mealCost')}:</span>
                  <span className="text-foreground">৳{s.mealCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('reports.extraShare')}:</span>
                  <span className="text-foreground">৳{s.extraShare.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('reports.totalCost')}:</span>
                  <span className="text-foreground">৳{s.totalCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('reports.paid')}:</span>
                  <span className="text-foreground">৳{s.paid.toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {visibleSummaries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
