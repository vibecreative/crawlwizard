import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CookiePreferences } from '@/hooks/useCookieConsent';

interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSavePreferences: (prefs: CookiePreferences) => void;
}

const CookieBanner = ({ onAcceptAll, onRejectAll, onSavePreferences }: CookieBannerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  const cookieCategories = [
    {
      key: 'necessary' as const,
      label: 'Noodzakelijke cookies',
      description: 'Vereist voor het functioneren van de website. Kan niet worden uitgeschakeld.',
      locked: true,
    },
    {
      key: 'functional' as const,
      label: 'Functionele cookies',
      description: 'Onthoudt je voorkeuren zoals thema en taalinstellingen.',
      locked: false,
    },
    {
      key: 'analytics' as const,
      label: 'Analytische cookies',
      description: 'Helpt ons begrijpen hoe bezoekers de website gebruiken zodat we deze kunnen verbeteren.',
      locked: false,
    },
    {
      key: 'marketing' as const,
      label: 'Marketing cookies',
      description: 'Wordt gebruikt om advertenties relevanter te maken voor jou.',
      locked: false,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-2xl">
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{t('cookie.title')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('cookie.description')}{' '}
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  {t('cookie.privacyLink')}
                </button>{' '}
                {t('cookie.readMore')}
              </p>
            </div>
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t('cookie.customize')}
          </button>

          {showDetails && (
            <div className="space-y-3 mb-5 border-t border-border pt-4">
              {cookieCategories.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                  <Switch
                    checked={prefs[cat.key]}
                    disabled={cat.locked}
                    onCheckedChange={(checked) =>
                      setPrefs((prev) => ({ ...prev, [cat.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onRejectAll} variant="outline" className="flex-1">
              {t('cookie.necessary')}
            </Button>
            {showDetails && (
              <Button
                onClick={() => onSavePreferences(prefs)}
                variant="secondary"
                className="flex-1"
              >
                {t('common.save')}
              </Button>
            )}
            <Button onClick={onAcceptAll} className="flex-1 gradient-primary text-primary-foreground">
              {t('cookie.acceptAll')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
