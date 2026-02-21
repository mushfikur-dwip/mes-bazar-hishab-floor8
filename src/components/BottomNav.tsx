import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ShoppingCart, Wallet, BarChart3, Settings } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' as const },
  { path: '/meals', icon: UtensilsCrossed, labelKey: 'nav.meals' as const },
  { path: '/bazar', icon: ShoppingCart, labelKey: 'nav.bazar' as const },
  { path: '/payments', icon: Wallet, labelKey: 'nav.payments' as const },
  { path: '/reports', icon: BarChart3, labelKey: 'nav.reports' as const },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' as const },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLang(); // trigger re-render on lang change

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
