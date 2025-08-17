import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import DisputeForm from "@/components/forms/DisputeForm";
import DisputeViewer from "@/components/forms/DisputeViewer";
import StatusBanner from "@/components/StatusBanner";
import QuickStart from "@/components/QuickStart";

const Disputes = () => {
  useEffect(() => {
    document.title = "Disputes | CreatorClaim on Avalanche";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Report violations and track dispute resolution on Avalanche.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-28 pb-16 space-y-10">
        <StatusBanner />
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold">Disputes</h1>
            <p className="text-muted-foreground">Report violations and check dispute status. Keep your evidence links handy.</p>
            <DisputeForm />
          </div>
          <aside className="space-y-8">
            <QuickStart />
            <DisputeViewer />
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Disputes;
