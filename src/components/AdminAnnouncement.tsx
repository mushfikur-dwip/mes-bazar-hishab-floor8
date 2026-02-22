import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useMonthData';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Megaphone, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AdminAnnouncementSender() {
  const { isAdmin } = useAuth();
  const profiles = useProfiles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);

  if (!isAdmin) return null;

  const handleSend = async () => {
    if (!title || !message) return;
    setSending(true);
    try {
      const members = profiles.data || [];
      const targetUsers = target === 'all'
        ? members
        : members.filter(m => m.id === target);

      const notifications = targetUsers.map(m => ({
        user_id: m.id,
        title,
        message,
        type: 'announcement',
      }));

      const { error } = await (supabase as any).from('notifications').insert(notifications);
      if (error) throw error;

      toast.success(`${targetUsers.length} জনকে নোটিফিকেশন পাঠানো হয়েছে`);
      setDialogOpen(false);
      setTitle('');
      setMessage('');
      setTarget('all');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="pt-3 pb-3 flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">অ্যানাউন্সমেন্ট পাঠান</p>
              <p className="text-xs text-muted-foreground">সদস্যদের কাছে নোটিফিকেশন পাঠান</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            অ্যানাউন্সমেন্ট
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger>
              <SelectValue placeholder="প্রাপক" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সবাইকে</SelectItem>
              {(profiles.data || []).map(p => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="শিরোনাম"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="বার্তা লিখুন..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
          />
          <Button className="w-full" onClick={handleSend} disabled={sending || !title || !message}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? t('common.loading') : 'পাঠান'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
