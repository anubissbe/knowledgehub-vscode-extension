# GitHub Deployment Guide

## 📦 Steps to Deploy to GitHub

### 1. Create GitHub Repository

Go to https://github.com/new and create a new repository:
- **Repository name**: `knowledgehub-vscode-extension`
- **Description**: "VS Code extension that enhances AI tools with persistent memory, learning, and project context"
- **Visibility**: Public (for open source) or Private
- **Initialize**: DO NOT initialize with README, license, or .gitignore (we have them)

### 2. Add Remote and Push

```bash
# Add the GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/knowledgehub-vscode-extension.git

# Or if using SSH
git remote add origin git@github.com:YOUR_USERNAME/knowledgehub-vscode-extension.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Configure Repository Settings

#### Enable GitHub Pages (for documentation)
1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, folder: /docs (if you add docs later)

#### Set up Branch Protection
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks (CI)
   - Require branches to be up to date

#### Add Repository Topics
Add these topics for better discoverability:
- `vscode-extension`
- `ai-tools`
- `github-copilot`
- `machine-learning`
- `developer-tools`
- `productivity`
- `code-completion`

### 4. Set up CI/CD Secrets

Go to Settings → Secrets and variables → Actions:

1. **VSCE_TOKEN** (Optional - for VS Code Marketplace publishing)
   - Get token from https://marketplace.visualstudio.com/manage
   - Add as repository secret

2. **API_KEY** (For testing with KnowledgeHub)
   - Add your KnowledgeHub API key
   - Used in CI tests

### 5. Create Initial Release

```bash
# Tag the release
git tag -a v1.0.0-beta.1 -m "Initial beta release"
git push origin v1.0.0-beta.1
```

Then create a GitHub Release:
1. Go to Releases → Create new release
2. Choose tag: v1.0.0-beta.1
3. Release title: "v1.0.0-beta.1 - Initial Beta Release"
4. Check "This is a pre-release"
5. Add release notes:

```markdown
## 🚀 Initial Beta Release

The first beta release of KnowledgeHub VS Code Extension!

### ✨ Features
- Universal AI tool enhancement (Copilot, Cline, Claude Dev, etc.)
- Persistent memory across sessions
- Project context awareness
- Learning from patterns and mistakes
- Real-time context tracking

### 📋 Requirements
- VS Code 1.80.0 or later
- KnowledgeHub server (for full functionality)
- Node.js 16+ (for development)

### 🔧 Installation
1. Download the `.vsix` file from release assets
2. Install: `code --install-extension knowledgehub-ai-intelligence-*.vsix`
3. Configure server URL in settings

### ⚠️ Known Limitations
- Requires API key configuration for KnowledgeHub connection
- Limited AI provider API access
- See KNOWN_ISSUES.md for details

### 📚 Documentation
- [README](README.md) - Getting started
- [KNOWN_ISSUES](KNOWN_ISSUES.md) - Current limitations
- [TEST_REPORT](TEST_REPORT.md) - Test results
```

### 6. Set Up Project Board

Create a project board for tracking development:
1. Go to Projects → New project
2. Choose "Board" template
3. Add columns:
   - To Do
   - In Progress
   - Testing
   - Done

### 7. Configure Webhooks (Optional)

For integration with KnowledgeHub:
1. Go to Settings → Webhooks
2. Add webhook URL: `http://192.168.1.25:3000/api/github/webhook`
3. Events: Push, Pull Request, Issues, Releases

### 8. Add Badges to README

Add these badges to the top of README.md:

```markdown
[![CI](https://github.com/YOUR_USERNAME/knowledgehub-vscode-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/knowledgehub-vscode-extension/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/release/YOUR_USERNAME/knowledgehub-vscode-extension.svg)](https://github.com/YOUR_USERNAME/knowledgehub-vscode-extension/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## 🚀 Publishing to VS Code Marketplace

### Prerequisites
1. Create a publisher account at https://marketplace.visualstudio.com/manage
2. Get Personal Access Token with Marketplace scope

### Publishing Steps

```bash
# Install vsce globally
npm install -g vsce

# Package the extension
vsce package

# Publish (will prompt for token)
vsce publish

# Or with token
vsce publish -p YOUR_PERSONAL_ACCESS_TOKEN
```

### Marketplace Metadata

Update package.json before publishing:
```json
{
  "publisher": "your-publisher-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/knowledgehub-vscode-extension"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/knowledgehub-vscode-extension/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/knowledgehub-vscode-extension#readme",
  "icon": "icon.png",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  }
}
```

## 📊 Post-Deployment Checklist

- [ ] Repository created and code pushed
- [ ] CI/CD workflows running successfully  
- [ ] Branch protection configured
- [ ] Initial release created
- [ ] README badges added
- [ ] Repository topics set
- [ ] Project board created
- [ ] (Optional) Published to VS Code Marketplace
- [ ] (Optional) Webhooks configured

## 🎉 Congratulations!

Your KnowledgeHub VS Code Extension is now on GitHub and ready for:
- Community contributions
- Issue tracking
- Automated testing
- Release management
- VS Code Marketplace distribution

Share the repository URL and start enhancing AI development tools with memory and intelligence!