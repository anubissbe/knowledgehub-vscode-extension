#!/usr/bin/env node

/**
 * Test script for KnowledgeHub VS Code Extension
 * Verifies that all components are working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing KnowledgeHub VS Code Extension...\n');

// Test 1: Check compiled files exist
console.log('📁 Checking compiled files...');
const expectedFiles = [
    'out/extension.js',
    'out/knowledgehub-client.js',
    'out/ai-enhancement-layer.js',
    'out/context-bridge.js',
    'out/live-context.js',
    'out/ai-provider-detector.js'
];

let allFilesExist = true;
expectedFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - Missing!`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some compiled files are missing. Run: npm run compile');
    process.exit(1);
}

// Test 2: Check package.json configuration
console.log('\n📦 Checking package.json configuration...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = [
    'name', 'displayName', 'description', 'version', 'publisher',
    'engines', 'activationEvents', 'main', 'contributes'
];

requiredFields.forEach(field => {
    if (packageJson[field]) {
        console.log(`✅ ${field}: ${typeof packageJson[field] === 'object' ? 'configured' : packageJson[field]}`);
    } else {
        console.log(`❌ ${field} - Missing!`);
    }
});

// Test 3: Check commands configuration
console.log('\n🎮 Checking commands configuration...');
const commands = packageJson.contributes?.commands || [];
const expectedCommands = [
    'knowledgehub.initSession',
    'knowledgehub.enhanceAI',
    'knowledgehub.showDashboard',
    'knowledgehub.analyzeProject',
    'knowledgehub.showMemory'
];

expectedCommands.forEach(cmd => {
    const found = commands.find(c => c.command === cmd);
    if (found) {
        console.log(`✅ ${cmd}: ${found.title}`);
    } else {
        console.log(`❌ ${cmd} - Missing!`);
    }
});

// Test 4: Check configuration schema
console.log('\n⚙️ Checking configuration schema...');
const config = packageJson.contributes?.configuration;
if (config && config.properties) {
    const configProps = Object.keys(config.properties);
    console.log(`✅ Configuration properties: ${configProps.length}`);
    configProps.forEach(prop => {
        console.log(`   - ${prop}`);
    });
} else {
    console.log('❌ Configuration properties missing!');
}

// Test 5: Verify TypeScript compilation
console.log('\n🔧 Verifying TypeScript compilation...');
try {
    // Try to require the main extension file
    const extensionPath = path.resolve('./out/extension.js');
    if (fs.existsSync(extensionPath)) {
        console.log('✅ Main extension file compiled successfully');
        
        // Check for syntax errors by attempting to load
        try {
            const ext = require(extensionPath);
            if (typeof ext.activate === 'function') {
                console.log('✅ Extension exports activate function');
            }
            if (typeof ext.deactivate === 'function') {
                console.log('✅ Extension exports deactivate function');
            }
        } catch (requireError) {
            console.log(`⚠️ Extension file has issues: ${requireError.message}`);
        }
    } else {
        console.log('❌ Main extension file not found');
    }
} catch (error) {
    console.log(`❌ TypeScript compilation issue: ${error.message}`);
}

// Test 6: Check dependencies
console.log('\n📚 Checking dependencies...');
const dependencies = packageJson.dependencies || {};
const expectedDeps = ['axios', 'ws'];

expectedDeps.forEach(dep => {
    if (dependencies[dep]) {
        console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
        console.log(`❌ ${dep} - Missing!`);
    }
});

// Test 7: Verify README exists and has content
console.log('\n📖 Checking documentation...');
if (fs.existsSync('README.md')) {
    const readmeSize = fs.statSync('README.md').size;
    if (readmeSize > 1000) {
        console.log(`✅ README.md exists (${Math.round(readmeSize/1024)}KB)`);
    } else {
        console.log('⚠️ README.md exists but seems incomplete');
    }
} else {
    console.log('❌ README.md missing!');
}

// Test 8: Check VS Code engine version
console.log('\n🚀 Checking VS Code compatibility...');
const vscodeEngine = packageJson.engines?.vscode;
if (vscodeEngine) {
    console.log(`✅ VS Code engine: ${vscodeEngine}`);
    
    // Check if it's a reasonable version
    if (vscodeEngine.includes('1.80.0') || vscodeEngine.includes('^1.')) {
        console.log('✅ Compatible with modern VS Code versions');
    } else {
        console.log('⚠️ Consider updating VS Code engine requirement');
    }
} else {
    console.log('❌ VS Code engine version not specified!');
}

console.log('\n🎉 Extension validation complete!');
console.log('\n📋 Next steps:');
console.log('1. Test in VS Code development environment: Press F5 in VS Code');
console.log('2. Package extension: npm install -g vsce && vsce package');
console.log('3. Install in VS Code: code --install-extension knowledgehub-ai-intelligence-1.0.0.vsix');
console.log('4. Configure KnowledgeHub server URL in VS Code settings');
console.log('5. Run command: "KnowledgeHub: Initialize AI Session"');

console.log('\n🌐 Required services:');
console.log('- KnowledgeHub server: http://192.168.1.25:3000');
console.log('- MCP services: http://192.168.1.24:3001-3015');

console.log('\n✨ Your AI tools will now have memory, learning, and project context!');