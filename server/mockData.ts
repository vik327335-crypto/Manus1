/**
 * Mock data generator for CAN SLIM crypto scanner
 * Generates realistic test data for development
 */

export interface MockAsset {
  id: number;
  ticker: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  marketCap: number;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  circulatingSupply: string;
  totalSupply: string;
}

export interface MockScore {
  assetId: number;
  cScore: number;
  cReason: string;
  aScore: number;
  aReason: string;
  nScore: number;
  nReason: string;
  sScore: number;
  sReason: string;
  lScore: number;
  lReason: string;
  iScore: number;
  iReason: string;
  mScore: number;
  mReason: string;
  totalScore: number;
}

export const mockAssets: MockAsset[] = [
  {
    id: 1,
    ticker: "BTC",
    name: "Bitcoin",
    description: "The original cryptocurrency and largest by market cap",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/bitcoin.png",
    category: "Layer1",
    marketCap: 1200000,
    currentPrice: 6250000,
    priceChange24h: 250,
    volume24h: 35000,
    circulatingSupply: "21,000,000",
    totalSupply: "21,000,000",
  },
  {
    id: 2,
    ticker: "ETH",
    name: "Ethereum",
    description: "Smart contract platform and second-largest cryptocurrency",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/ethereum.png",
    category: "Layer1",
    marketCap: 450000,
    currentPrice: 225000,
    priceChange24h: 350,
    volume24h: 18000,
    circulatingSupply: "120,500,000",
    totalSupply: "120,500,000",
  },
  {
    id: 3,
    ticker: "SOL",
    name: "Solana",
    description: "High-speed blockchain platform",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/solana.png",
    category: "Layer1",
    marketCap: 85000,
    currentPrice: 15000,
    priceChange24h: 450,
    volume24h: 4200,
    circulatingSupply: "575,000,000",
    totalSupply: "575,000,000",
  },
  {
    id: 4,
    ticker: "ARB",
    name: "Arbitrum",
    description: "Ethereum Layer 2 scaling solution",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/arbitrum.png",
    category: "Layer2",
    marketCap: 12000,
    currentPrice: 1200,
    priceChange24h: 520,
    volume24h: 1800,
    circulatingSupply: "10,000,000",
    totalSupply: "10,000,000",
  },
  {
    id: 5,
    ticker: "AAVE",
    name: "Aave",
    description: "Decentralized lending protocol",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/aave.png",
    category: "DeFi",
    marketCap: 18000,
    currentPrice: 45000,
    priceChange24h: 380,
    volume24h: 2100,
    circulatingSupply: "400,000",
    totalSupply: "16,000,000",
  },
  {
    id: 6,
    ticker: "AI",
    name: "Artificial Intelligence",
    description: "AI-focused blockchain platform",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/ai.png",
    category: "AI",
    marketCap: 8500,
    currentPrice: 850,
    priceChange24h: 680,
    volume24h: 950,
    circulatingSupply: "10,000,000",
    totalSupply: "100,000,000",
  },
];

export const mockScores: MockScore[] = [
  {
    assetId: 1,
    cScore: 72,
    cReason: "Volume increased 45% over 7 days, steady adoption",
    aScore: 65,
    aReason: "Consistent long-term growth, network expanding",
    nScore: 58,
    nReason: "Institutional adoption continues, some regulatory clarity",
    sScore: 85,
    sReason: "Fixed supply of 21M, deflationary through halving",
    lScore: 88,
    lReason: "Market leader, outperforming altcoins significantly",
    iScore: 92,
    iReason: "Massive institutional holdings, major funds invested",
    mScore: 95,
    mReason: "Bitcoin above 200 EMA, bullish market structure",
    totalScore: 79,
  },
  {
    assetId: 2,
    cScore: 78,
    cReason: "DeFi activity surging, 60% volume increase",
    aScore: 72,
    aReason: "Consistent ecosystem growth, strong developer activity",
    nScore: 85,
    nReason: "Shanghai upgrade success, upcoming Dencun improvements",
    sScore: 68,
    sReason: "Inflation controlled by staking, 15% annual issuance",
    lScore: 82,
    lReason: "Strong relative strength vs BTC, leading altcoin",
    iScore: 88,
    iReason: "Top institutional backing, ETF approvals driving adoption",
    mScore: 92,
    mReason: "Bullish market trend, strong correlation with BTC",
    totalScore: 81,
  },
  {
    assetId: 3,
    cScore: 88,
    cReason: "Exceptional 120% volume spike, TVL up 75%",
    aScore: 82,
    aReason: "Rapid ecosystem expansion, developer growth accelerating",
    nScore: 92,
    nReason: "Firedancer upgrade launching, major exchange listings",
    sScore: 75,
    sReason: "Reasonable supply dynamics, moderate inflation",
    lScore: 95,
    lReason: "Outperforming BTC and ETH significantly, strong momentum",
    iScore: 78,
    iReason: "Growing institutional interest, Tier-1 fund participation",
    mScore: 90,
    mReason: "Bullish market conditions, strong relative performance",
    totalScore: 86,
  },
  {
    assetId: 4,
    cScore: 82,
    cReason: "Transaction volume up 95%, strong user growth",
    aScore: 75,
    aReason: "Consistent TVL growth, ecosystem maturing",
    nScore: 88,
    nReason: "Stylus upgrade rollout, major DeFi partnerships announced",
    sScore: 72,
    sReason: "Governance token with reasonable supply schedule",
    lScore: 85,
    lReason: "Strong relative strength, outperforming Layer 2 peers",
    iScore: 82,
    iReason: "Offchain Labs funding, institutional validators joining",
    mScore: 88,
    mReason: "Bullish L2 sector, market trend favorable",
    totalScore: 82,
  },
  {
    assetId: 5,
    cScore: 76,
    cReason: "Lending volume increased 55%, TVL growing",
    aScore: 70,
    aReason: "Steady protocol revenue growth, stable user base",
    nScore: 72,
    nReason: "Governance improvements, new market integrations",
    sScore: 68,
    sReason: "Moderate supply, governance token dynamics",
    lScore: 78,
    lReason: "Solid relative strength in DeFi category",
    iScore: 75,
    iReason: "Strong institutional backing in DeFi space",
    mScore: 85,
    mReason: "DeFi sector bullish, market trend supporting",
    totalScore: 75,
  },
  {
    assetId: 6,
    cScore: 95,
    cReason: "Explosive 250% volume growth, massive adoption spike",
    aScore: 88,
    aReason: "Rapid user acquisition, AI sector momentum",
    nScore: 98,
    nReason: "Partnership with major AI firms, mainnet launch imminent",
    sScore: 65,
    sReason: "High inflation currently, but deflationary mechanisms planned",
    lScore: 92,
    lReason: "Exceptional outperformance, AI sector leadership",
    iScore: 85,
    iReason: "a16z and Paradigm invested, major fund participation",
    mScore: 88,
    mReason: "Bullish market, AI narrative driving sector",
    totalScore: 87,
  },
];

export function getMockAssetWithScore(assetId: number) {
  const asset = mockAssets.find((a) => a.id === assetId);
  const score = mockScores.find((s) => s.assetId === assetId);
  return { asset, score };
}

export function getAllMockAssetsWithScores() {
  return mockAssets.map((asset) => {
    const score = mockScores.find((s) => s.assetId === asset.id);
    return { asset, score };
  });
}
