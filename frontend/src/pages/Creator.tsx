import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CreatorDashboard from "@/components/CreatorDashboard";
import { useEffect } from "react";
import RegisterContentForm from "@/components/forms/RegisterContentForm";
import CreateTermsForm from "@/components/forms/CreateTermsForm";
import MakePaymentForm from "@/components/forms/MakePaymentForm";
import EarningsViewer from "@/components/forms/EarningsViewer";
import TermsViewer from "@/components/forms/TermsViewer";
import ArbiterChecker from "@/components/forms/ArbiterChecker";
import StatusBanner from "@/components/StatusBanner";
import QuickStart from "@/components/QuickStart";
import ActionCards from "@/components/ActionCards";
import WhyOnChain from "@/components/WhyOnChain";

const Creator = () => {
  useEffect(() => {
    document.title = "Creator Dashboard | CreatorClaim on Avalanche";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Register content, set licensing terms, and track earnings on Avalanche.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-28 pb-16 space-y-10">
        <StatusBanner />
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 animate-fade-in">
            <CreatorDashboard embedded />
            <ActionCards />
          </div>
          <aside className="space-y-8">
            <QuickStart />
            <WhyOnChain />
            <div id="register-content">
              <RegisterContentForm />
            </div>
            <div id="create-terms">
              <CreateTermsForm />
            </div>
            <div id="view-terms">
              <TermsViewer />
            </div>
            <div id="make-payment">
              <MakePaymentForm />
            </div>
            <div id="earnings">
              <EarningsViewer />
            </div>
            <ArbiterChecker />
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Creator;
