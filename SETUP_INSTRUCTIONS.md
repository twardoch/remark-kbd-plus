# Setup Instructions for remark-kbd-plus CI/CD

## Overview

This document contains instructions for setting up the complete CI/CD pipeline for remark-kbd-plus. The core functionality has been implemented, but GitHub Actions workflows need to be added manually due to permission restrictions.

## ✅ Already Implemented

- **Git-tag-based semantic versioning** (`scripts/version.js`)
- **Comprehensive test suite** with 20 test cases and 96% coverage
- **Build and release scripts** for local development
- **GitHub issue templates** and PR templates
- **Dependabot configuration** for automated dependency updates
- **Auto-labeling configuration** for PRs and issues
- **Development documentation** (`CONTRIBUTING.md`)

## 🔧 Manual Setup Required

### 1. GitHub Actions Workflows

Create the following workflow files in `.github/workflows/`:

#### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Run tests with coverage
      run: npm run coverage
    
    - name: Upload coverage to Codecov
      if: matrix.node-version == '20.x'
      uses: codecov/codecov-action@v4
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false
        token: ${{ secrets.CODECOV_TOKEN }}
    
    - name: Build distribution
      run: npm run prepare
    
    - name: Test installation
      run: npm pack --dry-run
```

#### `.github/workflows/release.yml`
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        registry-url: 'https://registry.npmjs.org'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run full test suite
      run: npm run test:full
    
    - name: Update version based on tag
      run: npm run version
    
    - name: Build distribution
      run: npm run prepare
    
    - name: Create package
      run: npm pack
    
    - name: Get package info
      id: package
      run: |
        echo "name=$(node -p "require('./package.json').name")" >> $GITHUB_OUTPUT
        echo "version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT
    
    - name: Create GitHub Release
      uses: actions/create-release@v1
      id: create_release
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        body: |
          Release ${{ steps.package.outputs.version }} of ${{ steps.package.outputs.name }}
          
          ## Installation
          
          ```bash
          npm install ${{ steps.package.outputs.name }}@${{ steps.package.outputs.version }}
          ```
          
          ## Changes
          
          See the [CHANGELOG.md](https://github.com/${{ github.repository }}/blob/${{ github.ref }}/CHANGELOG.md) for details.
        draft: false
        prerelease: ${{ contains(github.ref, '-') }}
    
    - name: Upload Release Asset
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./${{ steps.package.outputs.name }}-${{ steps.package.outputs.version }}.tgz
        asset_name: ${{ steps.package.outputs.name }}-${{ steps.package.outputs.version }}.tgz
        asset_content_type: application/gzip
    
    - name: Publish to npm
      run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### `.github/workflows/security.yml`
```yaml
name: Security

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]
  schedule:
    - cron: '0 0 * * 0'  # Run weekly on Sunday

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security audit
      run: npm audit --audit-level=moderate
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v3
      with:
        languages: javascript
    
    - name: Check for vulnerable dependencies
      run: |
        if npm audit --audit-level=high --json | jq '.vulnerabilities | length > 0'; then
          echo "High severity vulnerabilities found!"
          npm audit --audit-level=high
          exit 1
        fi
```

#### `.github/workflows/labeler.yml`
```yaml
name: Labeler

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  label:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Auto-label PR
      uses: actions/labeler@v5
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
        configuration-path: .github/labeler.yml
        sync-labels: true
```

### 2. Repository Secrets

Add the following secrets to your GitHub repository settings:

- **`NPM_TOKEN`**: Your npm authentication token for publishing packages
- **`CODECOV_TOKEN`**: (Optional) For code coverage reporting

### 3. GitHub Repository Settings

- **Enable GitHub Actions** in repository settings
- **Set up branch protection** for main branch requiring status checks
- **Configure auto-merge** for dependabot PRs (optional)

## 🚀 Usage

### Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run full test suite with coverage
npm run test:full

# Build the project
npm run build

# Development mode
npm run dev
```

### Creating a Release

1. **Create and push a version tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Run tests on multiple Node.js versions
   - Build the package
   - Create a GitHub release
   - Publish to npm (if configured)

### Version Management

The version is automatically determined from git tags:
- **On a tag**: `1.0.0`
- **After a tag**: `1.0.0-dev.5+abc1234` (version-dev.commits+hash)

## 📦 Package Features

### Current Implementation

- **Semantic versioning** based on git tags
- **Comprehensive test suite** with edge cases
- **Build and release scripts** for local use
- **Cross-platform compatibility** (Node.js 18.x+)
- **ESLint configuration** for code quality
- **Babel transpilation** for distribution

### Available Scripts

- `npm run build` - Full build process (lint, test, build)
- `npm run test` - Run tests once
- `npm run test:full` - Complete test suite with coverage
- `npm run lint` - Run ESLint
- `npm run coverage` - Run tests with coverage
- `npm run dev` - Development mode
- `npm run version` - Update version from git tags
- `npm run release` - Prepare release package
- `npm run install:local` - Install globally for development

## 🔧 Technical Details

### Git-Tag-Based Versioning

The `scripts/version.js` automatically determines the version:

```javascript
// Examples:
// On tag v1.0.0: "1.0.0"
// 5 commits after v1.0.0: "1.0.0-dev.5+abc1234"
// No tags: "0.1.0"
```

### Test Coverage

- **20 comprehensive test cases** covering:
  - Basic functionality
  - Edge cases and escape sequences
  - Performance with large documents
  - AST node structure
  - Plugin configuration
  - Error handling

### Build Process

1. **Lint**: ESLint with strict rules
2. **Test**: Jest with coverage reporting
3. **Build**: Babel transpilation to `dist/`
4. **Package**: npm pack for distribution

## 📚 Documentation

- **`CONTRIBUTING.md`**: Development and contribution guidelines
- **`README.md`**: User-facing documentation
- **Issue templates**: Bug reports and feature requests
- **PR template**: Structured pull request process

## 🎯 Next Steps

1. **Add the GitHub Actions workflows** from the templates above
2. **Set up npm publishing** with appropriate tokens
3. **Configure branch protection** rules
4. **Test the complete pipeline** with a test release
5. **Add code coverage reporting** (optional)

This setup provides a professional-grade CI/CD pipeline with automated testing, building, and releasing across multiple platforms.