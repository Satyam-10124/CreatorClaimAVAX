import { Shield, DollarSign, Scale, Upload, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import creatorIcon from "@/assets/creator-icon-avalanche.jpg";
import marketplaceIcon from "@/assets/marketplace-icon-avalanche.jpg";
import disputeIcon from "@/assets/dispute-icon-avalanche.jpg";

const Features = () => {
  const features = [
    {
      icon: Upload,
      title: "Content Registration",
      description: "Securely register your creative works with blockchain-verified ownership and metadata.",
      image: creatorIcon,
      color: "primary",
      href: "/creator#register-content",
    },
    {
      icon: DollarSign,
      title: "Smart Licensing",
      description: "Set flexible licensing terms with automated payments and royalty distribution.",
      image: marketplaceIcon,
      color: "success",
      href: "/creator#create-terms",
    },
    {
      icon: Scale,
      title: "Dispute Resolution",
      description: "Transparent dispute handling with community arbitration and evidence tracking.",
      image: disputeIcon,
      color: "warning",
      href: "/disputes",
    }
  ];

  const capabilities = [
    {
      icon: Shield,
      title: "IP Protection",
      description: "Cryptographic fingerprinting ensures your content is protected from unauthorized use."
    },
    {
      icon: Palette,
      title: "Creator Sovereignty",
      description: "You decide how your work is used - free, paid, or completely denied for AI training."
    },
    {
      icon: Zap,
      title: "Instant Payments",
      description: "Automated smart contracts ensure immediate royalty payments when your content is licensed."
    }
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Powerful Features for
            <span className="gradient-text block">Creative Protection</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to protect, license, and monetize your creative works in the age of AI.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass p-8 rounded-2xl hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="relative mb-6">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-gradient-hero rounded-xl"></div>
                <div className="absolute top-4 right-4 glass p-3 rounded-lg">
                  <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                <a href={feature.href}>
                  <Button variant="outline" className="w-full group-hover:border-primary/50">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Capabilities Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => (
            <div 
              key={capability.title}
              className="space-y-4 p-6 rounded-xl hover:bg-card/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <capability.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{capability.title}</h3>
              <p className="text-muted-foreground">{capability.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;