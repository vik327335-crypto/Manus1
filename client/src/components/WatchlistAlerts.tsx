import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AlertCondition } from "@shared/types";
import { AlertConditionForm, AlertConditionFormData } from "./AlertConditionForm";
import { AlertConditionsList } from "./AlertConditionsList";
import { AlertHistory } from "./AlertHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, History } from "lucide-react";
import { toast } from "sonner";

interface WatchlistAlertsProps {
  assetId: number;
  assetName: string;
}

export function WatchlistAlerts({ assetId, assetName }: WatchlistAlertsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Queries
  const { data: conditions, isLoading: conditionsLoading, refetch: refetchConditions } = trpc.alerts.getForAsset.useQuery(
    { assetId },
    { enabled: true }
  );

  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = trpc.alerts.getHistory.useQuery(
    { limit: 20 },
    { enabled: true }
  );

  // Mutations
  const createMutation = trpc.alerts.create.useMutation({
    onSuccess: () => {
      toast.success("Alert created successfully");
      setShowForm(false);
      refetchConditions();
    },
    onError: (error) => {
      toast.error(`Failed to create alert: ${error.message}`);
    },
  });

  const updateMutation = trpc.alerts.update.useMutation({
    onSuccess: () => {
      toast.success("Alert updated successfully");
      setEditingId(null);
      refetchConditions();
    },
    onError: (error) => {
      toast.error(`Failed to update alert: ${error.message}`);
    },
  });

  const deleteMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success("Alert deleted successfully");
      refetchConditions();
    },
    onError: (error) => {
      toast.error(`Failed to delete alert: ${error.message}`);
    },
  });

  const toggleMutation = trpc.alerts.update.useMutation({
    onSuccess: () => {
      refetchConditions();
    },
    onError: (error) => {
      toast.error(`Failed to toggle alert: ${error.message}`);
    },
  });

  const handleSubmit = (data: AlertConditionFormData) => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        enabled: true,
        ...data,
      } as any);
    } else {
      createMutation.mutate({
        assetId,
        ...data,
      } as any);
    }
  };

  const handleEdit = (condition: AlertCondition) => {
    setEditingId(condition.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggle = (id: number, enabled: boolean) => {
    toggleMutation.mutate({
      id,
      enabled: enabled as any,
    } as any);
  };

  const editingCondition = conditions?.find((c) => c.id === editingId);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-foreground">
              Alerts for {assetName}
            </h3>
          </div>
          {!showForm && (
            <Button
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + New Alert
            </Button>
          )}
        </div>

        {/* Form or Conditions List */}
        {showForm ? (
          <AlertConditionForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            initialData={editingCondition}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        ) : (
          <Tabs defaultValue="conditions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="conditions" className="text-foreground">
                Active Alerts ({conditions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="text-foreground">
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Conditions Tab */}
            <TabsContent value="conditions" className="space-y-4 mt-4">
              {conditionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading alerts...
                </div>
              ) : (
                <AlertConditionsList
                  conditions={conditions || []}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  isLoading={deleteMutation.isPending || toggleMutation.isPending}
                />
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              {historyLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading history...
                </div>
              ) : (
                <AlertHistory
                  history={history || []}
                  isLoading={historyLoading}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Card>
  );
}
