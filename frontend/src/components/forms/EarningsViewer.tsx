import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

export default function EarningsViewer() {
  const { toast } = useToast();
  const { account } = useWallet();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account && !address) setAddress(account);
  }, [account]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const addr = address.trim();
      if (!addr) throw new Error("Please enter an address");
      try {
        const res = await apiGet(`/earnings/${addr}`);
        setResult(res);
        toast({ title: "Earnings fetched", description: "Latest on-chain balance retrieved." });
      } catch (err: any) {
        setError(err.message || String(err));
        toast({ title: "Failed to fetch earnings", description: err.message || String(err), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  function formatAvax(wei: string | number): string {
    try {
      const n = BigInt(wei as any);
      const negative = n < 0n;
      const abs = negative ? -n : n;
      const whole = abs / 1000000000000000000n; // 1e18
      const frac = abs % 1000000000000000000n;
      // Keep up to 6 decimal places, trimming trailing zeros
      const fracStr = (frac.toString().padStart(18, '0').slice(0, 6)).replace(/0+$/, "");
      const base = fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
      return negative ? `-${base}` : base;
    } catch {
      return "-";
    }
  }

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Check your earnings</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="addr">Address</Label>
          <Input id="addr" placeholder="0x... (defaults to your wallet)" value={address} onChange={(e) => setAddress(e.target.value)} aria-describedby="addr-help" />
          <p id="addr-help" className="mt-1 text-xs text-muted-foreground">If connected, your wallet address is used by default.</p>
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? "Loading..." : "Get earnings"}
        </Button>
      </form>
      <div aria-live="polite" className="space-y-2">
        {result && (
          <div className="rounded-md border border-card-border p-3 bg-card/50 space-y-1">
            <div className="font-medium">Earnings</div>
            {result.creator && (
              <div className="text-xs text-muted-foreground">Address: <span className="font-mono break-all">{result.creator}</span></div>
            )}
            <div className="text-sm">Wei: <span className="font-mono">{result.balance ?? "0"}</span></div>
            {result.balance && (
              <div className="text-sm">≈ AVAX: <span className="font-mono">{formatAvax(result.balance)}</span></div>
            )}
          </div>
        )}
        {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
      </div>
    </div>
  );
}
