# Contributing to MyTaskly

First off, thank you for considering contributing to MyTaskly! 🎉

It's people like you that make MyTaskly such a great tool. We welcome contributions from developers of all skill levels, whether you're fixing a typo, reporting a bug, or implementing a major feature.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please be respectful, inclusive, and considerate of others.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be professional**: Keep discussions focused on the project
- **Be patient**: Remember that we're all learning

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Spam or off-topic content

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/Gabry848/MyTaskly-app/issues) to see if the problem has already been reported.

#### How to Submit a Good Bug Report

1. **Use a clear and descriptive title**
2. **Describe the exact steps to reproduce the problem**
3. **Provide specific examples** with screenshots or videos if possible
4. **Describe the behavior you observed** and what you expected
5. **Include details about your environment**:
   - OS version (iOS/Android/Windows/macOS/Linux)
   - App version
   - Device model
   - React Native/Expo version

#### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- Device: [e.g. iPhone 14, Pixel 7]
- OS: [e.g. iOS 16.3, Android 13]
- App Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

We love to hear ideas for new features! Before creating an enhancement suggestion:

1. Check the [roadmap](./CHANGELOG.md#upcoming-features-roadmap) to see if it's already planned
2. Check [existing feature requests](https://github.com/Gabry848/MyTaskly-app/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

#### Enhancement Suggestion Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Add any other context, mockups, or screenshots about the feature request.

**Would you be willing to implement this feature?**
Let us know if you'd like to work on this!
```

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Small, beginner-friendly tasks
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write a clear commit message** following our guidelines
6. **Submit a pull request**

#### Pull Request Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement

## Related Issues
Closes #(issue number)

## Testing
Describe how you tested your changes:
- [ ] iOS
- [ ] Android
- [ ] Web

## Screenshots (if applicable)
Add screenshots to demonstrate the changes.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have tested my changes on iOS/Android/Web
```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- For iOS: macOS with Xcode 14+
- For Android: Android Studio with SDK 33+

### Setup Steps

1. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/MyTaskly-app.git
   cd MyTaskly-app
   ```

2. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Gabry848/MyTaskly-app.git
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Configure environment**:
   Create a `.env` file based on `.env.example` (you'll need to add your own API keys)

5. **Start development server**:
   ```bash
   npm start
   ```

6. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types and interfaces
- Avoid using `any` - use `unknown` or specific types instead
- Use type inference where possible

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint --fix
```

### Naming Conventions

- **Components**: PascalCase (e.g., `TaskCard.tsx`)
- **Functions**: camelCase (e.g., `handleTaskComplete`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `TaskItemProps`)
- **Files**: kebab-case for utilities (e.g., `date-utils.ts`), PascalCase for components

### Component Structure

```typescript
// 1. Imports
import React from 'react';
import { View, Text } from 'react-native';

// 2. Types
interface MyComponentProps {
  title: string;
  onPress: () => void;
}

// 3. Component
const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  // 4. Hooks
  const [state, setState] = useState();

  // 5. Functions
  const handlePress = () => {
    // ...
  };

  // 6. Render
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};

// 7. Styles
const styles = StyleSheet.create({
  // ...
});

// 8. Export
export default MyComponent;
```

### Best Practices

- **Keep components small and focused** - One component, one responsibility
- **Use functional components** with hooks instead of class components
- **Extract reusable logic** into custom hooks
- **Memoize expensive computations** with `useMemo`
- **Optimize re-renders** with `React.memo` when needed
- **Handle errors gracefully** with try-catch blocks
- **Add meaningful comments** for complex logic
- **Write self-documenting code** with descriptive variable names

---

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(tasks): add task priority levels

- Added priority dropdown in task creation
- Updated task card to show priority indicator
- Added sorting by priority in task list

Closes #123
```

```bash
fix(voice-chat): improve VAD sensitivity

Adjusted VAD thresholds to reduce false positives
and improve voice detection reliability.

Fixes #456
```

---

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for all new features
- Update tests when modifying existing features
- Aim for meaningful test coverage, not just high percentages
- Test edge cases and error scenarios

### Test Structure

```typescript
describe('MyComponent', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test implementation
  });

  it('should handle errors gracefully', () => {
    // Test implementation
  });
});
```

---

## 📚 Documentation

- **Update README.md** if you change functionality
- **Update CHANGELOG.md** following the existing format
- **Add JSDoc comments** for public APIs and complex functions
- **Create/update inline comments** for complex logic
- **Update type definitions** when modifying interfaces

### JSDoc Example

```typescript
/**
 * Creates a new task with the provided details
 * @param title - The task title
 * @param description - Optional task description
 * @param dueDate - Due date for the task
 * @returns The created task object
 * @throws {Error} If task creation fails
 */
async function createTask(
  title: string,
  description?: string,
  dueDate?: Date
): Promise<Task> {
  // Implementation
}
```

---

## 👥 Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **GitHub Issues**: Report bugs and request features
- **Pull Requests**: Get feedback on your contributions

### Recognition

Contributors will be acknowledged in:
- The project README
- Release notes
- The contributors list on GitHub

---

## 🎯 What Makes a Good Contribution?

- **Solves a real problem** - Addresses an actual need or bug
- **Well-tested** - Includes tests and has been manually tested
- **Well-documented** - Clear code and updated documentation
- **Follows conventions** - Adheres to our coding standards
- **Minimal scope** - Focused on one thing, not multiple unrelated changes
- **Backward compatible** - Doesn't break existing functionality

---

## 🙏 Thank You!

Your contributions make MyTaskly better for everyone. Whether you're fixing a typo, reporting a bug, or implementing a major feature, we appreciate your time and effort.

If you have any questions about contributing, feel free to open an issue or reach out to [@Gabry848](https://github.com/Gabry848).

**Happy coding!** 🚀

---

*This contributing guide is itself open to contributions. If you find ways to improve it, please submit a pull request!*
