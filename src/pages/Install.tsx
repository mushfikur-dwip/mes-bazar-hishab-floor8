import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold">ইন্সটল সম্পন্ন!</h2>
            <p className="text-sm text-muted-foreground">
              মিল হিসাব অ্যাপ আপনার ডিভাইসে ইন্সটল আছে।
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-2"><Smartphone className="h-10 w-10 mx-auto text-primary" /></div>
          <CardTitle className="text-lg">মিল হিসাব ইন্সটল করুন</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            অ্যাপটি আপনার ফোনে ইন্সটল করুন — নেটিভ অ্যাপের মতো কাজ করবে, অফলাইনেও চলবে!
          </p>

          {deferredPrompt && (
            <Button className="w-full" size="lg" onClick={handleInstall}>
              <Download className="h-5 w-5 mr-2" />
              এখনই ইন্সটল করুন
            </Button>
          )}

          {isIOS && !deferredPrompt && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> iPhone/iPad এ ইন্সটল করতে:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Safari ব্রাউজারে খুলুন</li>
                <li>নিচের <Share className="h-3 w-3 inline" /> (Share) বাটনে ট্যাপ করুন</li>
                <li>"Add to Home Screen" নির্বাচন করুন</li>
                <li>"Add" ট্যাপ করুন</li>
              </ol>
            </div>
          )}

          {!isIOS && !deferredPrompt && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> ইন্সটল করতে:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Chrome/Edge ব্রাউজারে খুলুন</li>
                <li>মেনু (⋮) থেকে "Install app" বা "Add to Home screen" নির্বাচন করুন</li>
                <li>"Install" ট্যাপ করুন</li>
              </ol>
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium">কেন ইন্সটল করবেন?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>হোম স্ক্রিন থেকে সরাসরি খুলুন</li>
              <li>দ্রুত লোড হয়, অফলাইনেও চলে</li>
              <li>টেলিগ্রাম নোটিফিকেশন পাবেন</li>
              <li>কম ডেটা খরচ</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
