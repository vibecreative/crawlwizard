import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import heroBg from '@/assets/hero-bg.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { 
  Search, 
  Zap, 
  Check, 
  ArrowRight, 
  Globe, 
  FileText, 
  Info,
  ChevronRight,
  Target,
  Layers,
  Bot,
  Gauge,
  Menu,
  X,
  Shield,
  Lock
} from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

const Landing = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: Layers, title: 'Heading Analyse', description: 'Ontdek in één oogopslag of je heading-structuur klopt – de basis van elke goed geïndexeerde pagina.' },
    { icon: FileText, title: 'Meta & Structured Data', description: 'Structured data is de sleutel tot rich snippets én tot hoe AI-tools jouw content begrijpen. Wij maken het inzichtelijk.' },
    { icon: Gauge, title: 'SEO Score', description: 'Geen vaag rapportcijfer, maar een concrete score met exacte verbeterpunten. Weet precies wat je morgen moet aanpakken.' },
    { icon: Globe, title: 'Website Analyse', description: 'Scan je hele website in één keer. Tot 500 pagina\'s geanalyseerd, geen enkel probleem over het hoofd gezien.' },
    { icon: Bot, title: 'AI FAQ Generator', description: 'FAQ\'s zijn goud voor rich snippets én voor AI-antwoorden. Genereer direct relevante vragen die jouw doelgroep stelt.' },
    { icon: Target, title: 'Keyword Analyse', description: 'Schrijf je té veel of te weinig over je kernonderwerp? Wij laten het zien – per pagina, per keyword.' }
  ];

  const plans = [
    {
      name: 'Free', monthlyPrice: '€0', yearlyPrice: '€0', period: 'voor altijd',
      description: 'Gratis verkennen', subtitle: 'Analyseer je eerste pagina\'s en ontdek wat er beter kan.',
      credits: '10 AI-credits/maand',
      features: ['1 pagina per analyse', 'Tot 10 analyses', 'SEO-score per pagina', 'Heading-structuur analyse', 'Meta-informatie overzicht', '10 AI-credits per maand', 'Browser AI (onbeperkt, gratis)'],
      cta: 'Gratis starten', popular: false, variant: 'outline' as const
    },
    {
      name: 'Scale', monthlyPrice: '€17,95', yearlyPrice: '€14,95', period: 'per maand',
      description: 'Voor ambitieuze websites', subtitle: 'Analyseer je hele website en weet precies waar je winst ligt.',
      credits: '50 AI-credits/maand',
      features: ['Volledige website-analyse', 'Tot 100 pagina\'s per scan', '1 project opslaan', 'AI FAQ Generator', 'Keyword analyse', 'Structured data analyse', '50 AI-credits per maand', 'Browser AI (onbeperkt, gratis)'],
      cta: 'Start met Scale', popular: true, variant: 'default' as const
    },
    {
      name: 'Enterprise', monthlyPrice: '€39,95', yearlyPrice: '€35', period: 'per maand',
      description: 'Voor écht serieuze websites & bureau\'s', subtitle: 'Beheer meerdere websites, rapporteer naar klanten, schaal zonder limieten.',
      credits: '200 AI-credits/maand',
      features: ['Alles uit Scale', 'Tot 500 pagina\'s per scan', '3 projecten opslaan', 'AI Ranking Check (4 modellen)', 'AI Artikel Generator', '200 AI-credits per maand', 'Browser AI (onbeperkt, gratis)', 'Prioriteit support'],
      cta: 'Start met Enterprise', popular: false, variant: 'outline' as const
    }
  ];

  const stats = [
    { value: 'tot 500', label: 'Pagina\'s per scan' },
    { value: '6', label: 'SEO-checks per pagina' },
    { value: '4', label: 'AI-modellen' },
    { value: '< 30s', label: 'Gemiddelde scantijd' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "CrawlWizard - Word gevonden door zoekmachines én AI",
          "description": "Analyseer je volledige websitestructuur en krijg actionable inzichten om gevonden te worden in Google én in ChatGPT, Perplexity en AI Overviews.",
          "url": "https://crawlwizard.nl/",
          "isPartOf": { "@id": "https://crawlwizard.nl/#website" }
        }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Search className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">CrawlWizard</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Prijzen</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Hoe het werkt</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Inloggen</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground">Gratis starten</Button>
          </div>
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-2 text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-2 text-muted-foreground hover:text-foreground transition-colors">Prijzen</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-2 text-muted-foreground hover:text-foreground transition-colors">Hoe het werkt</a>
                <div className="border-t border-border/50 pt-3 flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}>Inloggen</Button>
                  <Button size="sm" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }} className="gradient-primary text-primary-foreground">Gratis starten</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        {/* Hero background image */}
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="CrawlWizard SEO analyse dashboard achtergrond" className="w-full h-full object-cover opacity-25 dark:opacity-30" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl z-0" />
        <motion.div 
          className="absolute top-32 right-12 w-20 h-20 border-4 border-primary/20 rounded-lg rotate-12 hidden lg:block"
          animate={{ rotate: [12, 18, 12], y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 left-16 w-12 h-12 bg-primary/15 rounded-full hidden lg:block"
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container mx-auto max-w-5xl relative">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div 
              variants={fadeUp} 
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-sm font-medium text-primary"
            >
              <Zap className="w-4 h-4" />
              Nu met AI-gedreven FAQ Generator
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
            <motion.h1 
              variants={fadeUp} 
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold font-display mb-6 leading-[1.08] tracking-tight"
            >
              Word gevonden door{' '}
              <span className="gradient-text">zoekmachines</span>
              <br />én door AI
            </motion.h1>
            <motion.p 
              variants={fadeUp} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Analyseer je volledige websitestructuur en krijg actionable inzichten om de bron te zijn in Google én in ChatGPT, Perplexity en AI Overviews.
            </motion.p>
            <motion.div 
              variants={fadeUp} 
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 gradient-dark text-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {stats.map((stat, i) => (
              <motion.div key={i} className="text-center" variants={fadeUp} transition={{ duration: 0.5 }}>
                <div className="text-3xl md:text-4xl font-bold font-display mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Screenshot Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            className="relative rounded-2xl overflow-hidden shadow-card border border-border bg-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={scaleIn}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
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
                {[
                  { label: 'SEO Score', value: '87', extra: '+12 sinds vorige analyse', gradient: true },
                  { label: "Pagina's", value: '24', extra: 'van 30 totaal', gradient: false },
                  { label: 'Verbeterpunten', value: '8', extra: 'actionable tips', primary: true },
                ].map((card, i) => (
                  <Card key={i} className="shadow-soft border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{card.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-4xl font-bold font-display ${card.gradient ? 'gradient-text' : card.primary ? 'text-primary' : ''}`}>{card.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{card.extra}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Features
            </motion.div>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-5xl font-bold font-display mb-4">
              Alles wat je nodig hebt om<br />gevonden te worden
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Door zoekmachines. Door AI-tools. Door je doelgroep.
            </motion.p>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeUp} transition={{ duration: 0.5 }}>
                <Card className="group hover:shadow-card transition-all duration-300 border-border/50 hover:border-primary/20 bg-card h-full">
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Hoe het werkt
            </motion.div>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-5xl font-bold font-display mb-4">
              In 3 stappen naar betere vindbaarheid
            </motion.h2>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {[
              { step: '01', title: 'Voer je URL in', desc: 'Plak de URL van je website en wij crawlen automatisch al je pagina\'s.' },
              { step: '02', title: 'Bekijk je analyse', desc: 'Ontvang een compleet SEO-rapport met scores, problemen en kansen.' },
              { step: '03', title: 'Optimaliseer', desc: 'Gebruik onze AI-tools om content te verbeteren en hoger te scoren.' },
            ].map((item, i) => (
              <motion.div key={i} className="relative text-center" variants={fadeUp} transition={{ duration: 0.5 }}>
                <div className="text-6xl font-bold font-display text-primary/10 mb-3">{item.step}</div>
                <h3 className="text-lg font-bold font-display mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8">
                    <ChevronRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Prijzen
            </motion.div>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-5xl font-bold font-display mb-4">
              Transparante prijzen
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Begin gratis. Geen creditcard, geen verborgen kosten.
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8">
              <span className={`text-xs sm:text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Maandelijks</span>
              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${isYearly ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-xs sm:text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Jaarlijks</span>
              {isYearly && (
                <span className="text-[10px] sm:text-xs font-semibold text-primary bg-primary/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">Bespaar tot 17%</span>
              )}
            </motion.div>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {plans.map((plan, index) => (
              <motion.div key={index} variants={fadeUp} transition={{ duration: 0.5 }}>
                <Card className={`relative flex flex-col h-full transition-all duration-300 ${plan.popular ? 'border-primary shadow-glow scale-[1.02]' : 'border-border/50 hover:border-primary/20 hover:shadow-card'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="gradient-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">Meest gekozen</span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4 pt-8">
                    <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold font-display">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                      <span className="text-muted-foreground text-sm ml-1">{plan.name === 'Free' ? plan.period : '/maand'}</span>
                      {isYearly && plan.name !== 'Free' && <p className="text-[11px] text-muted-foreground mt-1">Jaarlijks gefactureerd</p>}
                      {!isYearly && plan.name !== 'Free' && plan.monthlyPrice !== plan.yearlyPrice && <p className="text-[11px] text-primary mt-1">Bespaar met jaarlijks abonnement</p>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex justify-center cursor-help mt-3 w-full">
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
              </motion.div>
            ))}
          </motion.div>
          <p className="text-center text-xs text-muted-foreground mt-6">Alle prijzen zijn exclusief btw.</p>
        </div>
      </section>

      {/* How AI Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div 
            className="text-center mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-semibold uppercase tracking-wider text-primary">
              Achtergrond
            </motion.div>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-5xl font-bold font-display">
              Hoe werkt een AI-tool eigenlijk?
            </motion.h2>
          </motion.div>
          <motion.div 
            className="space-y-6 text-muted-foreground text-base leading-relaxed"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }}>
              Als jij een vraag stelt aan ChatGPT of Google AI, krijg je geen lijst met links – je krijgt gewoon een antwoord. Maar dat antwoord komt ergens vandaan: AI-tools zijn getraind op een enorme mix van bronnen – Wikipedia, nieuwssites, wetenschappelijke artikelen, forums én gewone websites zoals die van jou.
            </motion.p>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }}>
              De meeste AI-tools leerden het internet kennen tot een bepaalde datum – ze crawlen niet continu real-time. Maar dat betekent niet dat jouw website er niet toe doet. Tools zoals Google AI Overviews en Perplexity crawlen wél actief en actueel.
            </motion.p>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }}>
              CrawlWizard laat je zien wat zo'n bot ziet als hij jouw website bezoekt. Kloppen je koppen? Begrijpt een machine je content? Heb je de juiste structured data? Wij maken het inzichtelijk.
            </motion.p>
            <motion.blockquote variants={fadeUp} transition={{ duration: 0.5 }} className="font-semibold text-foreground italic border-l-4 border-primary pl-6 py-2 font-display text-lg">
              Goede structuur is de taal die zoekmachines én AI spreken. CrawlWizard helpt jou dit inzichtelijker te maken.
            </motion.blockquote>
          </motion.div>

          {/* How CrawlWizard uses AI */}
          <motion.div 
            className="mt-16 pt-16 border-t border-border"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.h3 variants={fadeUp} transition={{ duration: 0.5 }} className="text-2xl md:text-3xl font-bold font-display mb-6 text-center">
              Hoe CrawlWizard AI inzet
            </motion.h3>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <Card className="h-full border-border/50">
                  <CardHeader>
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-display">Server AI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Voor zware taken zoals FAQ-generatie, artikelen schrijven en AI Ranking Checks schakelt CrawlWizard krachtige large language models (LLM's) in op onze servers — denk aan modellen van OpenAI en Google Gemini. Je pagina-inhoud wordt als context meegestuurd, waarna het model geoptimaliseerde output genereert. Hiervoor gebruik je AI-credits; het aantal hangt af van je plan.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <Card className="h-full border-border/50">
                  <CardHeader>
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-display">Browser AI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Voor snelle relevantie-analyses draait CrawlWizard een compact embedding-model (<span className="text-foreground font-medium">MiniLM</span>) rechtstreeks in jouw browser via WebGPU. Het model berekent de semantische overeenkomst tussen een FAQ-vraag en je pagina-inhoud met cosine similarity. Geen data verlaat je apparaat, er zijn geen credits nodig en het werkt onbeperkt.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="text-lg">🇪🇺</span>
              <span>Data opgeslagen in de <strong className="text-foreground">EU (Frankfurt, Duitsland)</strong></span>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span><strong className="text-foreground">AVG/GDPR</strong> compliant</span>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 text-primary" />
              <span>Versleutelde verbinding <strong className="text-foreground">(SSL/TLS)</strong></span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <motion.div 
          className="container mx-auto max-w-3xl text-center relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} transition={{ duration: 0.6 }} className="text-3xl md:text-5xl font-bold font-display mb-6">
            Wordt jouw website de bron die geciteerd wordt?
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            Analyseer jouw website gratis en ontdek wat er beter kan voor Google én AI-tools.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row gap-3 justify-center">
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
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-base px-8 py-6 bg-transparent text-white border border-white/30 hover:bg-white/10 hover:border-white/60 rounded-md font-medium"
            >
              Bekijk de prijzen
            </Button>
          </motion.div>
        </motion.div>
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
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacybeleid</button>
              <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">Inloggen</button>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CrawlWizard</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
