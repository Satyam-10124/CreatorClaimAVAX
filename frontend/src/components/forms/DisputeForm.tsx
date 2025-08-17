import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPostProtected } from "@/lib/api";
import TxLink, { extractTxHash } from "@/components/TxLink";
import { useToast } from "@/hooks/use-toast";

export default function DisputeForm() {
  const { toast } = useToast();
  const [defendant, setDefendant] = useState("");
  const [contentIds, setContentIds] = useState("1");
  const [violationDetails, setViolationDetails] = useState("Test dispute via UI");
  const [evidenceURI, setEvidenceURI] = useState("ipfs://QmEvidence");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPostProtected("/disputes", {
        defendant: defendant.trim(),
        contentIds: contentIds.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)),
        violationDetails: violationDetails.trim(),
        evidenceURI: evidenceURI.trim(),
      });
      setResult(res);
      toast({ title: "Dispute filed", description: "Your dispute has been submitted for review." });
    } catch (err: any) {
      setError(err.message || String(err));
      toast({ title: "Failed to file dispute", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const txHash = extractTxHash(result);

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Report a violation</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="def">Defendant address</Label>
          <Input id="def" placeholder="0x..." value={defendant} onChange={(e) => setDefendant(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cids">Content IDs (comma separated)</Label>
          <Input id="cids" value={contentIds} onChange={(e) => setContentIds(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="details">What happened?</Label>
          <Input id="details" placeholder="Describe the violation" value={violationDetails} onChange={(e) => setViolationDetails(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="evidence">Evidence link</Label>
          <Input id="evidence" placeholder="ipfs://... or https://..." value={evidenceURI} onChange={(e) => setEvidenceURI(e.target.value)} />
        </div>
        <Button type="submit" variant="hero" disabled={loading}>
          {loading ? "Submitting..." : "Submit Dispute"}
        </Button>
      </form>
      {result && (
        <div className="rounded-md border border-card-border p-3 bg-card/50">
          <div className="font-medium mb-1">Dispute filed</div>
          <div className="text-sm">Dispute ID: <span className="font-mono">{result.disputeId ?? "(unknown)"}</span></div>
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
