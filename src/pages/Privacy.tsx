import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ContactForm from '@/components/ContactForm';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Search, Shield, Cookie, RefreshCw } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { useState, useEffect } from 'react';
import type { CookiePreferences } from '@/hooks/useCookieConsent';

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preferences, hasConsented, savePreferences, resetConsent } = useCookieConsent();
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = () => {
    savePreferences(localPrefs);
  };

  const hasChanges =
    localPrefs.analytics !== preferences.analytics ||
    localPrefs.marketing !== preferences.marketing ||
    localPrefs.functional !== preferences.functional;

  const cookieCategories = [
    {
      key: 'necessary' as const,
      label: t('privacy.necessaryCookies'),
      description: t('privacy.necessaryDesc'),
      examples: ['Sessie-cookies', 'CSRF-tokens', 'Cookie-voorkeur opslag'],
      locked: true,
    },
    {
      key: 'functional' as const,
      label: t('privacy.functionalCookies'),
      description: t('privacy.functionalDesc'),
      examples: ['Thema-voorkeur', 'Taalinstelling'],
      locked: false,
    },
    {
      key: 'analytics' as const,
      label: t('privacy.analyticsCookies'),
      description: t('privacy.analyticsDesc'),
      examples: ['Paginaweergaven', 'Bezoekerstellingen'],
      locked: false,
    },
    {
      key: 'marketing' as const,
      label: t('privacy.marketingCookies'),
      description: t('privacy.marketingDesc'),
      examples: ['Advertentie-tracking', 'Social media pixels', 'Retargeting'],
      locked: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t('privacy.title')}
        description={t('privacy.cookieDescription')}
        canonical="/privacy"
      />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Search className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CrawlWizard</span>
            </button>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('privacy.title')}</h1>
              <p className="text-muted-foreground">{t('privacy.lastUpdated')}</p>
            </div>
          </div>

          {/* Cookie Management Section */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-primary" />
                <CardTitle>{t('privacy.cookieSettings')}</CardTitle>
              </div>
              {hasConsented && (
                <Badge variant="secondary" className="w-fit">
                  <Shield className="w-3 h-3 mr-1" />
                  {t('privacy.preferencesSaved')}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('privacy.cookieDescription')}
              </p>

              <div className="space-y-4">
                {cookieCategories.map((cat) => (
                  <div key={cat.key} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="font-medium">{cat.label}</p>
                        {cat.locked && (
                          <Badge variant="outline" className="text-xs mt-1">{t('privacy.alwaysActive')}</Badge>
                        )}
                      </div>
                      <Switch
                        checked={localPrefs[cat.key]}
                        disabled={cat.locked}
                        onCheckedChange={(checked) =>
                          setLocalPrefs((prev) => ({ ...prev, [cat.key]: checked }))
                        }
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{cat.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.examples.map((ex) => (
                        <Badge key={ex} variant="secondary" className="text-xs">{ex}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="gradient-primary text-primary-foreground"
                >
                  {t('privacy.savePreferences')}
                </Button>
                <Button variant="outline" onClick={resetConsent}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('privacy.resetPreferences')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. {i18n.language === 'nl' ? 'Inleiding' : 'Introduction'}</h2>
              <p className="text-muted-foreground">
                {t('privacy.intro')}
              </p>
              <p className="text-muted-foreground">
                {t('privacy.gdprCompliance')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Contact</h2>
              <ContactForm />
            </section>
          </div>
        </div>
      </main>

      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CrawlWizard. {t('privacy.allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
