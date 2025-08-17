import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export default function StatusBanner() {
  const { account, isFuji, connect } = useWallet();

  if (!account) {
    return (
      <div className="w-full rounded-lg border border-card-border bg-card/60 p-4 flex items-center justify-between">
        <div>
          <div className="font-medium">Connect your wallet</div>
          <div className="text-sm text-muted-foreground">You’ll use your wallet to register, license, and pay on Avalanche Fuji.</div>
        </div>
        <Button variant="hero" onClick={connect}>Connect</Button>
      </div>
    );
  }

  if (!isFuji) {
    return (
      <div className="w-full rounded-lg border border-yellow-300/40 bg-yellow-500/10 p-4">
        <div className="font-medium">Wrong network</div>
        <div className="text-sm">Please switch to Avalanche Fuji (43113) to continue.</div>
      </div>
    );
  }

  return null;
}
