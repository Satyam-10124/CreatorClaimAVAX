export type ContentItem = {
  id: string;
  title: string;
  creator: string;
  priceUsd: number;
  attributionRequired: boolean;
  commercialUse: boolean;
  image: string;
  tags: string[];
  views: number;
  likes: number;
};

export type LicensingTerms = {
  id: string;
  contentId: string;
  priceUsd: number;
  attributionRequired: boolean;
  commercialUse: boolean;
};

export type Dispute = {
  id: string;
  defendant: string;
  contentIds: string[];
  evidenceURI: string;
  violationDetails: string;
  status: "pending" | "resolved" | "rejected";
  votes: number;
};

export const contents: ContentItem[] = [
  {
    id: "6",
    title: "Glacial Red Summit",
    creator: "0x4F99...2fBe",
    priceUsd: 50,
    attributionRequired: true,
    commercialUse: true,
    image: "/placeholder.svg",
    tags: ["photography", "nature"],
    views: 1280,
    likes: 320,
  },
  {
    id: "7",
    title: "Neon Avalanche",
    creator: "0x77Aa...91Cd",
    priceUsd: 100,
    attributionRequired: true,
    commercialUse: true,
    image: "/placeholder.svg",
    tags: ["illustration", "ai"],
    views: 980,
    likes: 210,
  },
  {
    id: "8",
    title: "Crimson Flow",
    creator: "0xF3C1...12Ab",
    priceUsd: 25,
    attributionRequired: false,
    commercialUse: false,
    image: "/placeholder.svg",
    tags: ["3d", "animation"],
    views: 1432,
    likes: 412,
  },
];

export const terms: LicensingTerms[] = contents.map((c, i) => ({
  id: String(5 + i),
  contentId: c.id,
  priceUsd: c.priceUsd,
  attributionRequired: c.attributionRequired,
  commercialUse: c.commercialUse,
}));

export const disputes: Dispute[] = [
  {
    id: "2",
    defendant: "0xB46a...d22F",
    contentIds: ["6"],
    evidenceURI: "ipfs://example-evidence",
    violationDetails: "Unauthorized commercial usage without attribution",
    status: "pending",
    votes: 0,
  },
];

export const platformStats = {
  totalContents: contents.length,
  totalDisputes: disputes.length,
  platformFeesUsd: 10,
};
