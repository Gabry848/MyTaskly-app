# Tutorial Screen Integration Examples

This document provides copy-paste ready examples for integrating the tutorial into each screen.

---

## 📱 Home Screen (Chat Feature)

**Target Element:** Chat input or voice button

```typescript
// In src/navigation/screens/Home.tsx

import { useTutorialElement } from '../../hooks/useTutorialElement';

export default function HomeScreen() {
  // Register the chat input for tutorial
  const chatInputRef = useTutorialElement('chatInput');

  return (
    <View style={styles.container}>
      {/* ... other components ... */}

      {/* Method 1: If you have a TextInput */}
      <TextInput
        ref={chatInputRef}
        style={styles.textInput}
        placeholder="Scrivi un messaggio..."
        // ... other props
      />

      {/* OR Method 2: If you want to highlight the whole input container */}
      <View ref={chatInputRef} style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Scrivi un messaggio..."
          // ... other props
        />
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 📂 Categories Screen (Category List)

**Target Element:** First category or category list container

```typescript
// In src/navigation/screens/Categories.tsx

import { useTutorialElement } from '../../hooks/useTutorialElement';

export default function CategoriesScreen() {
  // Register the category list for tutorial
  const categoryListRef = useTutorialElement('categoryList');

  return (
    <View style={styles.container}>
      {/* ... other components ... */}

      {/* Method 1: Wrap the entire list */}
      <View ref={categoryListRef} style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          // ... other props
        />
      </View>

      {/* OR Method 2: Highlight first category card */}
      {/* In renderCategoryItem function */}
      <Pressable
        ref={index === 0 ? categoryListRef : null}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        onLongPress={() => handleCategoryLongPress(item)}
      >
        <Text>{item.name}</Text>
      </Pressable>
    </View>
  );
}
```

---

## ✅ Task List Screen (Task Item)

**Target Element:** First task in the list

```typescript
// In src/navigation/screens/TaskList.tsx

import { useTutorialElement } from '../../hooks/useTutorialElement';

export default function TaskListScreen() {
  // Register the first task for tutorial
  const taskItemRef = useTutorialElement('taskItem');

  const renderTaskItem = ({ item, index }) => {
    // Only apply ref to the first task
    const ref = index === 0 ? taskItemRef : null;

    return (
      <Pressable
        ref={ref}
        style={styles.taskItem}
        onPress={() => handleTaskToggle(item)}
        onLongPress={() => handleTaskLongPress(item)}
      >
        <View style={styles.taskContent}>
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={24}
          />
          <Text style={styles.taskText}>{item.title}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        // ... other props
      />
    </View>
  );
}
```

---

## 🎨 Notes/Whiteboard Screen

**Target Element:** Canvas or FAB button

```typescript
// In src/navigation/screens/Notes.tsx

import { useTutorialElement } from '../../hooks/useTutorialElement';

export default function NotesScreen() {
  // Register the whiteboard for tutorial
  const whiteboardRef = useTutorialElement('whiteboard');

  return (
    <View style={styles.container}>
      {/* ... other components ... */}

      {/* Method 1: Highlight the canvas/whiteboard */}
      <View ref={whiteboardRef} style={styles.canvasContainer}>
        {/* Your canvas/drawing component */}
      </View>

      {/* OR Method 2: Highlight the FAB button to add notes */}
      <TouchableOpacity
        ref={whiteboardRef}
        style={styles.fab}
        onPress={handleAddNote}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
```

---

## 📅 Calendar Screen

**Target Element:** Calendar component

```typescript
// In src/navigation/screens/Calendar.tsx

import { useTutorialElement } from '../../hooks/useTutorialElement';

export default function CalendarScreen() {
  // Register the calendar for tutorial
  const calendarRef = useTutorialElement('calendar');

  return (
    <View style={styles.container}>
      {/* ... other components ... */}

      {/* Wrap your calendar component */}
      <View ref={calendarRef} style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          // ... other props
        />
      </View>
    </View>
  );
}
```

---

## ⚙️ Settings Screen (Review Tutorial)

**Add "Rivedi Tutorial" Option**

```typescript
// In src/navigation/screens/Settings.tsx

import { useTutorialContext } from '../../contexts/TutorialContext';

export default function SettingsScreen() {
  const { startTutorial } = useTutorialContext();

  return (
    <ScrollView style={styles.container}>
      {/* ... other settings ... */}

      {/* Tutorial Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aiuto</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={startTutorial}
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 72,
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

---

## 🔧 Alternative: Using Context Directly

If you don't want to use the `useTutorialElement` hook:

```typescript
import { useRef, useEffect } from 'react';
import { useTutorialContext } from '../contexts/TutorialContext';

export default function YourScreen() {
  const { registerElementRef } = useTutorialContext();
  const elementRef = useRef(null);

  useEffect(() => {
    registerElementRef('yourElementKey', elementRef);
  }, [registerElementRef]);

  return (
    <View ref={elementRef}>
      {/* Your content */}
    </View>
  );
}
```

---

## 📝 Element Keys Reference

Make sure to use these exact keys when registering elements:

| Screen | Element Key | Description |
|--------|-------------|-------------|
| Home | `chatInput` | Text input or voice button |
| Categories | `categoryList` | Category list or first category |
| TaskList | `taskItem` | First task in the list |
| Notes | `whiteboard` | Canvas or FAB button |
| Calendar | `calendar` | Calendar component |

---

## ✅ Testing Checklist

After implementing in each screen:

1. **Clear tutorial status**
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { TUTORIAL_STORAGE_KEY } from '../constants/tutorialContent';

   await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
   ```

2. **Restart app** - Tutorial should auto-start

3. **Verify each step:**
   - [ ] Welcome screen appears
   - [ ] Step 2: Home screen + chat input spotlight
   - [ ] Step 3: Categories screen + category list spotlight
   - [ ] Step 4: Task item spotlight
   - [ ] Step 5: Notes screen + whiteboard spotlight
   - [ ] Step 6: Calendar screen + calendar spotlight
   - [ ] Step 7: Completion screen appears

4. **Test interactions:**
   - [ ] Next button navigates forward
   - [ ] Back button navigates backward
   - [ ] Skip button exits tutorial
   - [ ] Progress dots update correctly
   - [ ] "Rivedi Tutorial" works in Settings

5. **Test edge cases:**
   - [ ] What if element isn't rendered?
   - [ ] What if user navigates away during tutorial?
   - [ ] What if screen is in different state?

---

## 🚨 Common Issues & Solutions

### Issue: Spotlight not appearing
**Solution:** Make sure the element ref is attached to a rendered View/component with non-zero dimensions.

### Issue: Spotlight in wrong position
**Solution:** The ref should be on the actual element you want to highlight, not a parent container too far away.

### Issue: Tutorial starts every time
**Solution:** Check AsyncStorage - tutorial completion status might not be saving correctly.

### Issue: Navigation not working during tutorial
**Solution:** Ensure navigation prop is passed to TutorialManager and screen names match exactly.

---

## 💡 Pro Tips

1. **Test early:** Add refs incrementally and test each screen
2. **Visual feedback:** Elements should be visible and have proper dimensions
3. **Timing:** If an element loads async, ensure it's rendered before tutorial shows
4. **Fallbacks:** The system handles missing refs gracefully, but it's better to have them
5. **User experience:** Consider the user's journey - does the tutorial flow make sense?

---

**Ready to implement!** Start with the Home screen and work your way through each screen. The tutorial system is fully functional and waiting for element registration.
