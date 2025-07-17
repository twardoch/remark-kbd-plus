# Contributing to remark-kbd-plus

Thank you for your interest in contributing to remark-kbd-plus! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/remark-kbd-plus.git
   cd remark-kbd-plus
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run tests to ensure everything is working:
   ```bash
   npm test
   ```

## Development Workflow

### Available Scripts

- `npm run build` - Run the complete build process (lint, test, build)
- `npm run test` - Run tests once
- `npm run test:full` - Run comprehensive test suite with coverage
- `npm run lint` - Run ESLint
- `npm run coverage` - Run tests with coverage report
- `npm run dev` - Development mode with watch (if available)
- `npm run version` - Update version based on git tags
- `npm run release` - Prepare a release package
- `npm run install:local` - Install package globally for local development

### Code Style

- We use ESLint for code linting
- Use single quotes for strings
- Follow the existing code style
- Add comments for complex logic

### Testing

- All new features must include tests
- Tests are located in `__tests__/` directory
- We use Jest for testing
- Aim for high test coverage
- Test edge cases and error conditions

### Commits

- Use clear, descriptive commit messages
- Follow conventional commits format when possible:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation updates
  - `test:` for test updates
  - `chore:` for maintenance tasks

## Release Process

### Semantic Versioning

This project uses semantic versioning with git tags:

- `v1.0.0` - Major version (breaking changes)
- `v1.1.0` - Minor version (new features)
- `v1.1.1` - Patch version (bug fixes)

### Creating a Release

1. Ensure all tests pass:
   ```bash
   npm run test:full
   ```

2. Create and push a version tag:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

3. GitHub Actions will automatically:
   - Run tests on multiple Node.js versions
   - Build the package
   - Create a GitHub release
   - Publish to npm (if configured)

### Development Versions

- Development versions are automatically generated based on commits since the last tag
- Format: `1.0.0-dev.5+abc1234` (version-dev.commits+hash)

## CI/CD Pipeline

### GitHub Actions Workflows

- **CI** (`ci.yml`) - Runs on every push and PR
  - Tests on Node.js 18.x, 20.x, 22.x
  - Runs linting and tests
  - Generates coverage reports
  - Tests package installation

- **Release** (`release.yml`) - Runs on git tags
  - Full test suite
  - Creates GitHub release
  - Publishes to npm
  - Uploads release artifacts

- **Security** (`security.yml`) - Security scanning
  - Dependency vulnerability checks
  - CodeQL analysis
  - Runs weekly and on pushes

- **Build Examples** (`build-examples.yml`) - Cross-platform testing
  - Tests on Ubuntu, Windows, macOS
  - Creates usage examples
  - Uploads platform-specific artifacts

### Automated Processes

- **Dependabot** - Weekly dependency updates
- **Auto-labeling** - Automatic PR and issue labeling
- **Security scanning** - Continuous security monitoring

## Architecture

### Project Structure

```
remark-kbd-plus/
├── src/                    # Source code
│   └── index.js           # Main plugin implementation
├── __tests__/             # Test files
│   └── index.js           # Main test suite
├── scripts/               # Build and utility scripts
│   ├── build.sh          # Build script
│   ├── release.sh        # Release script
│   ├── test.sh           # Test script
│   ├── dev.sh            # Development script
│   ├── version.js        # Version management
│   └── install-local.sh  # Local installation
├── dist/                  # Built/compiled code
├── .github/               # GitHub configurations
│   ├── workflows/        # GitHub Actions
│   └── ISSUE_TEMPLATE/   # Issue templates
└── docs/                  # Documentation
```

### Plugin Architecture

The plugin follows the unified/remark plugin architecture:

1. **Parser** - Processes text nodes to find `++key++` sequences
2. **Transformer** - Converts matches to `kbd` AST nodes
3. **Serializer** - Outputs HTML `<kbd>` elements via rehype

## Troubleshooting

### Common Issues

1. **Tests failing** - Ensure you're using Node.js 18.x+
2. **Build errors** - Run `npm ci` to clean install dependencies
3. **Version issues** - Check git tags with `git tag -l`

### Getting Help

- Check existing issues on GitHub
- Create a new issue with detailed information
- Follow the issue templates for bug reports and feature requests

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## License

By contributing to remark-kbd-plus, you agree that your contributions will be licensed under the MIT License.