import { Shield, Github, Twitter, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const footerLinks = {
    protocol: [
      { label: "Documentation", href: "#" },
      { label: "Smart Contracts", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "GitHub", href: "#" }
    ],
    creators: [
      { label: "Upload Content", href: "/creator" },
      { label: "Set Licensing", href: "/creator" },
      { label: "Track Earnings", href: "/creator" },
      { label: "Creator Guide", href: "/creator" }
    ],
    community: [
      { label: "Discord", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Newsletter", href: "#" }
    ],
    legal: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Dispute Resolution", href: "/disputes" }
    ]
  };

  const socialLinks = [
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: MessageCircle, href: "#", label: "Discord" }
  ];

  return (
    <footer className="border-t border-card-border bg-background-secondary">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary" />
                <div className="absolute inset-0 animate-pulse">
                  <Shield className="h-8 w-8 text-primary-glow opacity-50" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold gradient-text">CreatorClaim</h3>
                <p className="text-xs text-muted-foreground">Protocol</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground max-w-xs">
              Giving creators sovereignty over their intellectual property in AI training through blockchain technology.
            </p>

            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:text-primary"
                  asChild
                >
                  <a href={social.href} aria-label={social.label}>
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-4 grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Protocol</h4>
              <ul className="space-y-2">
                {footerLinks.protocol.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Creators</h4>
              <ul className="space-y-2">
                {footerLinks.creators.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2">
                {footerLinks.community.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-card-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>© 2024 CreatorClaim Protocol. All rights reserved.</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Avalanche Network</span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Built with ❤️ for creators worldwide
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;