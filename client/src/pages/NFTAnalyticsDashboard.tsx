/**
 * Advanced NFT Analytics Dashboard
 * Displays comprehensive NFT portfolio analytics with heatmaps, rarity distributions, and trends
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, ScatterChart as _ScatterChart, Scatter as _Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Download, Filter as _Filter } from 'lucide-react';

interface NFTAnalytics {
  portfolioValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalNFTs: number;
  averageRarity: number;
  floorPriceAverage: number;
  gainAverage: number;
  gainAveragePercent: number;
}

interface CollectionData {
  name: string;
  floorPrice: number;
  floorPriceChange24h: number;
  volume24h: number;
  holders: number;
  supply: number;
  nftCount: number;
  averageRarity: number;
  totalValue: number;
  gainPercent: number;
}

interface RarityDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface PriceHistory {
  date: string;
  price: number;
  volume: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const NFTAnalyticsDashboard: React.FC = () => {
  const [_selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'rarity'>('value');

  // Mock data - in production, fetch from API
  const analytics: NFTAnalytics = {
    portfolioValue: 125000,
    dayChange: 5250,
    dayChangePercent: 4.38,
    totalNFTs: 42,
    averageRarity: 72.5,
    floorPriceAverage: 2.98,
    gainAverage: 1.25,
    gainAveragePercent: 42.3,
  };

  const collections = useMemo<CollectionData[]>(() => [
    {
      name: 'Magic Eden Wizards',
      floorPrice: 4.5,
      floorPriceChange24h: 8.5,
      volume24h: 125000,
      holders: 2500,
      supply: 5000,
      nftCount: 12,
      averageRarity: 85,
      totalValue: 54000,
      gainPercent: 52.3,
    },
    {
      name: 'Solana Punks',
      floorPrice: 2.1,
      floorPriceChange24h: -2.3,
      volume24h: 85000,
      holders: 1800,
      supply: 3000,
      nftCount: 18,
      averageRarity: 68,
      totalValue: 37800,
      gainPercent: 28.5,
    },
    {
      name: 'DeGods',
      floorPrice: 3.75,
      floorPriceChange24h: 5.2,
      volume24h: 95000,
      holders: 2100,
      supply: 4000,
      nftCount: 12,
      averageRarity: 72,
      totalValue: 45000,
      gainPercent: 35.8,
    },
  ], []);

  const rarityDistribution: RarityDistribution[] = [
    { range: '0-20', count: 2, percentage: 4.8 },
    { range: '20-40', count: 5, percentage: 11.9 },
    { range: '40-60', count: 8, percentage: 19.0 },
    { range: '60-80', count: 15, percentage: 35.7 },
    { range: '80-100', count: 12, percentage: 28.6 },
  ];

  const priceHistory: PriceHistory[] = [
    { date: '2026-07-25', price: 2.85, volume: 95000 },
    { date: '2026-07-26', price: 2.92, volume: 105000 },
    { date: '2026-07-27', price: 2.88, volume: 98000 },
    { date: '2026-07-28', price: 3.05, volume: 125000 },
    { date: '2026-07-29', price: 3.12, volume: 135000 },
    { date: '2026-07-30', price: 2.98, volume: 110000 },
    { date: '2026-07-31', price: 3.15, volume: 142000 },
  ];

  const collectionDistribution = useMemo(() => {
    return collections.map(c => ({
      name: c.name,
      value: c.totalValue,
      color: COLORS[collections.indexOf(c) % COLORS.length],
    }));
  }, [collections]);

  const sortedCollections = useMemo(() => {
    const sorted = [...collections];
    if (sortBy === 'value') {
      sorted.sort((a, b) => b.totalValue - a.totalValue);
    } else if (sortBy === 'gain') {
      sorted.sort((a, b) => b.gainPercent - a.gainPercent);
    } else {
      sorted.sort((a, b) => b.averageRarity - a.averageRarity);
    }
    return sorted;
  }, [collections, sortBy]);

  const handleExportAnalytics = () => {
    const csv = generateCSV();
    downloadCSV(csv, 'nft-analytics.csv');
  };

  const generateCSV = (): string => {
    let csv = 'NFT Portfolio Analytics Report\n\n';
    csv += 'Portfolio Summary\n';
    csv += `Total Value,${analytics.portfolioValue}\n`;
    csv += `Day Change,${analytics.dayChange}\n`;
    csv += `Day Change %,${analytics.dayChangePercent}%\n`;
    csv += `Total NFTs,${analytics.totalNFTs}\n`;
    csv += `Average Rarity,${analytics.averageRarity}\n\n`;

    csv += 'Collections\n';
    csv += 'Name,Floor Price,24h Change,Volume,Holders,NFT Count,Avg Rarity,Total Value,Gain %\n';
    collections.forEach(c => {
      csv += `${c.name},${c.floorPrice},${c.floorPriceChange24h}%,${c.volume24h},${c.holders},${c.nftCount},${c.averageRarity},${c.totalValue},${c.gainPercent}%\n`;
    });

    csv += '\nRarity Distribution\n';
    csv += 'Range,Count,Percentage\n';
    rarityDistribution.forEach(r => {
      csv += `${r.range},${r.count},${r.percentage}%\n`;
    });

    return csv;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">NFT Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Advanced portfolio analytics and market insights</p>
        </div>
        <Button onClick={handleExportAnalytics} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${((analytics.portfolioValue as number) / 1000).toFixed(1)}K</div>
            <p className={`text-xs mt-1 flex items-center gap-1 ${(analytics.dayChangePercent as number) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(analytics.dayChangePercent as number) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {(analytics.dayChangePercent as number) >= 0 ? '+' : ''}{(analytics.dayChangePercent as number).toFixed(2)}% (${analytics.dayChange})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalNFTs}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {collections.length} collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rarity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.averageRarity as number).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(analytics.gainAveragePercent as number).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">${(analytics.gainAverage as number).toFixed(2)} per NFT</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="collections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="rarity">Rarity</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Collection Performance</CardTitle>
                  <CardDescription>Detailed metrics for each NFT collection</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'value' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('value')}
                  >
                    Value
                  </Button>
                  <Button
                    variant={sortBy === 'gain' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('gain')}
                  >
                    Gain
                  </Button>
                  <Button
                    variant={sortBy === 'rarity' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('rarity')}
                  >
                    Rarity
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedCollections.map((collection) => (
                  <div
                    key={collection.name}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition"
                    onClick={() => setSelectedCollection(collection.name)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{collection.name}</h3>
                        <p className="text-sm text-muted-foreground">{collection.nftCount} NFTs • {collection.supply} total supply</p>
                      </div>
                      <Badge variant={(collection.gainPercent as number) >= 0 ? 'default' : 'destructive'}>
                        {(collection.gainPercent as number) >= 0 ? '+' : ''}{(collection.gainPercent as number).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Floor</p>
                        <p className="font-semibold">{collection.floorPrice.toFixed(2)} SOL</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h Change</p>
                        <p className={`font-semibold ${(collection.floorPriceChange24h as number) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(collection.floorPriceChange24h as number) >= 0 ? '+' : ''}{(collection.floorPriceChange24h as number).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volume</p>
                        <p className="font-semibold">${(collection.volume24h / 1000).toFixed(1)}K</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rarity</p>
                        <p className="font-semibold">{collection.averageRarity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Value</p>
                        <p className="font-semibold">${(collection.totalValue / 1000).toFixed(1)}K</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rarity Distribution Tab */}
        <TabsContent value="rarity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rarity Distribution</CardTitle>
              <CardDescription>NFT count by rarity score range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rarityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {rarityDistribution.map((item) => (
                    <div key={item.range} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-semibold">{item.range}</p>
                        <p className="text-sm text-muted-foreground">{item.count} NFTs</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.percentage.toFixed(1)}%</p>
                        <div className="w-16 h-2 bg-secondary rounded-full mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Floor Price Trends</CardTitle>
                  <CardDescription>Average floor price movement over time</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(['24h', '7d', '30d'] as const).map((tf) => (
                    <Button
                      key={tf}
                      variant={timeframe === tf ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    dot={{ fill: '#3b82f6' }}
                    name="Floor Price (SOL)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trading Volume Trends</CardTitle>
              <CardDescription>24-hour volume movement</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#10b981" name="Volume ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Distribution</CardTitle>
              <CardDescription>Value allocation across collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={collectionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${(value / 1000).toFixed(1)}K`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {collectionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${((value as number) / 1000).toFixed(1)}K`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {collections.map((collection, index) => (
                    <div key={collection.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-semibold text-sm">{collection.name}</p>
                          <p className="text-xs text-muted-foreground">{collection.nftCount} NFTs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(collection.totalValue / 1000).toFixed(1)}K</p>
                        <p className="text-xs text-muted-foreground">
                          {(((collection.totalValue as number) / (analytics.portfolioValue as number)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NFTAnalyticsDashboard;
