import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

export default function ArbiterChecker() {
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
      const res = await apiGet(`/arbiters/${addr}`);
      setResult(res);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Check Arbiter Status</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="addr">Address</Label>
          <Input id="addr" placeholder="0x..." value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? "Checking..." : "Check"}
        </Button>
      </form>
      {result && (
        <div className="text-sm">
          <div className="font-medium">Result:</div>
          <pre className="text-xs overflow-auto bg-card p-3 rounded-md">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
