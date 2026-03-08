import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('nl') ? 'nl' : 'en';

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'nl' ? 'en' : 'nl');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-8 w-8"
      title={currentLang === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}
    >
      <span className="text-xs font-bold uppercase">{currentLang === 'nl' ? 'EN' : 'NL'}</span>
    </Button>
  );
};
