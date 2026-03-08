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
  Shield, 
  Check, 
  ArrowRight, 
  Globe, 
  FileText, 
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: 'Heading Analyse',
      description: 'Ontdek in één oogopslag of je heading-structuur klopt – de basis van elke goed geïndexeerde pagina.'
    },
    {
      icon: FileText,
      title: 'Meta & Structured Data',
      description: 'Structured data is de sleutel tot rich snippets én tot hoe AI-tools jouw content begrijpen. Wij maken het inzichtelijk.'
    },
    {
      icon: BarChart3,
      title: 'SEO Score',
      description: 'Geen vaag rapportcijfer, maar een concrete score met exacte verbeterpunten. Weet precies wat je morgen moet aanpakken.'
    },
    {
      icon: Globe,
      title: 'Website Analyse',
      description: 'Scan je hele website in één keer. Tot 500 pagina\'s geanalyseerd, geen enkel probleem over het hoofd gezien.'
    },
    {
      icon: Zap,
      title: 'AI FAQ Generator',
      description: 'FAQ\'s zijn goud voor rich snippets én voor AI-antwoorden. Genereer direct relevante vragen die jouw doelgroep stelt.'
    },
    {
      icon: TrendingUp,
      title: 'Keyword Analyse',
      description: 'Schrijf je té veel of te weinig over je kernonderwerp? Wij laten het zien – per pagina, per keyword.'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '€0',
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
      price: '€14,95',
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
      price: '€35',
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

  const testimonials = [
    {
      name: 'Sarah de Vries',
      role: 'SEO Specialist',
      company: 'Digital Agency',
      content: 'Eindelijk een tool die snel en accuraat de SEO-structuur van onze klantwebsites analyseert. De AI FAQ generator is een game-changer!',
      rating: 5
    },
    {
      name: 'Mark Janssen',
      role: 'Marketing Manager',
      company: 'E-commerce NL',
      content: 'De heading-analyse bespaart ons uren werk. We zien direct waar verbeteringen nodig zijn voor betere rankings.',
      rating: 5
    },
    {
      name: 'Lisa van den Berg',
      role: 'Content Strateeg',
      company: 'Content Studio',
      content: 'De keyword-dichtheid analyse helpt ons om content te optimaliseren zonder te over-optimaliseren. Aanrader!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CrawlWizard</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Inloggen
            </Button>
            <Button onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground">
              Gratis starten
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            <Zap className="w-4 h-4 mr-2 inline" />
            Nu met AI-gedreven FAQ Generator
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Word gevonden door{' '}
            <span className="gradient-text">zoekmachines</span>
            {' '}én AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Websites worden steeds vaker geciteerd door AI-tools in plaats van bezocht via een klik. Analyseer je volledige websitestructuur – van heading-hiërarchie tot structured data – en krijg actionable inzichten om die bron te zijn in Google én in ChatGPT, Perplexity en AI Overviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gradient-primary text-primary-foreground text-lg px-8 py-6 shadow-glow"
            >
              Gratis starten
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6"
            >
              Bekijk features
            </Button>
          </div>
          
          {/* Trust badges - hidden until we have active users and reviews
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <span className="text-sm">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-sm">500+ gebruikers</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              <span className="text-sm">4.9/5 beoordeling</span>
            </div>
          </div>
          */}
        </div>
      </section>

      {/* Demo Screenshot Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
            <div className="absolute top-0 left-0 right-0 h-12 bg-muted flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4">
                <div className="bg-background rounded-md px-4 py-1 text-sm text-muted-foreground max-w-md mx-auto text-center">
                  crawlwizard.app/dashboard
                </div>
              </div>
            </div>
            <div className="pt-12 p-8 bg-gradient-to-b from-card to-muted/20">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">SEO Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold gradient-text">87/100</div>
                    <p className="text-sm text-muted-foreground mt-1">+12 sinds vorige analyse</p>
                  </CardContent>
                </Card>
                <Card className="shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Pagina's geanalyseerd</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">24</div>
                    <p className="text-sm text-muted-foreground mt-1">van 30 totaal</p>
                  </CardContent>
                </Card>
                <Card className="shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Verbeterpunten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-accent">8</div>
                    <p className="text-sm text-muted-foreground mt-1">actionable tips</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles wat je nodig hebt om gevonden te worden
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Door zoekmachines. Door AI-tools. Door je doelgroep.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Prijzen</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transparante prijzen, direct resultaat
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Begin vandaag gratis. Geen creditcard, geen verborgen kosten – wel direct inzicht.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-glow scale-105' : 'border-border/50'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-primary-foreground px-4 py-1">
                      Meest gekozen
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mt-2 font-medium">{plan.description}</p>
                  {plan.subtitle && <p className="text-sm text-muted-foreground mt-1">{plan.subtitle}</p>}
                  <Badge variant="secondary" className="mt-3 gap-1">
                    ⚡ {plan.credits}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.variant}
                    className={`w-full mt-8 ${plan.popular ? 'gradient-primary text-primary-foreground' : ''}`}
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

      {/* Testimonials Section - hidden until we have real user reviews
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Wat onze gebruikers zeggen
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role} @ {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* How AI Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">Achtergrond</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Hoe werkt een AI-tool eigenlijk?
            </h2>
          </div>
          <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              Als jij een vraag stelt aan ChatGPT of Google AI, krijg je geen lijst met links – je krijgt gewoon een antwoord. Maar dat antwoord komt ergens vandaan: AI-tools zijn getraind op een enorme mix van bronnen – Wikipedia, nieuwssites, wetenschappelijke artikelen, forums én gewone websites zoals die van jou. De vraag is dus niet óf jouw website gelezen wordt – maar of een AI hem goed genoeg begrijpt om hem als betrouwbare bron te gebruiken.
            </p>
            <p>
              De meeste AI-tools leerden het internet kennen tot een bepaalde datum – ze crawlen niet continu real-time. Maar dat betekent niet dat jouw website er niet toe doet. Tools zoals Google AI Overviews en Perplexity crawlen wél actief en actueel. En grote AI-modellen worden regelmatig opnieuw getraind op nieuwe data. Je structuur vandaag bepaalt dus of jij morgen als bron wordt meegenomen.
            </p>
            <p>
              Dat "lezen" werkt overigens precies zoals bij Google: een geautomatiseerde bot crawlt jouw website en probeert te begrijpen waar jouw pagina over gaat. Is je structuur onduidelijk? Dan begrijpt de AI het niet goed – en word je niet geciteerd als bron.
            </p>
            <p>
              CrawlWizard laat je zien wat zo'n bot ziet als hij jouw website bezoekt. Kloppen je koppen? Begrijpt een machine je content? Heb je de juiste structured data? Wij maken het inzichtelijk – zodat jij niet alleen beter scoort in Google, maar ook vaker opduikt als bron in AI-antwoorden.
            </p>
            <p className="font-semibold text-foreground italic border-l-4 border-primary pl-6">
              Goede structuur is de taal die zoekmachines én AI spreken. CrawlWizard helpt jou dit inzichtelijker te maken én de juiste actie te ondernemen.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Wordt jouw website de bron die geciteerd wordt?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Duizenden pagina's worden dagelijks overgeslagen door Google en AI-tools – omdat de structuur niet klopt. Analyseer jouw website gratis en ontdek wat er beter kan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gradient-primary text-primary-foreground text-lg px-8 py-6 shadow-glow"
            >
              Analyseer mijn website gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6"
            >
              Bekijk de prijzen
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Search className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">CrawlWizard</span>
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
            <p className="text-sm text-muted-foreground">
              © 2025 CrawlWizard. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
