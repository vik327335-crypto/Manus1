import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Users, TrendingUp, Copy, Heart } from "lucide-react";

interface Trader {
  id: number;
  name: string;
  description: string;
  avatar?: string;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  avgReturn: number;
  maxDrawdown: number;
  followers: number;
  copiedTrades: number;
  rating: number;
  verified: boolean;
}

const mockTraders: Trader[] = [
  {
    id: 1,
    name: "CryptoWhale",
    description: "Professional trader with 10+ years experience",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoWhale",
    winRate: 6800, // 68%
    totalTrades: 250,
    profitableTrades: 170,
    avgReturn: 1250, // 12.5%
    maxDrawdown: 1500, // 15%
    followers: 5420,
    copiedTrades: 1240,
    rating: 480, // 4.8 stars
    verified: true,
  },
  {
    id: 2,
    name: "DeFiMaster",
    description: "Specialized in DeFi opportunities",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiMaster",
    winRate: 6200, // 62%
    totalTrades: 180,
    profitableTrades: 112,
    avgReturn: 950, // 9.5%
    maxDrawdown: 2000, // 20%
    followers: 3210,
    copiedTrades: 890,
    rating: 420, // 4.2 stars
    verified: true,
  },
  {
    id: 3,
    name: "AltcoinHunter",
    description: "Finds emerging altcoins early",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AltcoinHunter",
    winRate: 5500, // 55%
    totalTrades: 320,
    profitableTrades: 176,
    avgReturn: 1800, // 18%
    maxDrawdown: 3500, // 35%
    followers: 2890,
    copiedTrades: 650,
    rating: 380, // 3.8 stars
    verified: false,
  },
];

export default function Traders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "followers" | "winRate">("rating");
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredTraders = mockTraders
    .filter((trader) =>
      trader.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "followers":
          return b.followers - a.followers;
        case "winRate":
          return b.winRate - a.winRate;
        default:
          return 0;
      }
    });

  const renderStars = (rating: number) => {
    const stars = Math.round(rating / 100);
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="text-sm text-gray-500">({(rating / 100).toFixed(1)})</span>
      </div>
    );
  };

  const TraderCard = ({ trader }: { trader: Trader }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {trader.avatar && (
              <img
                src={trader.avatar}
                alt={trader.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{trader.name}</CardTitle>
                {trader.verified && (
                  <Badge variant="secondary" className="text-xs">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">{trader.description}</p>
            </div>
          </div>
          {renderStars(trader.rating)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Win Rate</p>
            <p className="text-lg font-semibold text-green-600">
              {(trader.winRate / 100).toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Avg Return</p>
            <p className="text-lg font-semibold text-blue-600">
              {(trader.avgReturn / 100).toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Total Trades</p>
            <p className="text-lg font-semibold">{trader.totalTrades}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Max Drawdown</p>
            <p className="text-lg font-semibold text-red-600">
              -{(trader.maxDrawdown / 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users size={16} />
            <span>{trader.followers} followers</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Copy size={16} />
            <span>{trader.copiedTrades} copied</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Heart size={16} className="mr-1" />
            Follow
          </Button>
          <Button size="sm" className="flex-1">
            <Copy size={16} className="mr-1" />
            Copy Trades
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Trading</h1>
        <p className="text-gray-600 mt-2">
          Discover and follow successful traders. Copy their trades automatically.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search traders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="rating">Sort by Rating</option>
            <option value="followers">Sort by Followers</option>
            <option value="winRate">Sort by Win Rate</option>
          </select>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All Traders</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="copied">Copied Trades</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTraders.map((trader) => (
                <TraderCard key={trader.id} trader={trader} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center py-8">
                  You are not following any traders yet.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="copied" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Copied Trades History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-semibold border-b pb-2">
                    <div>Trader</div>
                    <div>Symbol</div>
                    <div>Entry</div>
                    <div>Exit</div>
                    <div>P&L</div>
                    <div>Status</div>
                  </div>
                  <p className="text-gray-500 text-center py-8">
                    No copied trades yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
