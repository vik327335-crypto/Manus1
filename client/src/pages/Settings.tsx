import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataUpdateSettings } from '@/components/DataUpdateSettings';
import { Settings as SettingsIcon, Bell, Database, User } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your CAN SLIM Scanner preferences and configurations
          </p>
        </div>

        <Tabs defaultValue="data-updates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="data-updates" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data Updates</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
          </TabsList>

          {/* Data Updates Tab */}
          <TabsContent value="data-updates" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Automatic Data Updates</h2>
              <p className="text-muted-foreground">
                Configure automatic background updates for your watched cryptocurrencies
              </p>
            </div>
            <DataUpdateSettings />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Notification settings coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Configure email, push, and in-app notifications for alerts and updates
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account and profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Profile settings coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Update your profile, change password, and manage security settings
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About CAN SLIM Scanner</CardTitle>
                <CardDescription>Information about the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Version</h3>
                    <p className="text-muted-foreground">1.0.0</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      CAN SLIM Crypto Scanner evaluates cryptocurrency projects using William O'Neill's proven investment methodology. Discover high-potential digital assets with AI-powered analysis.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Features</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>CAN SLIM scoring system for crypto evaluation</li>
                      <li>Real-time market analytics and trends</li>
                      <li>AI-powered sentiment analysis</li>
                      <li>Backtesting engine for strategy validation</li>
                      <li>Historical data analysis with technical indicators</li>
                      <li>Automatic data updates and notifications</li>
                      <li>Export reports in multiple formats (PDF, JSON, CSV)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Technology</h3>
                    <p className="text-muted-foreground">
                      Built with React 19, TypeScript, Tailwind CSS, and tRPC. Powered by advanced LLM models and real-time data APIs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
