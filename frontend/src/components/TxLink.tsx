import React from "react";

export function extractTxHash(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;
  const candidates = [
    obj.txHash,
    obj.transactionHash,
    obj.hash,
    obj.tx,
    obj?.receipt?.transactionHash,
    obj?.result?.txHash,
  ].filter(Boolean);
  return (candidates[0] as string) || null;
}

export default function TxLink({ hash, network = "fuji" }: { hash: string; network?: "fuji" | "mainnet" }) {
  const base = network === "fuji" ? "https://testnet.snowtrace.io/tx/" : "https://snowtrace.io/tx/";
  return (
    <a
      href={`${base}${hash}`}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline hover:opacity-80"
    >
      View on Snowtrace ↗
    </a>
  );
}
