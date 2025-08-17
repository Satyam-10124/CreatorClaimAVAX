import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPostProtected } from "@/lib/api";
import TxLink, { extractTxHash } from "@/components/TxLink";
import { useToast } from "@/hooks/use-toast";

export default function MakePaymentForm() {
  const { toast } = useToast();
  const [contentIds, setContentIds] = useState("1");
  const [amounts, setAmounts] = useState("10000000000000000");
  const [notes, setNotes] = useState("Test payment from UI");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPostProtected("/payments", {
        contentIds: contentIds.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)),
        amounts: amounts.split(",").map((s) => s.trim()).filter(Boolean),
        notes: notes.split("||").map((s) => s.trim()).filter(Boolean),
      });
      setResult(res);
      toast({ title: "Payment sent", description: "Your license payment has been submitted." });
    } catch (err: any) {
      setError(err.message || String(err));
      toast({ title: "Payment failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const txHash = extractTxHash(result);

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Pay for a license</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="cids">Content IDs (comma separated)</Label>
          <Input id="cids" value={contentIds} onChange={(e) => setContentIds(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="amts">Amounts (wei, comma separated)</Label>
          <Input id="amts" placeholder="e.g. 10000000000000000" value={amounts} onChange={(e) => setAmounts(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="notes">Notes (use || to separate)</Label>
          <Input id="notes" placeholder="e.g. Invoice #123 || Thanks!" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? "Paying..." : "Pay"}
        </Button>
      </form>
      {result && (
        <div className="rounded-md border border-card-border p-3 bg-card/50">
          <div className="font-medium mb-1">Payment sent</div>
          <div className="text-sm">Your payment transaction has been submitted.</div>
          {txHash && (
            <div className="text-sm mt-1">
              <TxLink hash={txHash} />
            </div>
          )}
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
