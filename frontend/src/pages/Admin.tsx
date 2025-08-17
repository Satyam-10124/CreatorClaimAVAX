import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contents, platformStats } from "@/data/mock";
import { BarChart3, FileText, Users, Scale } from "lucide-react";
import { useEffect } from "react";

const Admin = () => {
  useEffect(() => {
    document.title = "Admin | CreatorClaim on Avalanche";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Monitor platform stats and disputes on Avalanche.");
  }, []);

  const cards = [
    { title: "Total Contents", value: platformStats.totalContents, Icon: FileText },
    { title: "Total Disputes", value: platformStats.totalDisputes, Icon: Scale },
    { title: "Platform Fees (USD)", value: `$${platformStats.platformFeesUsd}`, Icon: BarChart3 },
    { title: "Active Creators", value: new Set(contents.map(c => c.creator)).size, Icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-28 pb-16 space-y-10">
        <h1 className="text-3xl font-bold"><span className="gradient-text">Admin Dashboard</span></h1>
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(({ title, value, Icon }) => (
            <Card key={title} className="glass-hover">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{title}</span>
                  <Icon className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value as any}</div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
