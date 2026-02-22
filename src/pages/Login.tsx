import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2"><UtensilsCrossed className="h-8 w-8 mx-auto text-primary" /></div>
          <CardTitle className="text-xl">{t('app.name')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isSignup ? t('auth.signup') : t('auth.login')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
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
            <Input
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : isSignup ? t('auth.signup') : t('auth.login')}
            </Button>
          </form>
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="w-full mt-4 text-sm text-primary hover:underline"
          >
            {isSignup ? t('auth.hasAccount') : t('auth.noAccount')}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
