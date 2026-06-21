import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery token in URL hash via detectSessionInUrl
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    // Also check existing session (in case event already fired)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('পাসওয়ার্ড মিলছে না!');
      return;
    }
    if (password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে!');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('পাসওয়ার্ড পরিবর্তন সফল!');
      await supabase.auth.signOut();
      navigate('/', { replace: true });
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
          <CardTitle className="text-xl">নতুন পাসওয়ার্ড সেট করুন</CardTitle>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <p className="text-sm text-muted-foreground text-center">
              রিকভারি লিংক যাচাই হচ্ছে... লিংকটি ইমেইল থেকে সরাসরি ওপেন করুন।
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="নতুন পাসওয়ার্ড"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                type="password"
                placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'লোড হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
