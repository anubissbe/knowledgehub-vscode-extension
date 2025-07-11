#!/bin/bash

# KnowledgeHub VS Code Extension Installation Script

set -e

echo "🚀 Installing KnowledgeHub AI Intelligence VS Code Extension..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the extension directory?${NC}"
    exit 1
fi

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo -e "${RED}❌ Error: VS Code not found. Please install VS Code first.${NC}"
    echo "   Download from: https://code.visualstudio.com/"
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js not found. Please install Node.js 16+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Error: Node.js 16+ required. Found: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ VS Code and Node.js found${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Compile TypeScript
echo -e "${BLUE}🔧 Compiling TypeScript...${NC}"
npm run compile

# Test the extension
echo -e "${BLUE}🧪 Running validation tests...${NC}"
node test-extension.js

# Install vsce if not available
if ! command -v vsce &> /dev/null; then
    echo -e "${BLUE}📋 Installing VS Code Extension Manager (vsce)...${NC}"
    npm install -g vsce
fi

# Package the extension
echo -e "${BLUE}📦 Packaging extension...${NC}"
vsce package --no-dependencies

# Find the generated .vsix file
VSIX_FILE=$(find . -name "*.vsix" -type f | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo -e "${RED}❌ Error: Could not find generated .vsix file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Extension packaged: $VSIX_FILE${NC}"

# Install the extension
echo -e "${BLUE}🚀 Installing extension in VS Code...${NC}"
code --install-extension "$VSIX_FILE" --force

# Check if KnowledgeHub server is accessible
echo -e "${BLUE}🌐 Checking KnowledgeHub server connectivity...${NC}"
if curl -s --connect-timeout 5 http://192.168.1.25:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ KnowledgeHub server is accessible${NC}"
else
    echo -e "${YELLOW}⚠️ KnowledgeHub server not accessible at http://192.168.1.25:3000${NC}"
    echo -e "${YELLOW}   Make sure KnowledgeHub is running before using the extension${NC}"
fi

echo
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Open VS Code"
echo "2. Go to File → Preferences → Settings"
echo "3. Search for 'knowledgehub'"
echo "4. Configure server URL: http://192.168.1.25:3000"
echo "5. Open Command Palette (Ctrl+Shift+P)"
echo "6. Run: 'KnowledgeHub: Initialize AI Session'"
echo
echo -e "${BLUE}🔧 Available commands:${NC}"
echo "• KnowledgeHub: Initialize AI Session"
echo "• KnowledgeHub: Show AI Dashboard"
echo "• KnowledgeHub: Analyze Project Context"
echo "• KnowledgeHub: Show Memory Context"
echo "• KnowledgeHub: Enable AI Enhancement"
echo
echo -e "${BLUE}🧠 What this extension does:${NC}"
echo "• Enhances GitHub Copilot with project memory"
echo "• Adds context to Cline/Continue AI assistant"
echo "• Provides session continuity across restarts"
echo "• Learns from your coding patterns"
echo "• Tracks decisions and provides project context"
echo
echo -e "${GREEN}✨ Your AI tools now have memory, learning, and project awareness!${NC}"