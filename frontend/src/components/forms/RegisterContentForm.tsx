import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPostProtected } from "@/lib/api";
import TxLink, { extractTxHash } from "@/components/TxLink";
import { useToast } from "@/hooks/use-toast";

export default function RegisterContentForm() {
  const { toast } = useToast();
  const [fingerprint, setFingerprint] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fp = fingerprint.trim();
  const uri = metadataURI.trim();
  const isValidURI = (s: string) => /^ipfs:\/\//.test(s) || /^https?:\/\//.test(s);
  const canSubmit = fp.length > 0 && isValidURI(uri);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (!fp) {
        throw new Error("Unique ID is required");
      }
      if (!uri) {
        throw new Error("Metadata link is required");
      }
      if (!isValidURI(uri)) {
        throw new Error("Metadata link must start with ipfs:// or https://");
      }
      const res = await apiPostProtected("/content", {
        fingerprint: fp,
        metadataURI: uri,
      });
      setResult(res);
      toast({ title: "Content registered", description: "Your content is now recorded on-chain." });
    } catch (err: any) {
      setError(err.message || String(err));
      toast({ title: "Failed to register", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const txHash = extractTxHash(result);

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Register your content</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="fingerprint">Unique ID</Label>
          <Input id="fingerprint" placeholder="e.g. my-artwork-001" value={fingerprint} onChange={(e) => setFingerprint(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="metadata">Metadata link</Label>
          <Input id="metadata" placeholder="ipfs://... or https://..." value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} required />
          {!isValidURI(uri) && uri.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">Use ipfs://... or https://...</div>
          )}
        </div>
        <Button type="submit" variant="hero" disabled={loading || !canSubmit}>
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>
      {result && (
        <div className="rounded-md border border-card-border p-3 bg-card/50">
          <div className="font-medium mb-1">Success</div>
          <div className="text-sm">Content registered. ID: <span className="font-mono">{result.contentId ?? "(unknown)"}</span></div>
          {txHash && (
            <div className="text-sm mt-1">
              <TxLink hash={txHash} />
            </div>
          )}
          <div className="mt-3">
            <a href="#create-terms">
              <Button size="sm" variant="secondary">Set license terms now →</Button>
            </a>
          </div>
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
