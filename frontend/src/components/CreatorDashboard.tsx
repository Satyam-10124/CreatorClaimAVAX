import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, DollarSign, Eye, FileText, Shield } from "lucide-react";
import { PropsWithChildren, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

type Props = {
  embedded?: boolean;
};

const CreatorDashboard = ({ embedded = false }: PropsWithChildren<Props>) => {
  const mockContent = [
    { id: 1, title: "Digital Artwork #001", status: "Licensed", earnings: "$150.00", views: 234 },
    { id: 2, title: "Music Track - Synthwave", status: "Pending", earnings: "$0.00", views: 45 },
    { id: 3, title: "3D Model - Spaceship", status: "Protected", earnings: "$89.50", views: 156 }
  ];

  const { account } = useWallet();
  const [contentCount, setContentCount] = useState<string | null>(null);
  const [creatorBalance, setCreatorBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const countRes = await apiGet<{ success: boolean; count: string }>("/content/stats/count");
        if (!cancelled && countRes?.success) setContentCount(countRes.count);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!account) {
      setCreatorBalance(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await apiGet<{ success: boolean; balance: string }>(`/earnings/${account}`);
        if (!cancelled && res?.success) setCreatorBalance(res.balance);
      } catch {
        if (!cancelled) setCreatorBalance(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account]);

  const stats = [
    { label: "Total Earnings (wei)", value: creatorBalance ?? (account ? (loading ? "Loading..." : "0") : "Connect wallet"), icon: DollarSign, color: "success" },
    { label: "Content Items", value: contentCount ?? "-", icon: FileText, color: "primary" },
    { label: "Total Views", value: "1,247", icon: Eye, color: "warning" },
    { label: "Active Licenses", value: "8", icon: Shield, color: "accent" }
  ];

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <section id="dashboard" className={embedded ? "py-10" : "py-20"}>
      {embedded ? (
        <div className="space-y-8">{children}</div>
      ) : (
        <div className="container mx-auto px-6">
          <div className="space-y-8">{children}</div>
        </div>
      )}
    </section>
  );

  return (
    <Wrapper>
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-3xl font-bold">Creator Dashboard</h2>
              <p className="text-muted-foreground">Manage your content and track earnings</p>
            </div>
            <a href="#register-content">
              <Button variant="hero" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Content</span>
              </Button>
            </a>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={stat.label} className="glass p-6 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Content Management */}
          <Card className="glass">
            <div className="p-6 border-b border-card-border">
              <h3 className="text-xl font-semibold">Your Content</h3>
              <p className="text-muted-foreground">Track licensing status and earnings</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {mockContent.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-card/30 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'Licensed' ? 'bg-success/20 text-success' :
                            item.status === 'Pending' ? 'bg-warning/20 text-warning' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {item.status}
                          </span>
                          <span className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{item.views} views</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{item.earnings}</p>
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-card-border">
                <Button variant="outline" className="w-full">
                  View All Content
                </Button>
              </div>
            </div>
          </Card>
    </Wrapper>
  );
};

export default CreatorDashboard;