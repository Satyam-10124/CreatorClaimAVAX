import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Settings2, FileSearch, CreditCard, Wallet, Gavel, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  { href: "#register-content", title: "Register content", desc: "Create an on-chain record.", icon: Upload },
  { href: "#create-terms", title: "Set license terms", desc: "FREE or PAID, your rules.", icon: Settings2 },
  { href: "#view-terms", title: "View terms", desc: "Check existing terms.", icon: FileSearch },
  { href: "#make-payment", title: "Pay for license", desc: "Send a usage payment.", icon: CreditCard },
  { href: "#earnings", title: "Check earnings", desc: "See your balance.", icon: Wallet },
  { href: "/disputes", title: "Report a violation", desc: "File a dispute.", icon: Gavel },
  { href: "/ai", title: "For AI companies", desc: "View terms and buy license.", icon: Building2 },
];

export default function ActionCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {actions.map((a) => {
        const isRoute = a.href.startsWith("/");
        const content = (
          <Card className="glass p-5 hover:border-primary/40 transition-all h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <a.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{a.title}</div>
                <div className="text-sm text-muted-foreground truncate">{a.desc}</div>
              </div>
              <Button size="sm" variant="ghost" className="shrink-0">Go</Button>
            </div>
          </Card>
        );
        return (
          <div key={a.title} className="h-full">
            {isRoute ? (
              <Link to={a.href} className="block h-full" aria-label={a.title}>
                {content}
              </Link>
            ) : (
              <a href={a.href} className="block h-full" aria-label={a.title}>
                {content}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
