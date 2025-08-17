import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import heroImage from "@/assets/hero-avalanche.jpg";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-gradient opacity-10"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{ animationDelay: "-3s" }}></div>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Powered by Avalanche</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Own Your
                <span className="gradient-text block">Creative Future</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl">
                CreatorClaim gives creators sovereignty over their intellectual property in AI training, 
                enabling transparent and fair licensing mechanisms on the blockchain.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="hero" size="lg" className="group">
                <Link to="/creator" aria-label="Go to Creator dashboard">
                  Start Creating
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/marketplace" aria-label="Explore Marketplace">
                  Explore Marketplace
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="space-y-2">
                <div className="text-2xl font-bold gradient-text">10K+</div>
                <div className="text-sm text-muted-foreground">Creators Protected</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold gradient-text">$2M+</div>
                <div className="text-sm text-muted-foreground">Royalties Paid</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold gradient-text">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative glass p-8 rounded-2xl">
              <img 
                src={heroImage} 
                alt="AI and creativity fusion" 
                className="w-full h-auto rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-hero rounded-2xl"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 glass p-4 rounded-xl float">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 glass p-4 rounded-xl float" style={{ animationDelay: "-2s" }}>
              <Globe className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;