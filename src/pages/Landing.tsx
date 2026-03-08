import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Search, 
  BarChart3, 
  Zap, 
  Check, 
  ArrowRight, 
  Globe, 
  FileText, 
  TrendingUp,
  Info,
  ChevronRight,
  Target,
  Layers,
  Bot,
  Gauge
} from 'lucide-react';
import { useState } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);

  const features = [
    {
      icon: Layers,
      title: 'Heading Analyse',
      description: 'Ontdek in één oogopslag of je heading-structuur klopt – de basis van elke goed geïndexeerde pagina.'
    },
    {
      icon: FileText,
      title: 'Meta & Structured Data',
      description: 'Structured data is de sleutel tot rich snippets én tot hoe AI-tools jouw content begrijpen. Wij maken het inzichtelijk.'
    },
    {
      icon: Gauge,
      title: 'SEO Score',
      description: 'Geen vaag rapportcijfer, maar een concrete score met exacte verbeterpunten. Weet precies wat je morgen moet aanpakken.'
    },
    {
      icon: Globe,
      title: 'Website Analyse',
      description: 'Scan je hele website in één keer. Tot 500 pagina\'s geanalyseerd, geen enkel probleem over het hoofd gezien.'
    },
    {
      icon: Bot,
      title: 'AI FAQ Generator',
      description: 'FAQ\'s zijn goud voor rich snippets én voor AI-antwoorden. Genereer direct relevante vragen die jouw doelgroep stelt.'
    },
    {
      icon: Target,
      title: 'Keyword Analyse',
      description: 'Schrijf je té veel of te weinig over je kernonderwerp? Wij laten het zien – per pagina, per keyword.'
    }
  ];

  const plans = [
    {
      name: 'Free',
      monthlyPrice: '€0',
      yearlyPrice: '€0',
      period: 'voor altijd',
      description: 'Gratis verkennen',
      subtitle: 'Analyseer je eerste pagina\'s en ontdek wat er beter kan.',
      credits: '10 AI-credits/maand',
      features: [
        '1 pagina per analyse',
        'Tot 10 analyses',
        'SEO-score per pagina',
        'Heading-structuur analyse',
        'Meta-informatie overzicht',
        '10 AI-credits per maand',
        'Browser AI (onbeperkt, gratis)'
      ],
      cta: 'Gratis starten',
      popular: false,
      variant: 'outline' as const
    },
    {
      name: 'Scale',
      monthlyPrice: '€17,95',
      yearlyPrice: '€14,95',
      period: 'per maand',
      description: 'Voor serieuze websites',
      subtitle: 'Analyseer je hele website en weet precies waar je winst ligt.',
      credits: '50 AI-credits/maand',
      features: [
        'Volledige website-analyse',
        'Tot 100 pagina\'s per scan',
        '1 project opslaan',
        'AI FAQ Generator',
        'Keyword analyse',
        'Structured data analyse',
        '50 AI-credits per maand',
        'Browser AI (onbeperkt, gratis)'
      ],
      cta: 'Start met Scale',
      popular: true,
      variant: 'default' as const
    },
    {
      name: 'Enterprise',
      monthlyPrice: '€39,95',
      yearlyPrice: '€35',
      period: 'per maand',
      description: 'Voor teams & bureaus',
      subtitle: 'Beheer meerdere websites, rapporteer naar klanten, schaal zonder limieten.',
      credits: '200 AI-credits/maand',
      features: [
        'Alles uit Scale',
        'Tot 500 pagina\'s per scan',
        '3 projecten opslaan',
        'AI Ranking Check (4 modellen)',
        'AI Artikel Generator',
        '200 AI-credits per maand',
        'Browser AI (onbeperkt, gratis)',
        'Prioriteit support'
      ],
      cta: 'Start met Enterprise',
      popular: false,
      variant: 'outline' as const
    }
  ];

  const stats = [
    { value: '500+', label: 'Pagina\'s per scan' },
    { value: '6', label: 'SEO-checks per pagina' },
    { value: '4', label: 'AI-modellen' },
    { value: '< 30s', label: 'Gemiddelde scantijd' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Search className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">CrawlWizard</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Prijzen</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Hoe het werkt</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Inloggen
            </Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground">
              Gratis starten
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        {/* Geometric accent shapes */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-32 right-12 w-20 h-20 border-4 border-primary/20 rounded-lg rotate-12 hidden lg:block" />
        <div className="absolute bottom-20 left-16 w-12 h-12 bg-primary/15 rounded-full hidden lg:block" />
        
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-sm font-medium text-primary">
              <Zap className="w-4 h-4" />
              Nu met AI-gedreven FAQ Generator
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-[1.08] tracking-tight">
              Word gevonden door{' '}
              <span className="gradient-text">zoekmachines</span>
              <br />én door AI
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Analyseer je volledige websitestructuur en krijg actionable inzichten om de bron te zijn in Google én in ChatGPT, Perplexity en AI Overviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="gradient-primary text-primary-foreground text-base px-8 py-6 shadow-glow hover:shadow-[0_0_50px_hsl(14_90%_52%_/_0.25)] transition-shadow"
              >
                Gratis starten
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-base px-8 py-6"
              >
                Bekijk features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 gradient-dark text-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold font-display mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Screenshot Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="relative rounded-2xl overflow-hidden shadow-card border border-border bg-card">
            <div className="absolute top-0 left-0 right-0 h-11 bg-muted/80 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <div className="flex-1 mx-4">
                <div className="bg-background rounded-md px-4 py-1 text-xs text-muted-foreground max-w-sm mx-auto text-center">
                  crawlwizard.app/dashboard
                </div>
              </div>
            </div>
            <div className="pt-11 p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="shadow-soft border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-medium">SEO Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold font-display gradient-text">87</div>
                    <p className="text-xs text-muted-foreground mt-1">+12 sinds vorige analyse</p>
                  </CardContent>
                </Card>
                <Card className="shadow-soft border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pagina's</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold font-display">24</div>
                    <p className="text-xs text-muted-foreground mt-1">van 30 totaal</p>
                  </CardContent>
                </Card>
                <Card className="shadow-soft border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Verbeterpunten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold font-display text-primary">8</div>
                    <p className="text-xs text-muted-foreground mt-1">actionable tips</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              Alles wat je nodig hebt om<br />gevonden te worden
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Door zoekmachines. Door AI-tools. Door je doelgroep.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-card transition-all duration-300 border-border/50 hover:border-primary/20 bg-card">
                <CardHeader>
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-base font-display">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Hoe het werkt
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              In 3 stappen naar betere vindbaarheid
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Voer je URL in', desc: 'Plak de URL van je website en wij crawlen automatisch al je pagina\'s.' },
              { step: '02', title: 'Bekijk je analyse', desc: 'Ontvang een compleet SEO-rapport met scores, problemen en kansen.' },
              { step: '03', title: 'Optimaliseer', desc: 'Gebruik onze AI-tools om content te verbeteren en hoger te scoren.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="text-6xl font-bold font-display text-primary/10 mb-3">{item.step}</div>
                <h3 className="text-lg font-bold font-display mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8">
                    <ChevronRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Prijzen
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
              Transparante prijzen
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Begin gratis. Geen creditcard, geen verborgen kosten.
            </p>
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Maandelijks
              </span>
              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isYearly ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Jaarlijks
              </span>
              {isYearly && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Bespaar tot 17%
                </span>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative flex flex-col transition-all duration-300 ${plan.popular ? 'border-primary shadow-glow scale-[1.02]' : 'border-border/50 hover:border-primary/20 hover:shadow-card'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="gradient-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
                      Meest gekozen
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4 pt-8">
                  <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold font-display">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                    <span className="text-muted-foreground text-sm ml-1">{plan.name === 'Free' ? plan.period : '/maand'}</span>
                    {isYearly && plan.name !== 'Free' && (
                      <p className="text-[11px] text-muted-foreground mt-1">Jaarlijks gefactureerd</p>
                    )}
                    {!isYearly && plan.name !== 'Free' && plan.monthlyPrice !== plan.yearlyPrice && (
                      <p className="text-[11px] text-primary mt-1">Bespaar met jaarlijks abonnement</p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-flex cursor-help mt-3">
                          <span className="text-xs bg-muted px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            ⚡ {plan.credits}
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-left">
                        <p className="font-semibold mb-1">Credit-verbruik per actie:</p>
                        <ul className="text-xs space-y-0.5">
                          <li>• FAQ Analyse: 1 credit</li>
                          <li>• FAQ Regeneratie: 1 credit</li>
                          <li>• FAQ Generatie: 2 credits</li>
                          <li>• Artikel Generator: 3 credits</li>
                          <li>• AI Ranking Check: 4 credits/vraag</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.variant}
                    className={`w-full mt-8 ${plan.popular ? 'gradient-primary text-primary-foreground shadow-glow' : ''}`}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How AI Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Achtergrond
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-display">
              Hoe werkt een AI-tool eigenlijk?
            </h2>
          </div>
          <div className="space-y-6 text-muted-foreground text-base leading-relaxed">
            <p>
              Als jij een vraag stelt aan ChatGPT of Google AI, krijg je geen lijst met links – je krijgt gewoon een antwoord. Maar dat antwoord komt ergens vandaan: AI-tools zijn getraind op een enorme mix van bronnen – Wikipedia, nieuwssites, wetenschappelijke artikelen, forums én gewone websites zoals die van jou. De vraag is dus niet óf jouw website gelezen wordt – maar of een AI hem goed genoeg begrijpt om hem als betrouwbare bron te gebruiken.
            </p>
            <p>
              De meeste AI-tools leerden het internet kennen tot een bepaalde datum – ze crawlen niet continu real-time. Maar dat betekent niet dat jouw website er niet toe doet. Tools zoals Google AI Overviews en Perplexity crawlen wél actief en actueel. En grote AI-modellen worden regelmatig opnieuw getraind op nieuwe data. Je structuur vandaag bepaalt dus of jij morgen als bron wordt meegenomen.
            </p>
            <p>
              CrawlWizard laat je zien wat zo'n bot ziet als hij jouw website bezoekt. Kloppen je koppen? Begrijpt een machine je content? Heb je de juiste structured data? Wij maken het inzichtelijk – zodat jij niet alleen beter scoort in Google, maar ook vaker opduikt als bron in AI-antwoorden.
            </p>
            <blockquote className="font-semibold text-foreground italic border-l-4 border-primary pl-6 py-2 font-display text-lg">
              Goede structuur is de taal die zoekmachines én AI spreken. CrawlWizard helpt jou dit inzichtelijker te maken.
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="container mx-auto max-w-3xl text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">
            Wordt jouw website de bron die geciteerd wordt?
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            Analyseer jouw website gratis en ontdek wat er beter kan voor Google én AI-tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gradient-primary text-primary-foreground text-base px-8 py-6 shadow-glow hover:shadow-[0_0_50px_hsl(14_90%_52%_/_0.3)] transition-shadow"
            >
              Analyseer mijn website gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-base px-8 py-6 border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Bekijk de prijzen
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold font-display text-sm">CrawlWizard</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Prijzen</a>
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
                Privacybeleid
              </button>
              <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">
                Inloggen
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 CrawlWizard
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
