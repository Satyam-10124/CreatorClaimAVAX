import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiPostProtected } from "@/lib/api";
import TxLink, { extractTxHash } from "@/components/TxLink";
import { useToast } from "@/hooks/use-toast";

export default function CreateTermsForm() {
  const { toast } = useToast();
  const [contentId, setContentId] = useState("");
  const [status, setStatus] = useState<number>(2); // default PAID
  const [price, setPrice] = useState("10000000000000000"); // 0.01 ETH/AVAX in wei
  const [requireAttribution, setRequireAttribution] = useState(true);
  const [usage, setUsage] = useState("0,1,2");
  const [customTermsURI, setCustomTermsURI] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const allowedUsageTypes = usage
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n) => Number(n));
      const res = await apiPostProtected("/terms", {
        contentId: Number(contentId),
        status,
        price: price || "0",
        requireAttribution,
        usageTypes: usage
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((n) => Number(n)),
        customTermsURI: customTermsURI.trim() || undefined,
      });
      setResult(res);
      toast({ title: "Terms created", description: "Your license terms are live." });
    } catch (err: any) {
      setError(err.message || String(err));
      toast({ title: "Failed to create terms", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const txHash = extractTxHash(result);

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Set license terms</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="contentId">Content ID</Label>
          <Input id="contentId" placeholder="e.g. 1" value={contentId} onChange={(e) => setContentId(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="status">Status (0=DENY, 1=FREE, 2=PAID)</Label>
          <Input id="status" type="number" min={0} max={2} value={status} onChange={(e) => setStatus(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="price">Price (wei)</Label>
          <Input id="price" placeholder="e.g. 10000000000000000" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="attrib" checked={requireAttribution} onCheckedChange={(v) => setRequireAttribution(Boolean(v))} />
          <Label htmlFor="attrib">Require attribution</Label>
        </div>
        <div>
          <Label htmlFor="usage">Allowed usage types (comma list of 0,1,2,3)</Label>
          <Input id="usage" placeholder="e.g. 0,1,2" value={usage} onChange={(e) => setUsage(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="custom">Custom terms link (optional)</Label>
          <Input id="custom" placeholder="ipfs://... or https://..." value={customTermsURI} onChange={(e) => setCustomTermsURI(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? "Creating..." : "Create Terms"}
        </Button>
      </form>
      {result && (
        <div className="rounded-md border border-card-border p-3 bg-card/50">
          <div className="font-medium mb-1">Success</div>
          <div className="text-sm">Terms created. ID: <span className="font-mono">{result.termsId ?? "(unknown)"}</span></div>
          {txHash && (
            <div className="text-sm mt-1">
              <TxLink hash={txHash} />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <a href="#make-payment">
              <Button size="sm" variant="secondary">Test a payment →</Button>
            </a>
            <a href="#view-terms">
              <Button size="sm" variant="ghost">View terms</Button>
            </a>
          </div>
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
