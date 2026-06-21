import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';

type Mode = 'login' | 'signup' | 'forgot';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('রেজিস্ট্রেশন সফল! ইমেইল ভেরিফাই করুন।');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে!');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('লগইন সফল!');
      }
    } catch (err: any) {
      toast.error(err.message || 'ত্রুটি হয়েছে!');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'signup' ? t('auth.signup') : mode === 'forgot' ? 'পাসওয়ার্ড রিসেট' : t('auth.login');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2"><UtensilsCrossed className="h-8 w-8 mx-auto text-primary" /></div>
          <CardTitle className="text-xl">{t('app.name')}</CardTitle>
          <p className="text-sm text-muted-foreground">{title}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                placeholder={t('auth.fullName')}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {mode !== 'forgot' && (
              <Input
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t('common.loading')
                : mode === 'signup'
                ? t('auth.signup')
                : mode === 'forgot'
                ? 'রিসেট লিংক পাঠান'
                : t('auth.login')}
            </Button>
          </form>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="w-full mt-3 text-sm text-primary hover:underline"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup')}
            className="w-full mt-2 text-sm text-primary hover:underline"
          >
            {mode === 'signup'
              ? t('auth.hasAccount')
              : mode === 'forgot'
              ? 'লগইনে ফিরে যান'
              : t('auth.noAccount')}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
