import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { z } from 'zod';

const Auth = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'free';
  const planLabel = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
  const { toast } = useToast();

  const emailSchema = z.string().email(t('auth.invalidEmail'));
  const passwordSchema = z.string().min(6, t('auth.passwordMinLength'));

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
    try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.errors[0].message; }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      let message = t('auth.loginError');
      if (error.message.includes('Invalid login credentials')) message = t('auth.invalidCredentials');
      else if (error.message.includes('Email not confirmed')) message = t('auth.confirmEmail');
      toast({ title: t('auth.loginFailed'), description: message, variant: 'destructive' });
    } else {
      toast({ title: t('auth.welcomeBack'), description: t('auth.loginSuccess') });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName, selectedPlan);
    setIsLoading(false);
    if (error) {
      let message = t('auth.registerError');
      if (error.message.includes('User already registered')) message = t('auth.userExists');
      toast({ title: t('auth.registerFailed'), description: message, variant: 'destructive' });
    } else {
      setRegisteredEmail(email);
      setShowConfirmDialog(true);
      setEmail(''); setPassword(''); setFullName('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <SEOHead
        title={t('auth.title')}
        description={t('auth.description')}
        canonical="/auth"
        noindex
      />
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="w-full max-w-sm space-y-6 relative">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-display">CrawlWizard</h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.subtitle')}
          </p>
        </div>

        <Card className="border-border/50 shadow-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-display">{t('auth.account')}</CardTitle>
            <CardDescription className="text-xs">
              {t('auth.accountDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5 h-9">
                <TabsTrigger value="login" className="text-xs">{t('auth.loginTab')}</TabsTrigger>
                <TabsTrigger value="register" className="text-xs">{t('auth.registerTab')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-9 text-sm" disabled={isLoading} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-xs">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="login-password" type="password" placeholder={t('auth.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-9 text-sm" disabled={isLoading} />
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground h-9 text-sm" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loggingIn')}</> : t('auth.loginButton')}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <div className="mb-4 p-2.5 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs font-medium text-primary">
                    {t('auth.startingWithPlan', { plan: planLabel })}
                  </p>
                </div>
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-name" className="text-xs">{t('auth.fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="register-name" type="text" placeholder={t('auth.fullNamePlaceholder')} value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9 h-9 text-sm" disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-email" className="text-xs">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="register-email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-9 text-sm" disabled={isLoading} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-password" className="text-xs">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="register-password" type="password" placeholder={t('auth.passwordMin')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-9 text-sm" disabled={isLoading} />
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground h-9 text-sm" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.registering')}</> : t('auth.registerButton')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-center sm:text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-lg font-display">{t('auth.checkInbox')}</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              {t('auth.verificationSent')}{' '}
              <span className="font-semibold text-foreground">{registeredEmail}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground text-center">
              {t('auth.clickLink')}
            </p>
            <Button className="w-full h-9 text-sm" variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('auth.understood')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
