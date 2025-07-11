import * as assert from 'assert';
import * as vscode from 'vscode';
import { KnowledgeHubClient } from '../knowledgehub-client';
import { AIEnhancementLayer } from '../ai-enhancement-layer';
import { ContextBridge } from '../context-bridge';
import { LiveContextStream } from '../live-context';
import { AIProviderDetector } from '../ai-provider-detector';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('knowledgehub.knowledgehub-ai-intelligence'));
    });

    test('Should activate', async () => {
        const ext = vscode.extensions.getExtension('knowledgehub.knowledgehub-ai-intelligence');
        if (ext) {
            await ext.activate();
            assert.ok(ext.isActive);
        }
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        
        assert.ok(commands.includes('knowledgehub.initSession'));
        assert.ok(commands.includes('knowledgehub.enhanceAI'));
        assert.ok(commands.includes('knowledgehub.showDashboard'));
        assert.ok(commands.includes('knowledgehub.analyzeProject'));
        assert.ok(commands.includes('knowledgehub.showMemory'));
    });

    test('Configuration should have default values', () => {
        const config = vscode.workspace.getConfiguration('knowledgehub');
        
        assert.strictEqual(config.get('server.url'), 'http://192.168.1.25:3000');
        assert.strictEqual(config.get('ai.autoEnhance'), true);
        assert.strictEqual(config.get('ai.primaryProvider'), 'auto');
        assert.strictEqual(config.get('ai.enhancementLevel'), 'maximum');
    });

    test('AI Provider Detector should identify installed extensions', async () => {
        const detector = new AIProviderDetector();
        const providers = await detector.detectProviders();
        
        // Should at least detect VS Code built-in extensions
        assert.ok(Array.isArray(providers));
        console.log(`Detected ${providers.length} AI providers`);
    });

    test('KnowledgeHub Client should handle connection errors gracefully', async () => {
        const outputChannel = vscode.window.createOutputChannel('Test');
        const client = new KnowledgeHubClient('http://192.168.1.25:3000', outputChannel);
        
        // Should return false when server is unreachable
        const isConnected = await client.testConnection();
        assert.ok(typeof isConnected === 'boolean');
    });

    test('AI Enhancement Layer should create enhanced prompts', async () => {
        const outputChannel = vscode.window.createOutputChannel('Test');
        const client = new KnowledgeHubClient('http://192.168.1.25:3000', outputChannel);
        const enhancer = new AIEnhancementLayer(client);
        
        const request = {
            prompt: 'Create a function to add two numbers',
            context: {}
        };
        
        // Should enhance request even without server connection
        const enhanced = await enhancer.enhanceAIRequest(request);
        assert.ok(enhanced);
        assert.ok(enhanced.prompt);
    });

    test('Live Context Stream should track document changes', async () => {
        const outputChannel = vscode.window.createOutputChannel('Test');
        const client = new KnowledgeHubClient('http://192.168.1.25:3000', outputChannel);
        const contextStream = new LiveContextStream(client);
        
        await contextStream.startContextTracking();
        
        // Should be tracking
        const context = await contextStream.getLatestContext();
        assert.ok(context);
        assert.ok(Array.isArray(context.recentChanges));
        
        contextStream.stop();
    });

    test('Context Bridge should detect AI providers', async () => {
        const outputChannel = vscode.window.createOutputChannel('Test');
        const client = new KnowledgeHubClient('http://192.168.1.25:3000', outputChannel);
        const bridge = new ContextBridge(client);
        
        // Should handle missing AI providers gracefully
        const result = await bridge.bridgeContextToAI('github.copilot', vscode.extensions.getExtension('github.copilot')!);
        assert.ok(typeof result === 'boolean');
    });
});