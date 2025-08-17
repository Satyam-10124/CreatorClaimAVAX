import { Button } from "@/components/ui/button";
import { Wallet, Shield, MoreVertical, CircleAlert } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useWallet } from "@/hooks/useWallet";

const Header = () => {
  const { account, shortAddress, isConnected, isFuji, connecting, connect } = useWallet();

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-glass-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" aria-label="CreatorClaim Home">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 animate-pulse">
                <Shield className="h-8 w-8 text-primary-glow opacity-50" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">CreatorClaim</h1>
              <p className="text-xs text-muted-foreground">Protocol</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {[
              { to: "/", label: "Home" },
              { to: "/marketplace", label: "Marketplace" },
              { to: "/creator", label: "Creator" },
              { to: "/disputes", label: "Disputes" },
              { to: "/admin", label: "Admin" },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition-colors ${isActive ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 glass px-3 py-2 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${isFuji ? "bg-success" : "bg-amber-500"} animate-pulse`}></div>
                  <span className="text-sm">{shortAddress}</span>
                </div>
                {!isFuji && (
                  <div className="flex items-center space-x-1 text-amber-600 text-xs">
                    <CircleAlert className="w-4 h-4" />
                    <span>Switch to Fuji</span>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/creator">Dashboard</Link>
                </Button>
              </div>
            ) : (
              <Button variant="hero" onClick={connect} disabled={connecting} className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
              </Button>
            )}
            
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 grid gap-2">
                  {[
                    { to: "/", label: "Home" },
                    { to: "/marketplace", label: "Marketplace" },
                    { to: "/creator", label: "Creator" },
                    { to: "/disputes", label: "Disputes" },
                    { to: "/admin", label: "Admin" },
                  ].map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-secondary text-primary font-medium" : "hover:bg-secondary/70"}`
                      }
                      end
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;