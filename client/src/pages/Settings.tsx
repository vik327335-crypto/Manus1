import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataUpdateSettings } from '@/components/DataUpdateSettings';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  User,
  ArrowLeft,
  Check,
  AlertCircle,
  Zap,
  Shield,
  Code,
  Info,
  Loader2
} from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('data-updates');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please sign in to access settings</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-border bg-white dark:bg-card">
        <div className="container px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")} 
            className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Settings</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage your CAN SLIM Scanner preferences and configurations
            </p>
          </div>
        </div>
      </div>

      <div className="container px-4 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tabs Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-800">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 bg-transparent border-0 p-0 h-auto">
              <TabsTrigger 
                value="data-updates" 
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 rounded-none font-medium transition-colors",
                  activeTab === "data-updates"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Data Updates</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 rounded-none font-medium transition-colors",
                  activeTab === "notifications"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 rounded-none font-medium transition-colors",
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="about" 
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 rounded-none font-medium transition-colors",
                  activeTab === "about"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Data Updates Tab */}
          <TabsContent value="data-updates" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Automatic Data Updates</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Configure automatic background updates for your watched cryptocurrencies
              </p>
            </div>
            <DataUpdateSettings />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Notification Preferences</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Control how and when you receive notifications
              </p>
            </div>

            <div className="grid gap-6">
              {/* Email Notifications */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mt-1">
                        <Bell className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-white">Email Notifications</CardTitle>
                        <CardDescription>Receive alerts via email</CardDescription>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Coming Soon</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-400">
                  <p>Configure email notifications for price alerts, score changes, and market updates.</p>
                </CardContent>
              </Card>

              {/* Push Notifications */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mt-1">
                        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-white">Push Notifications</CardTitle>
                        <CardDescription>Browser push notifications</CardDescription>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Coming Soon</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-400">
                  <p>Get instant notifications directly in your browser when important events occur.</p>
                </CardContent>
              </Card>

              {/* In-App Notifications */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mt-1">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-white">In-App Notifications</CardTitle>
                        <CardDescription>Notifications within the application</CardDescription>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Coming Soon</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-400">
                  <p>See notifications and updates directly in the application dashboard.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profile Settings</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your account and profile information
              </p>
            </div>

            <div className="grid gap-6">
              {/* Account Information */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Account Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                      Name
                    </label>
                    <Input 
                      type="text" 
                      value={user.name || 'User'} 
                      disabled
                      className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                      Email Address
                    </label>
                    <Input 
                      type="email" 
                      value={user.email || 'user@example.com'} 
                      disabled
                      className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                      Account Created
                    </label>
                    <Input 
                      type="text" 
                      value={new Date().toLocaleDateString()} 
                      disabled
                      className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mt-1">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-slate-900 dark:text-white">Security</CardTitle>
                      <CardDescription>Manage your account security</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Password</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Manage your account password</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(true);
                        toast.info("Password change feature coming soon", {
                          description: "This feature will be available in the next update",
                          duration: 3000,
                        });
                        setTimeout(() => setIsChangingPassword(false), 1000);
                      }}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Not enabled</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast.info("2FA setup coming soon", {
                          description: "Two-factor authentication will be available soon",
                          duration: 3000,
                        });
                      }}
                    >
                      Enable 2FA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">About CAN SLIM Scanner</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Information about the application
              </p>
            </div>

            <div className="grid gap-6">
              {/* Version & Description */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Application Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Version</h3>
                    <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                        1.0.0
                      </span>
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      CAN SLIM Crypto Scanner evaluates cryptocurrency projects using William O'Neill's proven investment methodology. Discover high-potential digital assets with AI-powered analysis and real-time market insights.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Key Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "CAN SLIM scoring system for crypto evaluation",
                      "Real-time market analytics and trends",
                      "AI-powered sentiment analysis",
                      "Backtesting engine for strategy validation",
                      "Historical data analysis with technical indicators",
                      "Automatic data updates and alerts",
                      "Export reports in multiple formats (PDF, JSON, CSV)",
                      "Advanced filtering and watchlist management"
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Technology Stack */}
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mt-1">
                      <Code className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-slate-900 dark:text-white">Technology Stack</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Built with <span className="font-medium text-slate-900 dark:text-white">React 19</span>, <span className="font-medium text-slate-900 dark:text-white">TypeScript</span>, <span className="font-medium text-slate-900 dark:text-white">Tailwind CSS</span>, and <span className="font-medium text-slate-900 dark:text-white">tRPC</span>. Powered by advanced LLM models and real-time cryptocurrency data APIs including Polygon.io for historical market data.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
