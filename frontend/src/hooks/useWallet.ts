import { useCallback, useEffect, useMemo, useState } from "react";

// EIP-1193 provider type (minimal)
type EIP1193Provider = {
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

const AVALANCHE_FUJI = {
  chainId: "0xa869", // 43113 in hex
  chainName: "Avalanche Fuji",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://testnet.snowtrace.io"],
};

function getProvider(): EIP1193Provider | undefined {
  if (typeof window !== "undefined") {
    // Core Wallet and most EVM wallets inject window.ethereum
    return (window as any).core || (window as any).ethereum;
  }
  return undefined;
}

export function useWallet() {
  const provider = useMemo(() => getProvider(), []);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isConnected = !!account;
  const isFuji = chainId?.toLowerCase() === AVALANCHE_FUJI.chainId;

  const connect = useCallback(async () => {
    if (!provider) throw new Error("No EIP-1193 wallet found. Please install Core Wallet or MetaMask.");
    setConnecting(true);
    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0] ?? null);
      const cid: string = await provider.request({ method: "eth_chainId" });
      setChainId(cid);
      // Prompt to switch/add network if not on Fuji
      if (cid.toLowerCase() !== AVALANCHE_FUJI.chainId) {
        try {
          await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: AVALANCHE_FUJI.chainId }] });
          setChainId(AVALANCHE_FUJI.chainId);
        } catch (switchErr: any) {
          // If chain not added in wallet, try adding it
          if (switchErr?.code === 4902 || (typeof switchErr?.message === "string" && switchErr.message.includes("Unrecognized chain ID"))) {
            await provider.request({ method: "wallet_addEthereumChain", params: [AVALANCHE_FUJI] });
            setChainId(AVALANCHE_FUJI.chainId);
          } else {
            throw switchErr;
          }
        }
      }
    } finally {
      setConnecting(false);
    }
  }, [provider]);

  const disconnect = useCallback(() => {
    setAccount(null);
    // Most injected wallets don't support programmatic disconnection.
  }, []);

  // Subscriptions
  useEffect(() => {
    if (!provider || !provider.on) return;

    const handleAccountsChanged = (accs: string[]) => setAccount(accs[0] ?? null);
    const handleChainChanged = (cid: string) => setChainId(cid);

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    // Initialize state if already connected
    (async () => {
      try {
        const accs: string[] = await provider.request({ method: "eth_accounts" });
        if (accs && accs.length > 0) setAccount(accs[0]);
        const cid: string = await provider.request({ method: "eth_chainId" });
        setChainId(cid);
      } catch {}
    })();

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [provider]);

  const shortAddress = useMemo(() => (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""), [account]);

  return { provider, account, shortAddress, chainId, isConnected, isFuji, connecting, connect, disconnect } as const;
}
