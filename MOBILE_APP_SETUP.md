# CAN SLIM Crypto Scanner - Mobile App (React Native)

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Xcode (for iOS) or Android Studio (for Android)
- EAS CLI: `npm install -g eas-cli`

### Project Structure
```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── scanner.tsx
│   │   ├── portfolio.tsx
│   │   ├── traders.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── PriceCard.tsx
│   ├── AssetList.tsx
│   ├── TraderCard.tsx
│   └── PortfolioChart.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useTRPC.ts
│   └── useWebSocket.ts
├── contexts/
│   └── AuthContext.tsx
├── app.json
├── package.json
└── tsconfig.json
```

### Installation Steps

1. **Initialize Expo Project**
   ```bash
   cd /home/ubuntu/canslim_crypto_scanner
   npx create-expo-app@latest mobile --template
   cd mobile
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm install @react-navigation/native @react-navigation/bottom-tabs
   npm install react-native-screens react-native-safe-area-context
   npm install @react-native-async-storage/async-storage
   npm install @react-native-community/netinfo
   npm install expo-notifications
   npm install expo-camera
   npm install chart.js react-native-chart-kit
   npm install trpc-react-native @trpc/client @trpc/server
   npm install zustand
   npm install typescript @types/react-native
   ```

3. **Configure TypeScript**
   ```bash
   npx tsc --init
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

### Key Features

#### 1. Dashboard Tab
- Live price ticker for BTC, ETH, SOL
- Portfolio value and performance
- Market trend indicator
- Quick action buttons

#### 2. Scanner Tab
- CAN SLIM score filtering
- Asset search and sorting
- Real-time price updates
- Add to watchlist

#### 3. Portfolio Tab
- Holdings overview
- Asset allocation chart
- Performance metrics
- Trade history

#### 4. Traders Tab
- Top traders leaderboard
- Follow/unfollow traders
- Copy trades functionality
- Trader statistics

#### 5. Settings Tab
- API key management
- Notification preferences
- Theme selection
- Account settings

### Authentication

Uses OAuth flow from web app:
- Redirect to web login
- Store JWT token in AsyncStorage
- Auto-refresh on app start
- Logout clears token

### Push Notifications

```typescript
import * as Notifications from 'expo-notifications';

// Request permission
const { status } = await Notifications.requestPermissionsAsync();

// Handle notifications
Notifications.addNotificationResponseListener(response => {
  // Handle notification tap
});
```

### WebSocket Integration

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { prices, connected } = useWebSocket('wss://api.example.com/prices');
```

### Building for Production

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

#### Submit to App Store
```bash
eas submit --platform ios
```

### Testing

```bash
npm test
```

### Troubleshooting

1. **Metro bundler issues**: Clear cache with `npm start -- --clear`
2. **iOS build fails**: Run `cd ios && pod install && cd ..`
3. **Android build fails**: Update Android SDK and Gradle
4. **WebSocket connection issues**: Check firewall and CORS settings

### Performance Optimization

- Use React.memo for expensive components
- Implement lazy loading for lists
- Cache API responses with AsyncStorage
- Use FlatList instead of ScrollView for long lists
- Optimize image sizes for mobile

### Security

- Never store API keys in code
- Use environment variables via .env file
- Implement certificate pinning for API calls
- Validate all user inputs
- Use HTTPS only

### Next Steps

1. Set up CI/CD pipeline with EAS
2. Implement analytics tracking
3. Add crash reporting (Sentry)
4. Set up beta testing (TestFlight/Google Play Beta)
5. Prepare app store listings

## References

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction)
- [tRPC React Native](https://trpc.io/docs/client/react-native)
