/**
 * CAN SLIM Crypto Scanner - Mobile App Configuration
 * React Native with Expo
 */

export const mobileAppConfig = {
  name: "CAN SLIM Scanner",
  slug: "canslim-scanner",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTabletMode: true,
    bundleIdentifier: "com.canslim.scanner",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.canslim.scanner",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-notifications",
      {
        icons: ["./assets/notification-icon.png"],
      },
    ],
  ],
};

// Features
export const features = {
  dashboard: {
    enabled: true,
    description: "Live price ticker and portfolio overview",
  },
  scanner: {
    enabled: true,
    description: "CAN SLIM scoring and asset discovery",
  },
  portfolio: {
    enabled: true,
    description: "Portfolio management and tracking",
  },
  traders: {
    enabled: true,
    description: "Social trading and copy trading",
  },
  settings: {
    enabled: true,
    description: "User preferences and API configuration",
  },
  notifications: {
    enabled: true,
    description: "Push notifications for alerts",
  },
  charts: {
    enabled: true,
    description: "Technical analysis charts",
  },
};

// API Configuration
export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "https://api.example.com",
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// WebSocket Configuration
export const wsConfig = {
  url: process.env.EXPO_PUBLIC_WS_URL || "wss://api.example.com/ws",
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
};

// Storage Configuration
export const storageConfig = {
  namespace: "canslim_scanner",
  version: 1,
  encryption: true,
};

// Notification Configuration
export const notificationConfig = {
  sound: true,
  vibrate: true,
  badge: true,
  channels: {
    price_alerts: {
      name: "Price Alerts",
      importance: 4,
    },
    news_alerts: {
      name: "News Alerts",
      importance: 3,
    },
    trade_alerts: {
      name: "Trade Alerts",
      importance: 4,
    },
  },
};

// Analytics Configuration
export const analyticsConfig = {
  enabled: true,
  trackingId: process.env.EXPO_PUBLIC_ANALYTICS_ID,
  events: {
    APP_OPENED: "app_opened",
    ASSET_VIEWED: "asset_viewed",
    TRADE_COPIED: "trade_copied",
    TRADER_FOLLOWED: "trader_followed",
    ALERT_TRIGGERED: "alert_triggered",
  },
};

// Security Configuration
export const securityConfig = {
  enableBiometrics: true,
  pinRequired: false,
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
  certificatePinning: true,
};

// Performance Configuration
export const performanceConfig = {
  imageOptimization: true,
  cacheStrategy: "network-first",
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  lazyLoadThreshold: 3,
};

// Screens Configuration
export const screensConfig = {
  dashboard: {
    refreshInterval: 10000, // 10 seconds
    maxItems: 10,
  },
  scanner: {
    pageSize: 20,
    debounceDelay: 300,
  },
  portfolio: {
    updateInterval: 30000, // 30 seconds
  },
  traders: {
    pageSize: 10,
    sortOptions: ["rating", "followers", "winRate"],
  },
  settings: {
    sections: ["account", "notifications", "security", "about"],
  },
};

export default mobileAppConfig;
