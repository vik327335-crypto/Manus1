import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function DeFiIntegration() {
  const [activeTab, setActiveTab] = useState("uniswap");
  const [swapInput, setSwapInput] = useState({ tokenIn: "ETH", tokenOut: "USDC", amountIn: 1 });
  const [lendInput, setLendInput] = useState({ asset: "USDC", amount: 1000 });
  const [borrowInput, setBorrowInput] = useState({ asset: "ETH", amount: 1 });

  // Uniswap queries
  const uniswapPoolQuery = trpc.defiIntegration.getUniswapPool.useQuery({
    token0: "ETH",
    token1: "USDC",
    fee: 3000,
  });

  const swapRouteQuery = trpc.defiIntegration.calculateSwapRoute.useQuery({
    tokenIn: swapInput.tokenIn,
    tokenOut: swapInput.tokenOut,
    amountIn: swapInput.amountIn,
  });

  // Aave queries
  const aaveMarketsQuery = trpc.defiIntegration.getAaveMarkets.useQuery();

  // Curve queries
  const curvePoolQuery = trpc.defiIntegration.getCurvePool.useQuery({
    poolId: "3pool",
  });

  // Yield farming query
  const yieldOpportunitiesQuery = trpc.defiIntegration.getYieldFarmingOpportunities.useQuery();

  // Mutations
  const executeSwapMutation = trpc.defiIntegration.executeUniswapSwap.useMutation();
  const lendMutation = trpc.defiIntegration.lendOnAave.useMutation();
  const borrowMutation = trpc.defiIntegration.borrowFromAave.useMutation();
  const provideLiquidityMutation = trpc.defiIntegration.provideLiquidityToCurve.useMutation();

  const handleExecuteSwap = async () => {
    if (swapRouteQuery.data?.data) {
      const route = swapRouteQuery.data.data;
      await executeSwapMutation.mutateAsync({
        tokenIn: route.tokenIn,
        tokenOut: route.tokenOut,
        amountIn: route.amountIn,
        amountOutMin: route.amountOutMin,
        slippage: route.slippage,
        path: route.path,
      });
    }
  };

  const handleLend = async () => {
    await lendMutation.mutateAsync(lendInput);
  };

  const handleBorrow = async () => {
    await borrowMutation.mutateAsync(borrowInput);
  };

  const handleProvideLiquidity = async () => {
    await provideLiquidityMutation.mutateAsync({
      poolId: "3pool",
      amounts: [1000, 1000, 1000],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DeFi Integration</h1>
        <p className="text-gray-600">Manage your DeFi positions across Uniswap, Aave, and Curve</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="uniswap">Uniswap</TabsTrigger>
          <TabsTrigger value="aave">Aave</TabsTrigger>
          <TabsTrigger value="curve">Curve</TabsTrigger>
          <TabsTrigger value="yield">Yield Farming</TabsTrigger>
        </TabsList>

        {/* Uniswap Tab */}
        <TabsContent value="uniswap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uniswap V3 Swap</CardTitle>
              <CardDescription>Execute swaps with optimal routing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uniswapPoolQuery.data?.data && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pool Liquidity</p>
                    <p className="text-2xl font-bold">${uniswapPoolQuery.data.data.liquidity.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">24h Volume</p>
                    <p className="text-2xl font-bold">${(uniswapPoolQuery.data.data.volume24h / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">24h Fees</p>
                    <p className="text-2xl font-bold">${(uniswapPoolQuery.data.data.feesUSD / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Fee Tier</p>
                    <p className="text-2xl font-bold">{(uniswapPoolQuery.data.data.fee * 100).toFixed(2)}%</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium">Swap Route</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Token In"
                    value={swapInput.tokenIn}
                    onChange={(e) => setSwapInput({ ...swapInput, tokenIn: e.target.value })}
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={swapInput.amountIn}
                    onChange={(e) => setSwapInput({ ...swapInput, amountIn: parseFloat(e.target.value) })}
                  />
                  <Input
                    placeholder="Token Out"
                    value={swapInput.tokenOut}
                    onChange={(e) => setSwapInput({ ...swapInput, tokenOut: e.target.value })}
                  />
                </div>
              </div>

              {swapRouteQuery.data?.data && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Expected Output</p>
                  <p className="text-2xl font-bold">{swapRouteQuery.data.data.amountOutMin.toFixed(4)}</p>
                  <p className="text-xs text-gray-500">Min output with {(swapRouteQuery.data.data.slippage * 100).toFixed(2)}% slippage</p>
                </div>
              )}

              <Button onClick={handleExecuteSwap} disabled={executeSwapMutation.isPending} className="w-full">
                {executeSwapMutation.isPending ? "Executing..." : "Execute Swap"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aave Tab */}
        <TabsContent value="aave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aave Lending & Borrowing</CardTitle>
              <CardDescription>Manage your lending and borrowing positions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aaveMarketsQuery.data?.data && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Available Markets</h3>
                  <div className="grid gap-2">
                    {aaveMarketsQuery.data.data.map((market) => (
                      <div key={market.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{market.name}</p>
                            <p className="text-sm text-gray-600">Supply: {(market.supplyRate * 100).toFixed(2)}% | Borrow: {(market.borrowRate * 100).toFixed(2)}%</p>
                          </div>
                          <Badge variant="outline">{market.symbol}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Lend</label>
                  <Input
                    placeholder="Asset"
                    value={lendInput.asset}
                    onChange={(e) => setLendInput({ ...lendInput, asset: e.target.value })}
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={lendInput.amount}
                    onChange={(e) => setLendInput({ ...lendInput, amount: parseFloat(e.target.value) })}
                  />
                  <Button onClick={handleLend} disabled={lendMutation.isPending} className="w-full">
                    {lendMutation.isPending ? "Lending..." : "Lend"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Borrow</label>
                  <Input
                    placeholder="Asset"
                    value={borrowInput.asset}
                    onChange={(e) => setBorrowInput({ ...borrowInput, asset: e.target.value })}
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={borrowInput.amount}
                    onChange={(e) => setBorrowInput({ ...borrowInput, amount: parseFloat(e.target.value) })}
                  />
                  <Button onClick={handleBorrow} disabled={borrowMutation.isPending} className="w-full">
                    {borrowMutation.isPending ? "Borrowing..." : "Borrow"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Curve Tab */}
        <TabsContent value="curve" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Curve Finance</CardTitle>
              <CardDescription>Provide liquidity and earn fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {curvePoolQuery.data?.data && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">TVL</p>
                    <p className="text-2xl font-bold">${(curvePoolQuery.data.data.tvl / 1000000000).toFixed(2)}B</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">APY</p>
                    <p className="text-2xl font-bold">{(curvePoolQuery.data.data.apy * 100).toFixed(2)}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">24h Volume</p>
                    <p className="text-2xl font-bold">${(curvePoolQuery.data.data.volume24h / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Fee</p>
                    <p className="text-2xl font-bold">{(curvePoolQuery.data.data.fee * 100).toFixed(3)}%</p>
                  </div>
                </div>
              )}

              <Button onClick={handleProvideLiquidity} disabled={provideLiquidityMutation.isPending} className="w-full">
                {provideLiquidityMutation.isPending ? "Providing..." : "Provide Liquidity"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yield Farming Tab */}
        <TabsContent value="yield" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yield Farming Opportunities</CardTitle>
              <CardDescription>Discover the best yield farming strategies</CardDescription>
            </CardHeader>
            <CardContent>
              {yieldOpportunitiesQuery.data?.data && (
                <div className="space-y-2">
                  {yieldOpportunitiesQuery.data.data.map((opp, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{opp.protocol} - {opp.farm}</p>
                          <p className="text-sm text-gray-600">Reward: {opp.rewardToken}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800">{(opp.apy * 100).toFixed(2)}% APY</Badge>
                          <p className="text-sm text-gray-600 mt-1">${opp.totalRewards.toLocaleString()} rewards</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
