import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  necessary: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const COOKIE_KEY = 'cookie_consent';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
};

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences({ ...parsed, necessary: true });
        setHasConsented(true);
        setShowBanner(false);
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    const toSave = { ...prefs, necessary: true };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(toSave));
    setPreferences(toSave);
    setHasConsented(true);
    setShowBanner(false);
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
  }, [savePreferences]);

  const rejectAll = useCallback(() => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
  }, [savePreferences]);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(COOKIE_KEY);
    setPreferences(defaultPreferences);
    setHasConsented(false);
    setShowBanner(true);
  }, []);

  return {
    preferences,
    hasConsented,
    showBanner,
    setShowBanner,
    savePreferences,
    acceptAll,
    rejectAll,
    resetConsent,
  };
};
