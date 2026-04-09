import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataUpdateSettings } from '@/components/DataUpdateSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Bell, Database, User, Moon, Sun, Globe, Lock } from 'lucide-react';

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [telegramNotifications, setTelegramNotifications] = useState(false);

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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-semibold">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-5 h-5 rounded border-input"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-semibold">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="w-5 h-5 rounded border-input"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-semibold">Telegram Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts via Telegram</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={telegramNotifications}
                      onChange={(e) => setTelegramNotifications(e.target.checked)}
                      className="w-5 h-5 rounded border-input"
                    />
                  </div>
                </div>
                <Button className="w-full">Save Preferences</Button>
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
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                        className="gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                        className="gap-2"
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="en">English</option>
                      <option value="ru">Русский</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="password">Change Password</Label>
                    <Button variant="outline" className="w-full mt-2 gap-2">
                      <Lock className="h-4 w-4" />
                      Update Password
                    </Button>
                  </div>
                </div>
                <Button className="w-full">Save Changes</Button>
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
