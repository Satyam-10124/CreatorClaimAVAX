import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketplaceGrid from "@/components/Marketplace";
import { useEffect } from "react";

const Marketplace = () => {
  useEffect(() => {
    document.title = "Marketplace | CreatorClaim on Avalanche";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Discover and license creative works with transparent terms on Avalanche.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28">
        <MarketplaceGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Marketplace;
