# MyTaskly Tutorial System - Integration Guide

This document provides instructions for integrating the onboarding tutorial system into various parts of the MyTaskly app.

## Overview

The tutorial system has been implemented with the following components:
- **TutorialManager**: Main component that orchestrates the tutorial flow
- **TutorialProvider**: Context provider for managing tutorial state globally
- **Tutorial Components**: WelcomeScreen, CompletionScreen, TutorialOverlay, TooltipCard, NavigationControls, ProgressIndicator
- **useTutorial Hook**: Custom hook for managing tutorial logic and navigation

## Current Implementation

The tutorial is currently configured to:
1. **Auto-start** on first app launch (for users who haven't completed it)
2. Display 7 steps: Welcome → Chat → Categories → Tasks → Whiteboard → Calendar → Completion
3. Store completion status in AsyncStorage (`@mytaskly:tutorial_completed`)

## How to Add "Review Tutorial" to Settings

To allow users to review the tutorial from the Settings screen, follow these steps:

### Step 1: Import Required Dependencies

In `src/navigation/screens/Settings.tsx`, add these imports:

```typescript
import { useTutorialContext } from '../../contexts/TutorialContext';
```

### Step 2: Use the Tutorial Context

Inside your Settings component:

```typescript
export default function SettingsScreen() {
  const { startTutorial } = useTutorialContext();

  // ... rest of your component code
}
```

### Step 3: Add a "Review Tutorial" Option

Add a new settings option in your settings list:

```typescript
<TouchableOpacity
  style={styles.settingItem}
  onPress={() => {
    startTutorial();
  }}
  accessibilityRole="button"
  accessibilityLabel="Rivedi tutorial"
  accessibilityHint="Apri nuovamente il tutorial guidato dell'app"
>
  <View style={styles.settingContent}>
    <Ionicons name="school-outline" size={24} color="#000000" />
    <View style={styles.settingTextContainer}>
      <Text style={styles.settingTitle}>Rivedi Tutorial</Text>
      <Text style={styles.settingDescription}>
        Visualizza nuovamente il tour guidato dell'app
      </Text>
    </View>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#999999" />
</TouchableOpacity>
```

### Step 4: Add Styles (if needed)

Ensure you have the necessary styles in your StyleSheet:

```typescript
const styles = StyleSheet.create({
  // ... existing styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    fontFamily: 'System',
  },
});
```

## How to Register Elements for Spotlight

To make an element targetable by the tutorial spotlight, you need to register it with a ref.

### In Your Screen Component

```typescript
import { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { useTutorialContext } from '../../contexts/TutorialContext';

export default function YourScreen() {
  const { registerElementRef } = useTutorialContext();
  const targetElementRef = useRef(null);

  useEffect(() => {
    // Register this element with the tutorial system
    registerElementRef('yourElementKey', targetElementRef);
  }, [registerElementRef]);

  return (
    <View ref={targetElementRef}>
      {/* Your element content */}
    </View>
  );
}
```

### Element Keys Used in Tutorial

The tutorial expects the following element refs to be registered:

1. **chatInput** - Home screen text input or voice button
2. **categoryList** - Categories screen list/grid
3. **taskItem** - First task item in a category
4. **whiteboard** - Notes/Whiteboard canvas or FAB button
5. **calendar** - Calendar component

## Modifying Tutorial Steps

To modify tutorial steps, edit `src/constants/tutorialContent.ts`:

```typescript
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    type: 'welcome',
    content: {
      title: 'Your Title',
      description: 'Your Description',
    },
  },
  {
    id: 2,
    type: 'spotlight',
    targetScreen: 'Home',
    targetElement: 'chatInput',
    content: {
      title: 'Step Title',
      description: 'Step Description',
      icon: 'icon-name',
    },
  },
  // ... more steps
];
```

## Tutorial Flow

```
1. Welcome Screen
   ↓ (User clicks "Inizia il Tour")
2. Navigate to Home → Spotlight on Chat Input
   ↓
3. Navigate to Categories → Spotlight on Category List
   ↓
4. Stay on Categories → Spotlight on Task Item
   ↓
5. Navigate to Notes → Spotlight on Whiteboard
   ↓
6. Navigate to Calendar → Spotlight on Calendar
   ↓
7. Completion Screen
   ↓
   - "Inizia Ora" → Complete and go to Home
   - "Rivedi Tutorial" → Restart from step 1
```

## Disabling Auto-Start

To disable auto-start and require manual triggering:

In `src/navigation/index.tsx`, change:

```typescript
<TutorialManager navigation={navigation} autoStart={true} />
```

to:

```typescript
<TutorialManager navigation={navigation} autoStart={false} />
```

Then trigger manually via:
```typescript
const { startTutorial } = useTutorialContext();
startTutorial();
```

## Reset Tutorial Status

To reset the tutorial (for testing or allowing users to see it again):

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TUTORIAL_STORAGE_KEY } from '../constants/tutorialContent';

await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
```

## Troubleshooting

### Spotlight Not Appearing
- Ensure the target element has been registered with `registerElementRef`
- Check that the element key matches the one in `TUTORIAL_STEPS`
- Verify the element is rendered and has non-zero dimensions

### Navigation Not Working
- Check that the target screen name matches exactly (case-sensitive)
- Ensure navigation prop is passed correctly to TutorialManager
- Look for navigation errors in console logs

### Tutorial Not Auto-Starting
- Check AsyncStorage to see if tutorial was already completed
- Verify `autoStart={true}` is set in TutorialManager
- Check that user is authenticated and on HomeTabs

## Files Structure

```
src/
├── components/
│   └── Tutorial/
│       ├── index.tsx              # Main TutorialManager
│       ├── TutorialOverlay.tsx    # Overlay with spotlight
│       ├── TooltipCard.tsx        # Instruction card
│       ├── NavigationControls.tsx # Next/Back/Skip buttons
│       ├── ProgressIndicator.tsx  # Step dots
│       ├── WelcomeScreen.tsx      # First screen
│       ├── CompletionScreen.tsx   # Final screen
│       └── styles.ts              # StyleSheet
├── constants/
│   └── tutorialContent.ts         # Content & configuration
├── contexts/
│   └── TutorialContext.tsx        # Global state provider
├── hooks/
│   └── useTutorial.ts             # Tutorial logic hook
└── navigation/
    └── index.tsx                  # Integration point
```

## API Reference

### useTutorialContext Hook

```typescript
const {
  isTutorialVisible,    // boolean
  shouldAutoStart,      // boolean
  startTutorial,        // () => void
  closeTutorial,        // () => void
  registerElementRef,   // (key: string, ref: any) => void
  getElementRef,        // (key: string) => any
} = useTutorialContext();
```

### TutorialManager Props

```typescript
interface TutorialManagerProps {
  navigation: NavigationProp<RootStackParamList> | NavigationProp<TabParamList>;
  onComplete?: () => void;
  autoStart?: boolean;
}
```

## Best Practices

1. **Register refs on mount**: Use `useEffect` to register element refs when component mounts
2. **Use unique keys**: Ensure each element has a unique identifier
3. **Test on both platforms**: Verify spotlight positioning on iOS and Android
4. **Handle edge cases**: Consider what happens if an element isn't rendered
5. **Keep content concise**: Tutorial descriptions should be brief and clear
6. **Use appropriate icons**: Choose Ionicons that match the feature being highlighted
7. **Test navigation flow**: Ensure all screens load correctly during tutorial

## Support

For issues or questions about the tutorial system, check:
- Console logs for `[TUTORIAL]` prefixed messages
- AsyncStorage value for `@mytaskly:tutorial_completed`
- Element measurements in TutorialOverlay component
