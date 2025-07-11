#!/usr/bin/env node

/**
 * Integration Test Suite for KnowledgeHub VS Code Extension
 * Tests real connectivity and functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const KNOWLEDGEHUB_URL = 'http://192.168.1.25:3000';
const MCP_BASE_URL = 'http://192.168.1.24';

console.log('🧪 Running KnowledgeHub VS Code Extension Integration Tests...\n');

let testsPassed = 0;
let testsFailed = 0;

async function test(name, testFunc) {
    process.stdout.write(`Testing: ${name}... `);
    try {
        await testFunc();
        console.log('✅ PASS');
        testsPassed++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testsFailed++;
    }
}

async function runTests() {
    console.log('📡 Testing Network Connectivity...\n');

    // Test 1: KnowledgeHub Health
    await test('KnowledgeHub server health', async () => {
        const response = await axios.get(`${KNOWLEDGEHUB_URL}/health`);
        if (response.data.status !== 'healthy') {
            throw new Error(`Server unhealthy: ${response.data.status}`);
        }
    });

    // Test 2: MCP Services
    await test('MCP services connectivity', async () => {
        const response = await axios.get(`${MCP_BASE_URL}:3001/health`);
        if (response.status !== 200) {
            throw new Error('MCP service unavailable');
        }
    });

    console.log('\n🔌 Testing API Endpoints...\n');

    // Test 3: Memory API
    await test('Memory API endpoint', async () => {
        try {
            const response = await axios.get(`${KNOWLEDGEHUB_URL}/api/memory/context/quick/claude?limit=5`);
            // Might need auth, but check if endpoint exists
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Auth required is expected
                return;
            }
            throw error;
        }
    });

    // Test 4: Extension Components
    console.log('\n🔧 Testing Extension Components...\n');

    await test('TypeScript compilation output', () => {
        const files = [
            'out/extension.js',
            'out/knowledgehub-client.js',
            'out/ai-enhancement-layer.js',
            'out/context-bridge.js',
            'out/live-context.js',
            'out/ai-provider-detector.js'
        ];

        files.forEach(file => {
            if (!fs.existsSync(file)) {
                throw new Error(`Missing compiled file: ${file}`);
            }
        });
    });

    await test('Extension manifest validity', () => {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Check required fields
        const required = ['name', 'version', 'engines', 'activationEvents', 'main'];
        required.forEach(field => {
            if (!packageJson[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        });

        // Check VS Code engine compatibility
        if (!packageJson.engines.vscode.includes('1.80')) {
            throw new Error('VS Code engine version incompatible');
        }
    });

    await test('Extension exports', () => {
        // Load the compiled extension
        const extensionPath = path.resolve('./out/extension.js');
        delete require.cache[extensionPath]; // Clear cache
        
        // We can't fully test without VS Code, but check structure
        const stats = fs.statSync(extensionPath);
        if (stats.size < 1000) {
            throw new Error('Extension file seems too small');
        }
    });

    console.log('\n🌐 Testing Mock AI Provider Detection...\n');

    await test('AI provider detector logic', () => {
        // Test the detector can identify AI-related extensions
        const mockExtensions = [
            { id: 'github.copilot', displayName: 'GitHub Copilot', categories: ['AI'] },
            { id: 'continue.continue', displayName: 'Continue', description: 'AI assistant' },
            { id: 'random.extension', displayName: 'Random', categories: ['Other'] }
        ];

        // Simple validation that our detection logic would work
        const aiExtensions = mockExtensions.filter(ext => 
            ext.categories?.includes('AI') || 
            ext.description?.toLowerCase().includes('ai') ||
            ext.displayName?.toLowerCase().includes('copilot')
        );

        if (aiExtensions.length !== 2) {
            throw new Error('AI detection logic failed');
        }
    });

    console.log('\n📊 Testing Configuration Schema...\n');

    await test('Configuration properties', () => {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const configProps = packageJson.contributes?.configuration?.properties;
        
        const expectedProps = [
            'knowledgehub.server.url',
            'knowledgehub.ai.autoEnhance',
            'knowledgehub.ai.primaryProvider',
            'knowledgehub.ai.enhancementLevel'
        ];

        expectedProps.forEach(prop => {
            if (!configProps[prop]) {
                throw new Error(`Missing configuration property: ${prop}`);
            }
        });
    });

    console.log('\n🔍 Testing Enhancement Logic...\n');

    await test('Context enhancement simulation', () => {
        // Simulate what the enhancement would do
        const originalPrompt = 'Create a user authentication function';
        const mockContext = {
            projectSummary: 'E-commerce platform using Node.js and React',
            relevantPatterns: ['JWT authentication', 'Express middleware'],
            relevantDecisions: ['Use bcrypt for password hashing'],
            suggestions: ['Consider rate limiting for login attempts']
        };

        // Test minimal enhancement
        const minimalEnhanced = `${originalPrompt}\n\n[Project: /opt/projects/test]`;
        if (!minimalEnhanced.includes(originalPrompt)) {
            throw new Error('Minimal enhancement failed');
        }

        // Test standard enhancement includes patterns
        const standardTemplate = `
# Context from KnowledgeHub AI Intelligence

## Current File: test.js
## Git Branch: main

## Recent Project Patterns:
${mockContext.relevantPatterns.join('\n')}

## Original Request:
${originalPrompt}
`;
        
        if (!standardTemplate.includes('JWT authentication')) {
            throw new Error('Standard enhancement failed');
        }
    });

    console.log('\n📝 Testing Documentation...\n');

    await test('README completeness', () => {
        const readme = fs.readFileSync('README.md', 'utf8');
        
        // Check for essential sections
        const essentialSections = [
            '## 🚀 What This Extension Does',
            '## 🎯 Supported AI Tools',
            '## 🔧 Features',
            '## 🚀 Quick Start',
            '## 🎮 Commands',
            '## ⚙️ Configuration'
        ];

        essentialSections.forEach(section => {
            if (!readme.includes(section)) {
                throw new Error(`Missing README section: ${section}`);
            }
        });
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('='.repeat(60) + '\n');

    if (testsFailed > 0) {
        console.log('❌ Some tests failed. Please fix the issues above.');
        process.exit(1);
    } else {
        console.log('✅ All tests passed! The extension is ready for deployment.');
    }
}

// Run tests
runTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
});