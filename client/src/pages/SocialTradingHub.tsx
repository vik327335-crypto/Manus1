import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Heart, Share2, TrendingUp, Users, Trophy, Search } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  creator: string;
  description: string;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  followers: number;
  copiers: number;
  tags: string[];
  avatar?: string;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalReturn: number;
  sharpeRatio: number;
  followers: number;
  strategiesCount: number;
  score: number;
}

export const SocialTradingHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [likedStrategies, setLikedStrategies] = useState<Set<string>>(new Set());

  const mockStrategies = useMemo<Strategy[]>(() => [
    {
      id: '1',
      name: 'CAN SLIM Momentum',
      creator: 'trader_elite',
      description: 'High-growth momentum strategy focusing on stocks with strong earnings growth',
      totalReturn: 145,
      sharpeRatio: 1.85,
      winRate: 62.5,
      followers: 250,
      copiers: 45,
      tags: ['momentum', 'growth', 'long-only'],
    },
    {
      id: '2',
      name: 'Mean Reversion',
      creator: 'quant_master',
      description: 'Statistical arbitrage strategy based on mean reversion principles',
      totalReturn: 89,
      sharpeRatio: 1.42,
      winRate: 58.2,
      followers: 180,
      copiers: 32,
      tags: ['mean-reversion', 'statistical', 'short-term'],
    },
    {
      id: '3',
      name: 'Breakout Trading',
      creator: 'breakout_pro',
      description: 'Trend-following strategy that trades breakouts from consolidation zones',
      totalReturn: 112,
      sharpeRatio: 1.56,
      winRate: 55.8,
      followers: 220,
      copiers: 38,
      tags: ['breakout', 'trend-following', 'technical'],
    },
  ], []);

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      username: 'trader_elite',
      totalReturn: 145,
      sharpeRatio: 1.85,
      followers: 250,
      strategiesCount: 3,
      score: 92,
    },
    {
      rank: 2,
      username: 'quant_master',
      totalReturn: 89,
      sharpeRatio: 1.42,
      followers: 180,
      strategiesCount: 5,
      score: 78,
    },
    {
      rank: 3,
      username: 'breakout_pro',
      totalReturn: 112,
      sharpeRatio: 1.56,
      followers: 220,
      strategiesCount: 2,
      score: 85,
    },
  ];

  const allTags = ['momentum', 'growth', 'mean-reversion', 'trend-following', 'technical', 'statistical'];

  const filteredStrategies = useMemo(() => {
    return mockStrategies.filter((strategy) => {
      const matchesSearch =
        strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => strategy.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [mockStrategies, searchQuery, selectedTags]);

  const toggleLike = (strategyId: string) => {
    const newLiked = new Set(likedStrategies);
    if (newLiked.has(strategyId)) {
      newLiked.delete(strategyId);
    } else {
      newLiked.add(strategyId);
    }
    setLikedStrategies(newLiked);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Trading Hub</h1>
        <p className="text-gray-600">Discover top strategies, follow traders, and copy their trades</p>
      </div>

      <Tabs defaultValue="strategies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="following">My Follows</TabsTrigger>
        </TabsList>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          {/* Search and Filters */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search strategies or creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Strategies List */}
          <div className="grid gap-4">
            {filteredStrategies.map((strategy) => (
              <Card key={strategy.id} className="p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{strategy.name}</h3>
                    <p className="text-sm text-gray-600">by {strategy.creator}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(strategy.id)}
                      className={likedStrategies.has(strategy.id) ? 'text-red-500' : ''}
                    >
                      <Heart className="w-4 h-4" fill={likedStrategies.has(strategy.id) ? 'currentColor' : 'none'} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{strategy.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Return</p>
                    <p className="text-lg font-bold text-green-600">+{strategy.totalReturn}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Sharpe Ratio</p>
                    <p className="text-lg font-bold">{strategy.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Win Rate</p>
                    <p className="text-lg font-bold">{strategy.winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Followers</p>
                    <p className="text-lg font-bold">{strategy.followers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Copiers</p>
                    <p className="text-lg font-bold">{strategy.copiers}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {strategy.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">Follow Creator</Button>
                  <Button variant="outline" className="flex-1">
                    Copy Trade
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Trader</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Return</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Sharpe</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Followers</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Strategies</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                        {entry.rank === 2 && <Trophy className="w-5 h-5 text-gray-400" />}
                        {entry.rank === 3 && <Trophy className="w-5 h-5 text-orange-600" />}
                        <span className="font-semibold">{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{entry.username}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold">+{entry.totalReturn}%</td>
                    <td className="px-6 py-4">{entry.sharpeRatio.toFixed(2)}</td>
                    <td className="px-6 py-4">{entry.followers}</td>
                    <td className="px-6 py-4">{entry.strategiesCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">{entry.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-4">
          <Card className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">You're not following any traders yet</p>
            <p className="text-sm text-gray-500 mb-4">Start following traders to see their strategies and copy their trades</p>
            <Button onClick={() => {
              const tab = document.querySelector('[value="strategies"]') as HTMLButtonElement;
              tab?.click();
            }}>
              Explore Strategies
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialTradingHub;
