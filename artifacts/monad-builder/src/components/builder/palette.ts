import { Wallet, Coins, Image as ImageIcon, List, RefreshCw, LineChart, Vote, Type, AlignLeft, Square, PictureInPicture, Minus, LayoutTemplate, CreditCard, BarChart2 } from "lucide-react";

// Real Monad Mainnet defaults — source: docs.monad.xyz
const MONAD_RPC = "https://rpc.monad.xyz";
const MONAD_CHAIN_ID = 143;
const WMON_ADDRESS = "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A";

export const COMPONENT_PALETTE = {
  Web3: [
    {
      type: "wallet-connect",
      label: "Wallet Connect",
      icon: Wallet,
      props: {
        label: "Connect Wallet",
        chainId: MONAD_CHAIN_ID,
        rpcUrl: MONAD_RPC,
        networkName: "Monad Mainnet",
      },
    },
    {
      type: "token-balance",
      label: "Token Balance",
      icon: Coins,
      props: {
        token: "MON",
        chainId: MONAD_CHAIN_ID,
        contractAddress: WMON_ADDRESS,
      },
    },
    {
      type: "nft-gallery",
      label: "NFT Gallery",
      icon: ImageIcon,
      props: { columns: 3, title: "My Collection" },
    },
    {
      type: "transaction-feed",
      label: "Tx Feed",
      icon: List,
      props: {
        limit: 5,
        title: "Recent Activity",
        explorerUrl: "https://monadvision.com",
      },
    },
    {
      type: "token-swap",
      label: "Token Swap",
      icon: RefreshCw,
      props: {
        fromToken: "USDC",
        toToken: "MON",
        chainId: MONAD_CHAIN_ID,
        rpcUrl: MONAD_RPC,
      },
    },
    {
      type: "price-chart",
      label: "Price Chart",
      icon: LineChart,
      props: {
        asset: "MON",
        interval: "24h",
        chainId: MONAD_CHAIN_ID,
      },
    },
    {
      type: "dao-vote",
      label: "DAO Proposal",
      icon: Vote,
      props: {
        title: "Proposal #1",
        chainId: MONAD_CHAIN_ID,
      },
    },
  ],
  Layout: [
    {
      type: "hero-section",
      label: "Hero Section",
      icon: LayoutTemplate,
      props: { title: "Welcome to Monad", subtitle: "Built on the fastest EVM chain. 10,000 TPS. 400ms blocks." },
    },
    { type: "card", label: "Card Container", icon: CreditCard, props: { title: "Card Title" } },
    { type: "stats-row", label: "Stats Row", icon: BarChart2, props: { items: 3 } },
    { type: "divider", label: "Divider", icon: Minus, props: {} },
  ],
  Content: [
    { type: "heading", label: "Heading", icon: Type, props: { text: "Heading Text", level: "h2" } },
    { type: "paragraph", label: "Paragraph", icon: AlignLeft, props: { text: "Enter your text here..." } },
    { type: "button", label: "Button", icon: Square, props: { label: "Click Me", variant: "default" } },
    { type: "image", label: "Image", icon: PictureInPicture, props: { url: "https://placehold.co/600x400/1D1D2B/836EF9?text=Image", alt: "Image" } },
  ],
} as const;
