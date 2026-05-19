# Mobile App Structure - React Native with Expo

## Project Layout

```
mobile/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation layout
│   │   ├── dashboard.tsx        # Dashboard screen
│   │   ├── scanner.tsx          # Scanner screen
│   │   ├── portfolio.tsx        # Portfolio screen
│   │   ├── traders.tsx          # Traders screen
│   │   └── settings.tsx         # Settings screen
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home screen
│   └── auth/
│       ├── login.tsx            # Login screen
│       └── oauth-callback.tsx   # OAuth callback handler
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   ├── dashboard/
│   │   ├── PriceCard.tsx        # Single asset price card
│   │   ├── PriceTicker.tsx      # Live price ticker
│   │   ├── PortfolioCard.tsx    # Portfolio overview
│   │   └── MarketTrend.tsx      # Market trend indicator
│   ├── scanner/
│   │   ├── AssetList.tsx        # Asset list component
│   │   ├── FilterBar.tsx        # Filter controls
│   │   ├── AssetCard.tsx        # Single asset card
│   │   └── SearchBar.tsx        # Search component
│   ├── portfolio/
│   │   ├── HoldingsList.tsx     # Holdings list
│   │   ├── AllocationChart.tsx  # Pie chart
│   │   ├── PerformanceChart.tsx # Performance chart
│   │   └── TradeHistory.tsx     # Trade history
│   ├── traders/
│   │   ├── TraderCard.tsx       # Trader profile card
│   │   ├── TraderList.tsx       # List of traders
│   │   ├── CopiedTradesList.tsx # Copied trades
│   │   └── TraderStats.tsx      # Trader statistics
│   └── settings/
│       ├── ApiKeyForm.tsx       # API key input
│       ├── NotificationSettings.tsx
│       ├── SecuritySettings.tsx
│       └── ThemeSelector.tsx
├── hooks/
│   ├── useAuth.ts               # Authentication hook
│   ├── useTRPC.ts               # tRPC client hook
│   ├── useWebSocket.ts          # WebSocket connection
│   ├── usePushNotifications.ts  # Push notifications
│   ├── useStorage.ts            # AsyncStorage wrapper
│   ├── useNetworkStatus.ts      # Network connectivity
│   └── useTheme.ts              # Theme management
├── contexts/
│   ├── AuthContext.tsx          # Auth state
│   ├── ThemeContext.tsx         # Theme state
│   └── NotificationContext.tsx  # Notification state
├── services/
│   ├── api.ts                   # API client setup
│   ├── storage.ts               # Storage service
│   ├── notifications.ts         # Notification service
│   ├── websocket.ts             # WebSocket service
│   └── analytics.ts             # Analytics service
├── utils/
│   ├── formatting.ts            # Number/currency formatting
│   ├── validation.ts            # Input validation
│   ├── constants.ts             # App constants
│   ├── colors.ts                # Color palette
│   └── helpers.ts               # Utility functions
├── types/
│   ├── index.ts                 # Type definitions
│   ├── api.ts                   # API types
│   └── models.ts                # Data models
├── assets/
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   ├── notification-icon.png
│   └── favicon.png
├── app.json                     # Expo config
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Key Components

### Dashboard Screen
- Live price ticker (BTC, ETH, SOL, etc.)
- Portfolio value and 24h change
- Market trend indicator
- Quick action buttons (Buy, Sell, Trade)
- Recent transactions

### Scanner Screen
- CAN SLIM score filter
- Asset list with sorting
- Search functionality
- Real-time price updates
- Add to watchlist button
- Asset detail modal

### Portfolio Screen
- Holdings overview
- Asset allocation pie chart
- Performance line chart
- Portfolio statistics (ROI, Sharpe ratio)
- Trade history
- Export functionality

### Traders Screen
- Top traders leaderboard
- Trader profile cards
- Follow/unfollow buttons
- Copy trades functionality
- Copied trades history
- Trader statistics

### Settings Screen
- Account information
- API key management
- Notification preferences
- Security settings (biometrics, PIN)
- Theme selection (dark/light)
- About and help

## State Management

Using Zustand for global state:

```typescript
// stores/authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}));

// stores/priceStore.ts
export const usePriceStore = create((set) => ({
  prices: {},
  updatePrice: (symbol, price) => set((state) => ({
    prices: { ...state.prices, [symbol]: price },
  })),
}));
```

## API Integration

Using tRPC client for type-safe API calls:

```typescript
import { trpc } from '@/services/api';

// In components
const { data: assets } = trpc.scanner.getAssets.useQuery();
const copyTrade = trpc.socialTrading.copyTrade.useMutation();
```

## Real-time Updates

WebSocket connection for live prices:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { prices, connected } = useWebSocket();
```

## Notifications

Push notifications for alerts:

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

const { requestPermission, sendNotification } = usePushNotifications();
```

## Storage

AsyncStorage for persistent data:

```typescript
import { useStorage } from '@/hooks/useStorage';

const { getItem, setItem } = useStorage();
```

## Navigation Structure

```
Root
├── (auth)
│   ├── login
│   └── oauth-callback
├── (tabs)
│   ├── dashboard
│   ├── scanner
│   ├── portfolio
│   ├── traders
│   └── settings
└── modals
    ├── asset-detail
    └── trade-detail
```

## Performance Optimization

1. **Code Splitting**: Use dynamic imports for screens
2. **Image Optimization**: Compress and resize images
3. **List Optimization**: Use FlatList with keyExtractor
4. **Memoization**: Use React.memo for expensive components
5. **Lazy Loading**: Load data on demand
6. **Caching**: Cache API responses

## Security

1. **Token Storage**: Secure storage with encryption
2. **Certificate Pinning**: Validate SSL certificates
3. **Input Validation**: Validate all user inputs
4. **API Key Protection**: Never expose API keys
5. **Biometric Auth**: Optional fingerprint/face recognition

## Testing Strategy

```
tests/
├── unit/
│   ├── hooks/
│   ├── utils/
│   └── services/
├── integration/
│   ├── screens/
│   └── navigation/
└── e2e/
    ├── auth.e2e.ts
    ├── dashboard.e2e.ts
    └── trading.e2e.ts
```

## Build & Deployment

### Development
```bash
npm start
```

### Staging
```bash
eas build --platform ios --profile staging
eas build --platform android --profile staging
```

### Production
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --latest
eas submit --platform android --latest
```

## Environment Variables

```
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_WS_URL=wss://api.example.com/ws
EXPO_PUBLIC_ANALYTICS_ID=tracking-id
```

## Dependencies

### Core
- expo
- react-native
- react-native-screens
- react-native-safe-area-context

### Navigation
- @react-navigation/native
- @react-navigation/bottom-tabs

### State Management
- zustand

### API
- @trpc/client
- @trpc/react-native

### UI
- react-native-chart-kit
- react-native-gesture-handler

### Storage
- @react-native-async-storage/async-storage

### Notifications
- expo-notifications

### Analytics
- expo-analytics

### Development
- typescript
- @types/react-native
- eslint
- prettier

## Next Steps

1. Initialize Expo project
2. Set up navigation structure
3. Create base components
4. Implement authentication
5. Build dashboard screen
6. Add real-time updates
7. Implement trading features
8. Add notifications
9. Set up CI/CD
10. Deploy to app stores
