# Calendar Widget Demo

## Overview
This is a demo screen that showcases the concept of an interactive calendar widget that can be used alongside both text and voice chat interactions with the AI bot.

## Features

### 1. **Dual Mode Interface**
- **Text Chat Mode**: Traditional chat interface with message bubbles
- **Voice Chat Mode**: Voice interaction with real-time transcription and waveform visualization

### 2. **Calendar Modal Widget**
- Opens as a sliding modal from the bottom
- Shows all tasks with color-coded dots on their respective dates
- Interactive task list below the calendar
- Can be opened via calendar icon in both text and voice modes
- Semi-transparent overlay for better focus

### 3. **Interactive Task Widgets in Chat**
- Bot messages can include **clickable task cards**
- Shows task action (created/moved/updated) with icons
- Displays task title and date
- Tapping opens calendar modal with task selected
- Visual footer: "Tocca per modificare nel calendario"

### 4. **Bot-Modified Highlights**
- Tasks modified by bot have **"Bot" badge** with sparkle icon
- Calendar dates modified by bot are **visually marked**
- Selected task has black background with white text
- "Deseleziona" button appears when task is selected

### 5. **Task Management**
- View all tasks with their dates
- Check/uncheck tasks to mark as complete
- Select tasks by tapping (highlights in black)
- Move tasks to different dates (demo functionality)
- Visual indication of completed vs pending tasks

### 6. **Attach Task Feature**
- **Attach button** (📎) in text input to attach tasks to messages
- Opens calendar modal for task selection
- Allows sharing specific tasks in conversation context

### 7. **Focus Mode (Voice Only) - Con Animazioni**
- **Full-screen calendar** con animazione scale + fade-in
- **Floating bot avatar** animato in bottom-right corner
- **Bot States Animati**:
  - 🧠 **Thinking**: Avatar blu, icona lampadina, 3 pallini che saltano
  - 💬 **Speaking**: Avatar grigio scuro, pulsa, 3 pallini sotto
  - ⚫ **Idle**: Avatar nero, icona chat
- **Task movement animation** fluida con bezier curves
- **Task card animation** con spring physics
- **Horizontal scrollable task list** con shadows e badges
- **Exit button** con smooth transition
- Activate with expand icon (⛶) in voice controls

### 8. **Use Cases Demonstrated**
- User asks bot to organize their schedule
- Bot creates/moves tasks and shows interactive cards in chat
- User can tap task cards to open calendar and modify them
- Calendar highlights bot-modified dates
- User can attach tasks to messages via attach button
- Voice mode: activate focus mode for hands-free calendar interaction
- Bot speaks and animates task movements in real-time
- User and bot can collaboratively organize tasks
- Works seamlessly in both text and voice modes

## How to Access

1. Navigate to **Settings** screen
2. Scroll down to **Development** section
3. Tap on **"Calendar Widget Demo"**

## Demo Data

The demo includes fake messages showing a typical conversation:
1. User asks to organize weekly tasks
2. Bot opens the calendar widget
3. User requests to move meeting to tomorrow
4. **Bot shows interactive task card** for moved "Riunione team"
5. User asks to add dinner with friends on Jan 2
6. **Bot shows interactive task card** for newly created task

Demo tasks included:
- **Riunione team** (Team meeting) - Modified by bot ✨
- Palestra (Gym)
- Appuntamento medico (Doctor appointment)
- **Compleanno Maria** (Maria's birthday) - Modified by bot ✨

Tasks with ✨ are marked as bot-modified and have special highlighting.

## Technical Implementation

### Key Components
- `react-native-calendars` for the calendar view with custom theming
- **Modal system** for calendar widget (slides from bottom)
- **Interactive task widgets** embedded in bot messages
- **Bot-modified tracking** with visual indicators
- **Task selection system** with highlight state
- **Attach button** for sharing tasks in conversation
- **Focus Mode** with full-screen calendar and floating bot
- **Animation system** for task movements and bot speaking
- Mode toggle between text and voice chat
- Task state management with selection and modification tracking

### File Location
`src/navigation/screens/CalendarWidgetDemo.tsx`

## Purpose

This demo helps visualize and test the concept of having an interactive widget (calendar) that:
1. Can be triggered by the chatbot based on conversation context
2. Stays visible and interactive during the conversation
3. Allows collaborative organization between user and bot
4. Works in both text and voice interaction modes

## Next Steps

If this concept proves useful, it can be extended to:
- Real task data integration
- Actual drag-and-drop functionality for moving tasks
- Bot commands to automatically organize tasks on the calendar
- Multiple widget types (not just calendar)
- Widget suggestions based on conversation context
