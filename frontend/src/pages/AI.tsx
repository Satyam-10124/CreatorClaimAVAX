import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TxLink, { extractTxHash } from "@/components/TxLink";
import { apiPostProtected, apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AI() {
  const { toast } = useToast();
  const [contentId, setContentId] = useState("");
  const [amount, setAmount] = useState("10000000000000000");
  const [note, setNote] = useState("AI training license");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchTerms() {
    try {
      setTerms(null);
      const res = await apiGet(`/terms/by-content/${Number(contentId)}`);
      setTerms(res);
    } catch (err: any) {
      toast({ title: "Failed to fetch terms", description: err.message || String(err), variant: "destructive" });
    }
  }

  async function onBuy(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const ids = [Number(contentId)];
      if (ids.some((n) => Number.isNaN(n))) throw new Error("Enter a valid numeric Content ID");
      const res = await apiPostProtected("/payments", {
        contentIds: ids,
        amounts: [amount.trim()],
        notes: [note.trim()],
      });
      setResult(res);
      toast({ title: "License purchased", description: "Payment submitted successfully." });
    } catch (err: any) {
      setError(err.message || String(err));
      toast({ title: "Purchase failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const txHash = extractTxHash(result);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-28 pb-16 space-y-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">For AI Companies</h1>
            <p className="text-muted-foreground">Discover content terms and purchase a training license with on-chain receipt.</p>
          </div>

          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Buy a license</h3>
            <form onSubmit={onBuy} className="space-y-3">
              <div>
                <Label htmlFor="cid">Content ID</Label>
                <Input id="cid" placeholder="e.g. 1" value={contentId} onChange={(e) => setContentId(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="amt">Amount (wei)</Label>
                <Input id="amt" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !contentId.trim()}>{loading ? "Purchasing..." : "Purchase license"}</Button>
                <Button type="button" variant="secondary" onClick={fetchTerms} disabled={!contentId.trim()}>View terms</Button>
              </div>
            </form>
            {terms && (
              <div className="text-sm mt-3">
                <div className="font-medium">Terms</div>
                <pre className="text-xs overflow-auto bg-card p-3 rounded-md">{JSON.stringify(terms, null, 2)}</pre>
              </div>
            )}
            {result && (
              <div className="rounded-md border border-card-border p-3 bg-card/50 mt-3">
                <div className="font-medium mb-1">Success</div>
                {txHash && (
                  <div className="text-sm mt-1"><TxLink hash={txHash} /></div>
                )}
              </div>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
