import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";

export default function DisputeViewer() {
  const [disputeId, setDisputeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const id = disputeId.trim();
      if (!id) throw new Error("Enter dispute ID");
      const res = await apiGet(`/disputes/${id}`);
      setResult(res);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">View Dispute</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="did">Dispute ID</Label>
          <Input id="did" placeholder="e.g., 1" value={disputeId} onChange={(e) => setDisputeId(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? "Loading..." : "Fetch Dispute"}
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
