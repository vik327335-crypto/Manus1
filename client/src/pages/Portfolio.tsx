import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label as _Label } from "@/components/ui/label";
import { Plus, Trash2, TrendingUp, TrendingDown, Loader2, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Portfolio() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");

  // Fetch portfolios using tRPC
  const portfoliosQuery = trpc.portfolio.list.useQuery();

  // Create portfolio mutation
  const createPortfolioMutation = trpc.portfolio.create.useMutation({
    onSuccess: () => {
      portfoliosQuery.refetch();
      setNewPortfolioName("");
      setNewPortfolioDesc("");
      setShowCreateForm(false);
    },
  });

  // Delete portfolio mutation
  const deletePortfolioMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => {
      portfoliosQuery.refetch();
      setSelectedPortfolioId(null);
    },
  });

  // Get selected portfolio
  const selectedPortfolio = portfoliosQuery.data?.find(
    (p) => p.id === selectedPortfolioId
  );

  // Get portfolio metrics
  const metricsQuery = trpc.portfolio.getMetrics.useQuery(
    { id: selectedPortfolioId || "" },
    { enabled: !!selectedPortfolioId }
  );

  // Get Glassnode metrics for portfolio
  const glassnodeQuery = trpc.glassnode.getNetworkActivity.useQuery(
    { ticker: "BTC" },
    { enabled: !!selectedPortfolioId }
  );

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;

    await createPortfolioMutation.mutateAsync({
      name: newPortfolioName,
      description: newPortfolioDesc,
      targetAllocation: { BTC: 50, ETH: 30, Other: 20 },
    });
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (confirm("Are you sure you want to delete this portfolio?")) {
      await deletePortfolioMutation.mutateAsync({ id: portfolioId });
    }
  };

  if (portfoliosQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading portfolios...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio Management</h1>
          <p className="text-gray-600">Manage and track your crypto portfolios with real-time Glassnode metrics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Portfolios List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Portfolios</h2>
                <Button
                  size="sm"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="h-8 w-8 p-0"
                >
                  <Plus size={16} />
                </Button>
              </div>

              {showCreateForm && (
                <div className="mb-4 p-3 bg-blue-50 rounded space-y-2">
                  <Input
                    placeholder="Portfolio name"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Description"
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreatePortfolio}
                      disabled={createPortfolioMutation.isPending}
                      className="flex-1"
                    >
                      {createPortfolioMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {portfoliosQuery.data?.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    onClick={() => setSelectedPortfolioId(portfolio.id)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedPortfolioId === portfolio.id
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <p className="font-semibold text-sm">{portfolio.name}</p>
                    <p className="text-xs text-gray-600">{portfolio.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Portfolio Details */}
          <div className="lg:col-span-3">
            {selectedPortfolio && metricsQuery.data ? (
              <div className="space-y-6">
                {/* Metrics */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">{selectedPortfolio.name}</h2>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDeletePortfolio(selectedPortfolio.id)
                      }
                      disabled={deletePortfolioMutation.isPending}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold">
                        ${metricsQuery.data.totalValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold">
                        ${metricsQuery.data.totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Gain</p>
                      <p
                        className={`text-2xl font-bold ${
                          metricsQuery.data.totalGain >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        ${metricsQuery.data.totalGain.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Return %</p>
                      <p
                        className={`text-2xl font-bold flex items-center gap-1 ${
                          metricsQuery.data.totalGainPercent >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {metricsQuery.data.totalGainPercent >= 0 ? (
                          <TrendingUp size={20} />
                        ) : (
                          <TrendingDown size={20} />
                        )}
                        {metricsQuery.data.totalGainPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Holdings */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4">Holdings</h3>
                  {selectedPortfolio.holdings && selectedPortfolio.holdings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Ticker</th>
                            <th className="text-right py-2">Quantity</th>
                            <th className="text-right py-2">Entry Price</th>
                            <th className="text-right py-2">Current Price</th>
                            <th className="text-right py-2">Gain/Loss</th>
                            <th className="text-right py-2">Gain %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPortfolio.holdings.map((holding: any) => {
                            const totalValue = holding.quantity * holding.currentPrice;
                            const totalCost = holding.quantity * holding.entryPrice;
                            const gain = totalValue - totalCost;
                            const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

                            return (
                              <tr key={holding.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 font-semibold">{holding.ticker}</td>
                                <td className="text-right py-2">
                                  {holding.quantity.toFixed(4)}
                                </td>
                                <td className="text-right py-2">
                                  ${holding.entryPrice.toFixed(2)}
                                </td>
                                <td className="text-right py-2">
                                  ${holding.currentPrice.toFixed(2)}
                                </td>
                                <td
                                  className={`text-right py-2 font-semibold ${
                                    gain >= 0 ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  ${gain.toFixed(2)}
                                </td>
                                <td
                                  className={`text-right py-2 font-semibold flex items-center justify-end gap-1 ${
                                    gainPercent >= 0 ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {gainPercent >= 0 ? (
                                    <TrendingUp size={14} />
                                  ) : (
                                    <TrendingDown size={14} />
                                  )}
                                  {gainPercent.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No holdings in this portfolio</p>
                  )}
                </Card>

                {/* Allocation */}
                {metricsQuery.data.allocation && (
                  <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4">Target Allocation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(metricsQuery.data.allocation).map(
                        ([asset, percentage]: [string, any]) => (
                          <div key={asset} className="text-center">
                            <p className="text-sm text-gray-600">{asset}</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {percentage}%
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                )}

                {/* Glassnode Metrics */}
                {glassnodeQuery.data && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={20} className="text-blue-600" />
                      <h3 className="font-bold text-lg">Network Activity (BTC)</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Active Addresses</p>
                        <p className="text-lg font-bold">
                          {(glassnodeQuery.data.activeAddresses / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">New Addresses</p>
                        <p className="text-lg font-bold">
                          {(glassnodeQuery.data.newAddresses / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Transactions</p>
                        <p className="text-lg font-bold">
                          {(glassnodeQuery.data.transactionCount / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Volume</p>
                        <p className="text-lg font-bold">
                          ${(glassnodeQuery.data.totalVolume / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">
                  {portfoliosQuery.data?.length === 0
                    ? "No portfolios yet. Create one to get started!"
                    : "Select a portfolio to view details"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
