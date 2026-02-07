import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      description: 'Analyseer de complete heading-structuur (H1-H6) van elke pagina voor optimale SEO.'
    },
    {
      icon: FileText,
      title: 'Meta & Structured Data',
      description: 'Bekijk meta-informatie en structured data voor betere zoekmachine-zichtbaarheid.'
    },
    {
      icon: BarChart3,
      title: 'SEO Score',
      description: 'Krijg een duidelijke SEO-score met actionable verbeterpunten per pagina.'
    },
    {
      icon: Globe,
      title: 'Website Analyse',
      description: 'Analyseer complete websites via sitemap met tot 500 pagina\'s per scan.'
    },
    {
      icon: Zap,
      title: 'AI FAQ Generator',
      description: 'Genereer relevante FAQ\'s met AI voor betere rich snippets in zoekresultaten.'
    },
    {
      icon: TrendingUp,
      title: 'Keyword Analyse',
      description: 'Ontdek keyword-dichtheid en optimaliseer je content voor betere rankings.'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '€0',
      period: 'voor altijd',
      description: 'Perfect om te starten',
      features: [
        'Analyseer 1 pagina per keer',
        'Maximaal 10 analyses',
        'Basis SEO-score',
        'Heading-structuur analyse',
        'Meta-informatie overzicht'
      ],
      cta: 'Gratis starten',
      popular: false,
      variant: 'outline' as const
    },
    {
      name: 'Scale',
      price: '€14,95',
      period: 'per maand',
      description: 'Voor groeiende websites',
      features: [
        'Analyseer volledige websites',
        'Tot 100 pagina\'s per website',
        '1 project opslaan',
        'AI FAQ Generator',
        'Keyword analyse',
        'Structured data analyse',
        'Projecten bewaren'
      ],
      cta: 'Start met Scale',
      popular: true,
      variant: 'default' as const
    },
    {
      name: 'Enterprise',
      price: '€35',
      period: 'per maand',
      description: 'Voor grote websites',
      features: [
        'Alles in Scale',
        'Tot 500 pagina\'s per website',
        '3 projecten opslaan',
        'Prioriteit support',
        'Geavanceerde rapportages',
        'Export functionaliteit'
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
            <span className="text-xl font-bold">SEO Analyzer</span>
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
            Verbeter je{' '}
            <span className="gradient-text">SEO-rankings</span>
            {' '}met diepgaande analyse
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Analyseer de complete SEO-structuur van je website. Van heading-hiërarchie tot structured data – 
            krijg actionable inzichten voor betere zoekmachine-posities.
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
          
          {/* Trust badges */}
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
                  seo-analyzer.app/dashboard
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
              Alles wat je nodig hebt voor SEO-succes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Van technische analyse tot AI-gedreven content suggesties – onze tool geeft je de inzichten die je nodig hebt.
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
              Kies het plan dat bij je past
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start gratis en upgrade wanneer je groeit. Geen verborgen kosten.
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
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
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

      {/* Testimonials Section */}
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Klaar om je SEO te verbeteren?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start vandaag nog gratis en ontdek hoe je website beter kan scoren in zoekmachines.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="gradient-primary text-primary-foreground text-lg px-8 py-6 shadow-glow"
          >
            Gratis account aanmaken
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
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
              <span className="font-semibold">SEO Analyzer</span>
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
              © 2025 SEO Analyzer. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
