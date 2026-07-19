import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Zap } from 'lucide-react';

export default function NFTPortfolio() {
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');

  const portfolioQuery = trpc.nftPortfolio.getPortfolioOpenSea.useQuery(
    { walletAddress: selectedWallet },
    { enabled: !!selectedWallet }
  );

  const metricsQuery = trpc.nftPortfolio.getMetrics.useQuery(
    { walletAddress: selectedWallet },
    { enabled: !!selectedWallet }
  );

  const trendsQuery = trpc.nftPortfolio.getMarketTrends.useQuery();
  const recommendationsQuery = trpc.nftPortfolio.getRecommendations.useQuery(
    { walletAddress: selectedWallet },
    { enabled: !!selectedWallet }
  );

  const handleSearch = () => {
    if (walletAddress.trim()) {
      setSelectedWallet(walletAddress);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">NFT Portfolio</h1>
        <p className="text-muted-foreground">Track and analyze your NFT holdings</p>
      </div>

      {/* Wallet Search */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Enter your Ethereum wallet address to view your NFT portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!walletAddress.trim()}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedWallet && (
        <>
          {/* Portfolio Metrics */}
          {metricsQuery.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metricsQuery.data.totalValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {metricsQuery.data.gainPercent > 0 ? '+' : ''}
                    {metricsQuery.data.gainPercent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Gain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metricsQuery.data.totalGain.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Floor Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metricsQuery.data.floorValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Collection floors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Diversification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metricsQuery.data.diversificationScore.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">Portfolio spread</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="portfolio" className="space-y-4">
            <TabsList>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="trends">Market Trends</TabsTrigger>
            </TabsList>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-4">
              {portfolioQuery.isLoading ? (
                <Card>
                  <CardContent className="pt-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </CardContent>
                </Card>
              ) : portfolioQuery.data && portfolioQuery.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioQuery.data.map((nft) => (
                    <Card key={nft.id} className="overflow-hidden">
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold truncate">{nft.name}</h3>
                        <p className="text-sm text-muted-foreground">{nft.collectionName}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current Price:</span>
                            <span className="font-medium">${nft.currentPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Floor Price:</span>
                            <span className="font-medium">${nft.collectionFloorPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Rarity:</span>
                            <span className="font-medium">{nft.rarity.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No NFTs found in this wallet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              {recommendationsQuery.isLoading ? (
                <Card>
                  <CardContent className="pt-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </CardContent>
                </Card>
              ) : recommendationsQuery.data && recommendationsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {recommendationsQuery.data.map((rec, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Zap className="h-5 w-5 mt-0.5 text-yellow-500" />
                          <div>
                            <h3 className="font-semibold capitalize">{rec.type}</h3>
                            <p className="text-sm text-muted-foreground">{rec.message}</p>
                            <span
                              className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                                rec.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : rec.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No recommendations at this time</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              {trendsQuery.isLoading ? (
                <Card>
                  <CardContent className="pt-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </CardContent>
                </Card>
              ) : trendsQuery.data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(trendsQuery.data)
                    .slice(0, 10)
                    .map(([collection, data]: any) => (
                      <Card key={collection}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{collection}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Floor Price:</span>
                            <span className="font-medium">${data.floorPrice?.toFixed(2) || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>24h Volume:</span>
                            <span className="font-medium">${data.volume24h?.toFixed(2) || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>24h Change:</span>
                            <span
                              className={`font-medium ${data.volumeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {data.volumeChange >= 0 ? '+' : ''}
                              {data.volumeChange?.toFixed(2) || 'N/A'}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">Unable to load market trends</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
