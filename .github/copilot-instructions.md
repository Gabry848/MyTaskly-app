# MyTaskly AI Coding Guidelines

## 🏗️ Architecture Overview

**MyTaskly** is a React Native task management app with Expo, featuring offline-first architecture, real-time sync, and modern UI patterns.

### Key Architectural Patterns

- **Service Layer**: All business logic in `src/services/` - use existing services like `taskService.ts`, `authService.ts`, `noteService.ts`
- **Singleton Pattern**: Critical services use singleton pattern (TaskCacheService, SyncManager, StorageManager, AppInitializer)
- **Event-Driven**: Custom event emitter (`src/utils/eventEmitter.ts`) for cross-component communication
- **Offline-First**: Optimistic updates with cache-first strategy and background sync

### Navigation Structure
```
Stack Navigator (RootStackParamList)
├── Auth Flow: Login → Register → EmailVerification → VerificationSuccess  
└── Main App: HomeTabs (Bottom Tabs)
    ├── Home (task overview)
    ├── Categories (task categories) 
    ├── Notes (gesture-based notes)
    └── BotChat (disabled)
```

## 🔧 Development Workflows

### Critical Startup Commands
- **NEVER run `npm start`** - Project owner handles server startup
- **NO autonomous EAS builds** - Request from project owner if needed
- Use WSL for Linux/Mac builds: `wsl -d Ubuntu`

### Service Integration Patterns
```typescript
// Always initialize app before using services
const appInitializer = AppInitializer.getInstance();
await appInitializer.initialize();

// Get singleton services  
const cacheService = TaskCacheService.getInstance();
const syncManager = SyncManager.getInstance();
```

### Event System Usage
```typescript
// Emit events for cross-component updates
import { emitTaskAdded, emitTaskUpdated } from '../utils/eventEmitter';

// Listen for events in components
useEffect(() => {
  const handleTaskAdded = (task) => { /* update UI */ };
  eventEmitter.on('TASK_ADDED', handleTaskAdded);
  return () => eventEmitter.off('TASK_ADDED', handleTaskAdded);
}, []);
```

## 📱 Component Patterns

### Screen Structure
- All screens in `src/navigation/screens/` 
- Use `SafeAreaView` and `StatusBar` consistently
- Header pattern: back button + title with specific styling (see GoogleCalendar.tsx)

### State Management
- **Context + Hooks**: Modern notes use `NotesContext.tsx` + `useNotes.ts` hook
- **Optimistic Updates**: UI updates immediately, sync in background
- **Cache-First**: Always check cache before API calls

### Animation Standards
- React Native Reanimated for complex animations
- Haptic feedback for user interactions (`expo-haptics`)
- Physics-based animations for gesture interactions

## 🔐 Authentication & Security

### Token Management
```typescript
// Auto-refresh pattern in authService.ts
const { checkAndRefreshAuth } = await import("../services/authService");
const authResult = await checkAndRefreshAuth();
```

### Google Integration
- Google Sign-In: `@react-native-google-signin/google-signin`
- Firebase integration for push notifications
- Initialize in AppInitializer before app startup

## 🛠️ File Naming & Structure

### Service Files
- Singleton services: PascalCase (TaskCacheService.ts)
- Function-based services: camelCase (authService.ts, taskService.ts)

### Component Organization
```
components/
├── [FeatureName]/          # Feature-specific components
│   ├── index.ts           # Centralized exports
│   └── ComponentName.tsx  # PascalCase components
└── GlobalComponent.tsx     # Shared components at root
```

### Screen Files
- Location: `src/navigation/screens/ScreenName.tsx`
- Export: Default export with screen name
- Navigation: Use typed navigation props from `src/types.d.ts`

## ⚠️ Critical Dependencies

### Required for Core Features
- `@react-native-google-signin/google-signin` - Authentication
- `expo-notifications` - Push notifications  
- `react-native-reanimated` - Animations
- `@react-native-async-storage/async-storage` - Persistent storage

### Avoid These Patterns
- Direct AsyncStorage access (use StorageManager)
- Synchronous operations in UI thread
- Direct API calls without cache layer
- Reading SharedValues during render (use useAnimatedStyle)

## 🐛 Debugging & Maintenance

### Available Debug Tools
- Notification Debug: `src/navigation/screens/NotificationDebug.tsx`
- Cache Debug: Available in components for troubleshooting
- Storage Reports: `StorageManager.getInstance().getStorageReport()`

### Performance Monitoring
- Task cache statistics via `TaskCacheService.getCacheStats()`
- App initialization status via `AppInitializer.getInitializationStatus()`
- Automatic storage cleanup when near limits

## 📚 Key Documentation
Refer to `Docs/` for implementation details:
- `MODERN_NOTES_ARCHITECTURE.md` - Notes system patterns
- `OPTIMIZATION_SUMMARY.md` - Performance optimizations  
- `GOOGLE_SIGNIN_IMPLEMENTATION.md` - Auth integration
- `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Notification setup