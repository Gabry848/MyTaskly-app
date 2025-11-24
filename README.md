<div align="center">

<!-- Add your logo here -->
<img src="./assets/icons/ios-dark.png" alt="MyTaskly Logo" width="200"/>

# MyTaskly

### The Intelligent Task Management App with AI-Powered Voice Assistant

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Gabry848/MyTaskly-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE.md)
[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/Gabry848)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [Contributing](#contributing) • [License](#license)

</div>

---

## 🎯 About

**MyTaskly** is a next-generation task management application that combines the simplicity of traditional to-do apps with the power of artificial intelligence. Built entirely by a 16-year-old developer over 11+ months, this app showcases what passion and dedication can achieve.

With MyTaskly, you don't just organize your tasks—you have an intelligent AI assistant that helps you stay productive through natural conversations, voice commands, and smart suggestions.

<!-- Add demo video here -->
### 📹 Demo

> **[Add your demo video here]**
>
> A video demonstration showing the main features of MyTaskly in action.

---

## ✨ Features

### 🤖 AI-Powered Assistant
- **Intelligent Chat Interface**: Natural language conversations with an AI assistant that understands your tasks
- **Voice Chat**: Hands-free interaction with advanced Voice Activity Detection (VAD)
- **Smart Suggestions**: Get contextual recommendations based on your tasks and habits
- **Real-time Streaming**: Fast, responsive AI responses powered by modern LLM technology

### 📝 Advanced Task Management
- **Rich Task Editor**: Create detailed tasks with descriptions, due dates, and priorities
- **Category Organization**: Organize tasks into customizable categories with color coding
- **Shared Categories**: Collaborate by sharing categories and tasks with other users
- **Permission System**: Fine-grained control over who can view, edit, or delete tasks
- **Task Templates**: Quickly create recurring tasks with predefined templates

### 📅 Calendar Integration
- **Built-in Calendar**: Visualize your tasks in a beautiful calendar view
- **Google Calendar Sync**: Seamless two-way synchronization with your Google Calendar
- **Smart Scheduling**: AI-assisted task scheduling and time management

### 🔔 Smart Notifications
- **Push Notifications**: Never miss a deadline with timely reminders
- **Customizable Alerts**: Configure notification preferences for different task types
- **Cross-device Sync**: Get notifications on all your devices

### 🎨 Beautiful UI/UX
- **Minimalist Design**: Clean, modern interface with white/grey/black color palette
- **Dark Mode**: Full support for light and dark themes
- **Smooth Animations**: Polished interactions with React Native Reanimated
- **Edge-to-Edge Display**: Immersive full-screen experience on modern devices
- **Responsive Design**: Optimized for phones, tablets, and web

### 🔐 Secure Authentication
- **Google Sign-In**: Fast and secure authentication with your Google account
- **Account Management**: Change username, email, and password with ease
- **Privacy First**: Your data is encrypted and securely stored

### 🎓 Interactive Tutorial
- **Guided Onboarding**: Step-by-step tutorial for new users
- **Contextual Help**: Learn features as you use them
- **Progress Tracking**: Visual indicators showing tutorial completion

### 🌐 Multi-Platform Support
- **iOS**: Native iOS app with platform-specific optimizations
- **Android**: Smooth Android experience with Material Design principles
- **Web**: Progressive Web App (PWA) support for desktop access

---

## 🖼️ Screenshots

<div align="center">

<!-- Add your screenshots here -->
<table>
  <tr>
    <td><img src="./assets/readme/screenshot-1.png" alt="Home Screen" width="250"/></td>
    <td><img src="./assets/readme/screenshot-2.png" alt="Task List" width="250"/></td>
    <td><img src="./assets/readme/screenshot-3.png" alt="AI Chat" width="250"/></td>
  </tr>
  <tr>
    <td align="center"><b>AI Assistant</b></td>
    <td align="center"><b>Task Management</b></td>
    <td align="center"><b>Voice Chat</b></td>
  </tr>
  <tr>
    <td><img src="./assets/readme/screenshot-4.png" alt="Calendar" width="250"/></td>
    <td><img src="./assets/readme/screenshot-5.png" alt="Categories" width="250"/></td>
    <td><img src="./assets/readme/screenshot-6.png" alt="Settings" width="250"/></td>
  </tr>
  <tr>
    <td align="center"><b>Calendar View</b></td>
    <td align="center"><b>Category Management</b></td>
    <td align="center"><b>Settings</b></td>
  </tr>
</table>

</div>

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Git**

For mobile development:
- **iOS**: macOS with Xcode 14+
- **Android**: Android Studio with SDK 33+

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Gabry848/MyTaskly-app.git
cd MyTaskly-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# API Keys (replace with your own)
API_KEY=your_api_key_here

# Backend URL
API_URL=your_backend_url_here

# Google OAuth (optional for Google Sign-In)
GOOGLE_WEB_CLIENT_ID=your_google_client_id_here
```

4. **Setup Google Services** (for Firebase and Google Sign-In)

- Place your `google-services.json` in the root directory (Android)
- Configure your `GoogleService-Info.plist` for iOS (if needed)

### Running the App

#### Development Mode

```bash
# Start the Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

#### Production Build

```bash
# Build for iOS (requires macOS)
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

For more details on building, see the [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/).

---

## 📖 Usage

### Basic Task Management

1. **Create a Task**: Tap the "+" button on the home screen
2. **Set Details**: Add a title, description, due date, and category
3. **Save**: Your task is automatically synced to the cloud

### Using the AI Assistant

1. **Start a Chat**: Go to the Home tab
2. **Type or Speak**: Ask questions or give commands naturally
   - "Show me today's tasks"
   - "Create a task to buy groceries tomorrow"
   - "What should I focus on this week?"
3. **Voice Mode**: Tap the microphone icon for hands-free interaction

### Sharing Categories

1. **Open a Category**: Select the category you want to share
2. **Tap Share**: Use the share button
3. **Invite Users**: Enter email addresses or usernames
4. **Set Permissions**: Choose view-only or edit access

### Calendar Integration

1. **Connect Google Calendar**: Go to Settings → Google Calendar
2. **Authorize**: Sign in with your Google account
3. **Sync**: Your tasks will automatically appear in Google Calendar

---

## 🏗️ Architecture

MyTaskly is built with modern React Native architecture:

```
MyTaskly-app/
├── src/
│   ├── components/         # Reusable UI components
│   ├── navigation/         # Navigation structure and screens
│   │   └── screens/        # Main app screens
│   ├── services/           # API clients and business logic
│   ├── contexts/           # React Context providers
│   ├── constants/          # App constants and configurations
│   └── utils/              # Helper functions and utilities
├── assets/                 # Images, fonts, and other static assets
├── app.json                # Expo configuration
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

### Key Technologies

- **Frontend**: React Native 0.79, TypeScript
- **Navigation**: React Navigation 7
- **State Management**: React Context API + Async Storage
- **UI Components**: Custom components with React Native Reanimated
- **AI Integration**: Custom streaming LLM client
- **Audio**: Expo AV with custom Voice Activity Detection
- **Authentication**: Google Sign-In (@react-native-google-signin)
- **Notifications**: Expo Notifications
- **Calendar**: React Native Calendar + Google Calendar API
- **Data Sync**: Custom sync manager with offline support
- **Build Tool**: Expo EAS Build

---

## 🤝 Contributing

We love contributions! MyTaskly is an open-source project, and we welcome contributions from developers of all skill levels.

Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on:
- Code of Conduct
- Development workflow
- How to submit pull requests
- Coding standards and best practices

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes and version history.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE.md](./LICENSE.md) file for details.

The MIT License allows you to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

---

## 🌟 Support the Project

If you find MyTaskly helpful, consider:

- ⭐ **Starring the repository** on GitHub
- 🐛 **Reporting bugs** and requesting features
- 🔀 **Contributing code** or documentation
- 💬 **Sharing** with friends and colleagues
- ☕ **Supporting the developer** (links coming soon!)

---

## 👨‍💻 About the Developer

MyTaskly was created by **Gabriel** ([@Gabry848](https://github.com/Gabry848)), a 16-year-old developer passionate about creating tools that help people be more productive. This project represents over **11 months** of learning, coding, debugging, and iterating.

> "I built MyTaskly because I wanted to create something that would genuinely help people stay organized while showcasing the possibilities of combining AI with traditional productivity tools." - Gabriel

### Contact & Links

- **GitHub**: [@Gabry848](https://github.com/Gabry848)
- **Project Repository**: [MyTaskly-app](https://github.com/Gabry848/MyTaskly-app)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/Gabry848/MyTaskly-app/issues)

---

## 🙏 Acknowledgments

Special thanks to:

- The **React Native** and **Expo** teams for amazing frameworks
- The **open-source community** for inspiration and libraries
- **Beta testers** who provided valuable feedback
- Everyone who supported this project during development

---

## 📚 Documentation

For more detailed documentation, check out:

- [Installation Guide](./docs/installation.md) (coming soon)
- [API Documentation](./docs/api.md) (coming soon)
- [Development Guide](./docs/development.md) (coming soon)
- [Deployment Guide](./docs/deployment.md) (coming soon)

---

## 🐛 Known Issues & Roadmap

Check our [GitHub Issues](https://github.com/Gabry848/MyTaskly-app/issues) for:
- Current bugs and issues
- Feature requests
- Planned improvements
- Community discussions

### Coming Soon

- [ ] Desktop app (Electron)
- [ ] Widget support (iOS/Android)
- [ ] More AI models to choose from
- [ ] Task analytics and insights
- [ ] Pomodoro timer integration
- [ ] Habit tracking
- [ ] Team workspaces

---

<div align="center">

**Made with ❤️ by a 16-year-old developer**

If you like this project, don't forget to give it a ⭐!

[⬆ Back to Top](#mytaskly)

</div>
