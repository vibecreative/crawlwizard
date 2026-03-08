import { useNavigate } from 'react-router-dom';
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
      label: 'Noodzakelijke cookies',
      description: 'Deze cookies zijn essentieel voor het functioneren van de website. Ze zorgen voor basisfuncties zoals paginanavigatie, sessie-beheer en toegang tot beveiligde delen. Zonder deze cookies kan de website niet goed functioneren.',
      examples: ['Sessie-cookies', 'CSRF-tokens', 'Cookie-voorkeur opslag'],
      locked: true,
    },
    {
      key: 'functional' as const,
      label: 'Functionele cookies',
      description: 'Functionele cookies onthouden je voorkeuren en keuzes, zoals je gekozen thema (donker/licht modus) en taalinstellingen. Dit verbetert je gebruikerservaring bij herhaalde bezoeken.',
      examples: ['Thema-voorkeur', 'Taalinstelling'],
      locked: false,
    },
    {
      key: 'analytics' as const,
      label: 'Analytische cookies',
      description: 'Deze cookies helpen ons begrijpen hoe bezoekers de website gebruiken door geanonimiseerde informatie te verzamelen. Hiermee kunnen we onze website voortdurend verbeteren.',
      examples: ['Paginaweergaven', 'Bezoekerstellingen', 'Meest bezochte pagina\'s'],
      locked: false,
    },
    {
      key: 'marketing' as const,
      label: 'Marketing cookies',
      description: 'Marketing cookies worden gebruikt om bezoekers te volgen op verschillende websites. Het doel is om advertenties te tonen die relevant en aantrekkelijk zijn voor de individuele gebruiker.',
      examples: ['Advertentie-tracking', 'Social media pixels', 'Retargeting'],
      locked: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
            Terug
          </Button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacybeleid</h1>
              <p className="text-muted-foreground">Laatst bijgewerkt: 7 februari 2026</p>
            </div>
          </div>

          {/* Cookie Management Section */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-primary" />
                <CardTitle>Je cookie-instellingen</CardTitle>
              </div>
              {hasConsented && (
                <Badge variant="secondary" className="w-fit">
                  <Shield className="w-3 h-3 mr-1" />
                  Voorkeuren opgeslagen
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Hieronder kun je je cookie-voorkeuren bekijken en aanpassen. Wijzigingen worden direct toegepast.
              </p>

              <div className="space-y-4">
                {cookieCategories.map((cat) => (
                  <div key={cat.key} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="font-medium">{cat.label}</p>
                        {cat.locked && (
                          <Badge variant="outline" className="text-xs mt-1">Altijd actief</Badge>
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
                  Voorkeuren opslaan
                </Button>
                <Button variant="outline" onClick={resetConsent}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Opnieuw instellen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Inleiding</h2>
              <p className="text-muted-foreground">
                CrawlWizard respecteert je privacy en zorgt ervoor dat je persoonlijke gegevens worden beschermd. Dit privacybeleid is van toepassing op de website en diensten van CrawlWizard en legt uit welke gegevens we verzamelen, waarom we dat doen en hoe we deze beschermen.
              </p>
              <p className="text-muted-foreground">
                Dit beleid voldoet aan de Algemene Verordening Gegevensbescherming (AVG/GDPR) en is van toepassing op alle bezoekers en gebruikers van onze dienst.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Welke gegevens verzamelen wij?</h2>
              <p className="text-muted-foreground">Wij kunnen de volgende gegevens verzamelen:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Accountgegevens:</strong> E-mailadres en naam bij het aanmaken van een account.</li>
                <li><strong>Gebruiksgegevens:</strong> Geanalyseerde URL's en analyseresultaten.</li>
                <li><strong>Technische gegevens:</strong> IP-adres, browsertype en apparaatinformatie (indien analytische cookies zijn geaccepteerd).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Waarvoor gebruiken wij je gegevens?</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Het aanbieden en verbeteren van onze SEO-analysediensten.</li>
                <li>Het beheren van je account en instellingen.</li>
                <li>Het analyseren van websitegebruik om onze dienst te verbeteren (alleen met toestemming).</li>
                <li>Het versturen van service-gerelateerde communicatie.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Rechtsgrond voor verwerking</h2>
              <p className="text-muted-foreground">
                Wij verwerken je persoonsgegevens op basis van de volgende rechtsgronden:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Toestemming:</strong> Voor analytische en marketing cookies.</li>
                <li><strong>Uitvoering overeenkomst:</strong> Voor het leveren van onze diensten aan je account.</li>
                <li><strong>Gerechtvaardigd belang:</strong> Voor het beveiligen en verbeteren van onze dienst.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Bewaartermijnen</h2>
              <p className="text-muted-foreground">
                Wij bewaren je gegevens niet langer dan noodzakelijk voor de doeleinden waarvoor ze zijn verzameld. Accountgegevens worden bewaard zolang je account actief is. Na het verwijderen van je account worden je gegevens binnen 30 dagen verwijderd.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Je rechten</h2>
              <p className="text-muted-foreground">Op grond van de AVG heb je de volgende rechten:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Recht op inzage:</strong> Je kunt opvragen welke gegevens wij van je hebben.</li>
                <li><strong>Recht op rectificatie:</strong> Je kunt onjuiste gegevens laten corrigeren.</li>
                <li><strong>Recht op verwijdering:</strong> Je kunt verzoeken dat je gegevens worden verwijderd.</li>
                <li><strong>Recht op beperking:</strong> Je kunt de verwerking van je gegevens laten beperken.</li>
                <li><strong>Recht op overdraagbaarheid:</strong> Je kunt je gegevens in een gangbaar formaat ontvangen.</li>
                <li><strong>Recht op bezwaar:</strong> Je kunt bezwaar maken tegen de verwerking van je gegevens.</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Voor het uitoefenen van je rechten kun je contact opnemen via het e-mailadres onderaan deze pagina.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Beveiliging</h2>
              <p className="text-muted-foreground">
                Wij nemen passende technische en organisatorische maatregelen om je gegevens te beschermen tegen ongeautoriseerde toegang, wijziging, openbaarmaking of vernietiging. Dit omvat versleutelde verbindingen (SSL/TLS), beveiligde opslag en toegangscontrole.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Gegevens delen met derden</h2>
              <p className="text-muted-foreground">
                Wij delen je gegevens niet met derden, tenzij dit noodzakelijk is voor het verlenen van onze diensten (zoals hostingproviders) of wanneer we hiertoe wettelijk verplicht zijn. Alle verwerkers waarmee wij samenwerken hebben een verwerkersovereenkomst getekend.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Contact</h2>
              <p className="text-muted-foreground">
                Heb je vragen over dit privacybeleid of wil je een van je rechten uitoefenen? Neem dan contact met ons op via:
              </p>
              <p className="text-muted-foreground font-medium mt-2">
                E-mail: privacy@seoanalyzer.nl
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CrawlWizard. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
