import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Trash2, Plus, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportSchedule {
  id: string;
  name: string;
  ticker: string;
  format: 'pdf' | 'json' | 'csv' | 'all';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  includeCharts: boolean;
  includeMetrics: boolean;
  includeComparison: boolean;
}

export default function AutomatedExportReports() {
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<ExportSchedule>>({
    name: '',
    ticker: 'BTC',
    format: 'pdf',
    frequency: 'daily',
    time: '09:00',
    enabled: true,
    includeCharts: true,
    includeMetrics: true,
    includeComparison: false,
  });

  // Load schedules from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('exportSchedules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSchedules(parsed.map((s: any) => ({
          ...s,
          lastRun: s.lastRun ? new Date(s.lastRun) : undefined,
          nextRun: s.nextRun ? new Date(s.nextRun) : undefined,
        })));
      } catch (error) {
        console.error('Error loading schedules:', error);
      }
    }
  }, []);

  // Save schedules to localStorage
  useEffect(() => {
    localStorage.setItem('exportSchedules', JSON.stringify(schedules));
  }, [schedules]);

  const handleAddSchedule = () => {
    if (!formData.name?.trim()) {
      toast.error('Please enter a schedule name');
      return;
    }

    if (!formData.ticker?.trim()) {
      toast.error('Please enter a ticker');
      return;
    }

    const newSchedule: ExportSchedule = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      ticker: formData.ticker.toUpperCase(),
      format: formData.format || 'pdf',
      frequency: formData.frequency || 'daily',
      time: formData.time || '09:00',
      enabled: formData.enabled !== false,
      includeCharts: formData.includeCharts !== false,
      includeMetrics: formData.includeMetrics !== false,
      includeComparison: formData.includeComparison || false,
    };

    if (editingId) {
      setSchedules(schedules.map(s => s.id === editingId ? newSchedule : s));
      toast.success('Schedule updated');
      setEditingId(null);
    } else {
      setSchedules([...schedules, newSchedule]);
      toast.success('Schedule created');
    }

    setFormData({
      name: '',
      ticker: 'BTC',
      format: 'pdf',
      frequency: 'daily',
      time: '09:00',
      enabled: true,
      includeCharts: true,
      includeMetrics: true,
      includeComparison: false,
    });
    setShowForm(false);
  };

  const handleEditSchedule = (schedule: ExportSchedule) => {
    setFormData(schedule);
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
    toast.success('Schedule deleted');
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(schedules.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleRunNow = async (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    setIsLoading(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500));

      const now = new Date();
      const nextRun = new Date(now);
      if (schedule.frequency === 'daily') {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (schedule.frequency === 'weekly') {
        nextRun.setDate(nextRun.getDate() + 7);
      } else if (schedule.frequency === 'monthly') {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }

      setSchedules(schedules.map(s =>
        s.id === id
          ? { ...s, lastRun: now, nextRun }
          : s
      ));

      toast.success(`Export completed for ${schedule.ticker}`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getFrequencyLabel = (frequency: string, dayOfWeek?: number, dayOfMonth?: number) => {
    if (frequency === 'daily') return 'Daily';
    if (frequency === 'weekly') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Weekly (${days[dayOfWeek || 0]})`;
    }
    if (frequency === 'monthly') return `Monthly (Day ${dayOfMonth || 1})`;
    return frequency;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Automated Export Reports</h1>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            Schedule automatic exports of analysis reports in PDF, JSON, or CSV formats
          </p>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Schedule' : 'Create New Schedule'}</CardTitle>
              <CardDescription>Configure export parameters and scheduling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Weekly BTC Report"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="ticker">Ticker Symbol</Label>
                  <Input
                    id="ticker"
                    placeholder="e.g., BTC, ETH"
                    value={formData.ticker || ''}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={formData.format || 'pdf'} onValueChange={(v) => setFormData({ ...formData, format: v as any })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                      <SelectItem value="all">All Formats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency || 'daily'} onValueChange={(v) => setFormData({ ...formData, frequency: v as any })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="time">Export Time (HH:MM)</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time || '09:00'}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium">Include in Report</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="charts"
                      checked={formData.includeCharts !== false}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeCharts: checked as boolean })}
                    />
                    <Label htmlFor="charts" className="cursor-pointer">Charts and visualizations</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="metrics"
                      checked={formData.includeMetrics !== false}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeMetrics: checked as boolean })}
                    />
                    <Label htmlFor="metrics" className="cursor-pointer">Metrics and statistics</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="comparison"
                      checked={formData.includeComparison || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeComparison: checked as boolean })}
                    />
                    <Label htmlFor="comparison" className="cursor-pointer">Period comparison (1Y, 2Y, 3Y)</Label>
                  </div>
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label htmlFor="enabled">Enable Schedule</Label>
                  <p className="text-sm text-muted-foreground">Turn on to start automated exports</p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    ticker: 'BTC',
                    format: 'pdf',
                    frequency: 'daily',
                    time: '09:00',
                    enabled: true,
                    includeCharts: true,
                    includeMetrics: true,
                    includeComparison: false,
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddSchedule}>
                  {editingId ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedules List */}
        {schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{schedule.name}</h3>
                        <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                          {schedule.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{schedule.ticker}</Badge>
                        <Badge variant="outline">{schedule.format.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {getFrequencyLabel(schedule.frequency, schedule.dayOfWeek, schedule.dayOfMonth)} at {schedule.time}
                      </p>

                      {/* Options */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {schedule.includeCharts && (
                          <Badge variant="secondary" className="text-xs">📊 Charts</Badge>
                        )}
                        {schedule.includeMetrics && (
                          <Badge variant="secondary" className="text-xs">📈 Metrics</Badge>
                        )}
                        {schedule.includeComparison && (
                          <Badge variant="secondary" className="text-xs">🔄 Comparison</Badge>
                        )}
                      </div>

                      {/* Status */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Last Run</p>
                          {schedule.lastRun ? (
                            <p className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              {schedule.lastRun.toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">Never</p>
                          )}
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Run</p>
                          {schedule.nextRun ? (
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-600" />
                              {schedule.nextRun.toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">Pending</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleSchedule(schedule.id)}
                        title={schedule.enabled ? 'Disable' : 'Enable'}
                      >
                        {schedule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunNow(schedule.id)}
                        disabled={isLoading}
                        title="Run export now"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !showForm ? (
          <Card>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No export schedules yet</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Automated export scheduling system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">⏰ Scheduling</h4>
                <p className="text-sm text-muted-foreground">
                  Set up daily, weekly, or monthly exports at your preferred time
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📋 Formats</h4>
                <p className="text-sm text-muted-foreground">
                  Export as PDF reports, JSON data, CSV spreadsheets, or all formats
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">💾 Storage</h4>
                <p className="text-sm text-muted-foreground">
                  Reports are stored locally and can be downloaded or shared
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> Exports are generated based on your local browser schedule. For production use, consider integrating with a backend job scheduler.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
