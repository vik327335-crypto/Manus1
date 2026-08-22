import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Portfolio() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");

  const portfoliosQuery = trpc.portfolio.list.useQuery();
  const createPortfolioMutation = trpc.portfolio.create.useMutation({
    onSuccess: (portfolio) => {
      portfoliosQuery.refetch();
      setSelectedPortfolioId(portfolio.id);
      setNewPortfolioName("");
      setNewPortfolioDesc("");
      setShowCreateForm(false);
    },
  });
  const deletePortfolioMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => {
      portfoliosQuery.refetch();
      setSelectedPortfolioId(null);
    },
  });

  const selectedPortfolio = portfoliosQuery.data?.find((portfolio) => portfolio.id === selectedPortfolioId);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    await createPortfolioMutation.mutateAsync({
      name: newPortfolioName,
      description: newPortfolioDesc,
      targetAllocation: {},
    });
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (confirm("Are you sure you want to delete this portfolio record?")) {
      await deletePortfolioMutation.mutateAsync({ id: portfolioId });
    }
  };

  if (portfoliosQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="mr-2 animate-spin" /><span>Loading portfolio records...</span></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Portfolio Management</h1>
          <p className="text-gray-600">Research portfolio records. Market valuation and P&amp;L require a verified owner-scoped price source.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Portfolio Records</h2>
                <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)} className="h-8 w-8 p-0"><Plus size={16} /></Button>
              </div>

              {showCreateForm && (
                <div className="mb-4 space-y-2 rounded bg-blue-50 p-3">
                  <Input placeholder="Portfolio name" value={newPortfolioName} onChange={(event) => setNewPortfolioName(event.target.value)} className="text-sm" />
                  <Input placeholder="Research description" value={newPortfolioDesc} onChange={(event) => setNewPortfolioDesc(event.target.value)} className="text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreatePortfolio} disabled={createPortfolioMutation.isPending} className="flex-1">
                      {createPortfolioMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Create"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {portfoliosQuery.data?.map((portfolio) => (
                  <button key={portfolio.id} onClick={() => setSelectedPortfolioId(portfolio.id)} className={`w-full rounded p-3 text-left transition-colors ${selectedPortfolioId === portfolio.id ? "border-2 border-blue-500 bg-blue-100" : "bg-gray-100 hover:bg-gray-200"}`}>
                    <p className="text-sm font-semibold">{portfolio.name}</p>
                    <p className="text-xs text-gray-600">{portfolio.description || "No description"}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {selectedPortfolio ? (
              <div className="space-y-6">
                <Card className="border-amber-300 bg-amber-50 p-6 text-amber-950">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">{selectedPortfolio.name}</h2>
                    <Button size="sm" variant="outline" onClick={() => handleDeletePortfolio(selectedPortfolio.id)} disabled={deletePortfolioMutation.isPending}><Trash2 size={16} className="mr-2" />Delete</Button>
                  </div>
                  <p className="text-sm">This record has no verified current-price or holdings source. The application intentionally does not calculate total value, gain/loss, return, allocation drift, or market activity from placeholder values.</p>
                </Card>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {["Total Value", "Total Cost", "Total Gain", "Return %"].map((label) => (
                    <Card key={label} className="p-6"><p className="text-sm text-gray-600">{label}</p><p className="text-2xl font-bold text-muted-foreground">—</p></Card>
                  ))}
                </div>

                <Card className="p-6">
                  <h3 className="mb-2 text-lg font-bold">Holdings and Valuation Unavailable</h3>
                  <p className="text-sm text-gray-600">User-entered portfolio metadata can be stored, but holdings, current prices, and valuation outputs remain unavailable until a verified owner-scoped source supplies price provenance and freshness metadata.</p>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center"><p className="text-gray-500">{portfoliosQuery.data?.length === 0 ? "No portfolio records yet. Create a research record to get started." : "Select a portfolio record to review its data-quality state."}</p></Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
