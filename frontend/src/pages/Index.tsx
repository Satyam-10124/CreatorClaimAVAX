import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CreatorDashboard from "@/components/CreatorDashboard";
import Marketplace from "@/components/Marketplace";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "CreatorClaim Protocol | Avalanche-powered licensing";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Protect IP, set licensing terms, and discover content on Avalanche.");
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <CreatorDashboard />
        <Marketplace />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
