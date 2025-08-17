import { Card } from "@/components/ui/card";

export default function WhyOnChain() {
  return (
    <Card className="glass p-4">
      <div className="font-medium mb-2">Why on-chain?</div>
      <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
        <li>Proof of ownership: immutable content fingerprint.</li>
        <li>Clear, machine-readable licenses for AI training and usage.</li>
        <li>Verifiable payments with on-chain receipts.</li>
      </ul>
    </Card>
  );
}
