import * as vscode from 'vscode';
import { KnowledgeHubClient } from './knowledgehub-client';
import { AIEnhancementLayer } from './ai-enhancement-layer';
import { ContextBridge } from './context-bridge';
import { LiveContextStream } from './live-context';
import { AIProviderDetector } from './ai-provider-detector';

export class KnowledgeHubExtension {
    private knowledgeHubClient: KnowledgeHubClient;
    private aiEnhancementLayer: AIEnhancementLayer;
    private contextBridge: ContextBridge;
    private liveContextStream: LiveContextStream;
    private aiProviderDetector: AIProviderDetector;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('KnowledgeHub AI');
        
        // Get configuration
        const config = vscode.workspace.getConfiguration('knowledgehub');
        const serverUrl = config.get('server.url', 'http://192.168.1.25:3000');
        
        // Initialize components
        this.knowledgeHubClient = new KnowledgeHubClient(serverUrl, this.outputChannel);
        this.aiEnhancementLayer = new AIEnhancementLayer(this.knowledgeHubClient);
        this.contextBridge = new ContextBridge(this.knowledgeHubClient);
        this.liveContextStream = new LiveContextStream(this.knowledgeHubClient);
        this.aiProviderDetector = new AIProviderDetector();
    }

    async activate(context: vscode.ExtensionContext) {
        this.outputChannel.appendLine('🧠 Activating KnowledgeHub AI Intelligence...');

        try {
            // Initialize KnowledgeHub connection
            await this.initializeKnowledgeHub();

            // Register commands
            this.registerCommands(context);

            // Start AI enhancement
            await this.startAIEnhancement();

            // Start context tracking
            await this.startContextTracking();

            // Register AI provider interceptors
            await this.registerAIInterceptors();

            // Set context for UI
            vscode.commands.executeCommand('setContext', 'knowledgehub.enabled', true);

            this.outputChannel.appendLine('✅ KnowledgeHub AI Intelligence activated successfully!');
            
            // Show welcome message
            this.showWelcomeMessage();

        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to activate KnowledgeHub: ${error}`);
            vscode.window.showErrorMessage(`KnowledgeHub AI failed to activate: ${error}`);
        }
    }

    private async initializeKnowledgeHub() {
        this.outputChannel.appendLine('🔗 Connecting to KnowledgeHub server...');
        
        const isConnected = await this.knowledgeHubClient.testConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to KnowledgeHub server. Please check configuration.');
        }

        // Initialize AI session
        await this.knowledgeHubClient.initializeAISession();
        
        this.outputChannel.appendLine('✅ Connected to KnowledgeHub and initialized AI session');
    }

    private registerCommands(context: vscode.ExtensionContext) {
        const commands = [
            vscode.commands.registerCommand('knowledgehub.initSession', this.initSession.bind(this)),
            vscode.commands.registerCommand('knowledgehub.enhanceAI', this.toggleAIEnhancement.bind(this)),
            vscode.commands.registerCommand('knowledgehub.showDashboard', this.showDashboard.bind(this)),
            vscode.commands.registerCommand('knowledgehub.analyzeProject', this.analyzeProject.bind(this)),
            vscode.commands.registerCommand('knowledgehub.showMemory', this.showMemory.bind(this))
        ];

        commands.forEach(cmd => context.subscriptions.push(cmd));
    }

    private async startAIEnhancement() {
        const config = vscode.workspace.getConfiguration('knowledgehub');
        const autoEnhance = config.get('ai.autoEnhance', true);

        if (autoEnhance) {
            this.outputChannel.appendLine('🚀 Starting AI enhancement layer...');
            await this.aiEnhancementLayer.start();
        }
    }

    private async startContextTracking() {
        this.outputChannel.appendLine('📊 Starting context tracking...');
        await this.liveContextStream.startContextTracking();
    }

    private async registerAIInterceptors() {
        this.outputChannel.appendLine('🔌 Registering AI provider interceptors...');

        // Detect available AI extensions
        const availableProviders = await this.aiProviderDetector.detectProviders();
        
        for (const provider of availableProviders) {
            try {
                await this.contextBridge.bridgeContextToAI(provider.name, provider.extension);
                this.outputChannel.appendLine(`✅ Enhanced ${provider.displayName}`);
            } catch (error) {
                this.outputChannel.appendLine(`⚠️ Failed to enhance ${provider.displayName}: ${error}`);
            }
        }
    }

    private async initSession() {
        try {
            this.outputChannel.appendLine('🧠 Initializing AI session...');
            const sessionInfo = await this.knowledgeHubClient.initializeAISession();
            
            vscode.window.showInformationMessage(
                `AI Session Initialized: ${sessionInfo.memories} memories loaded, ${sessionInfo.tasks} tasks pending`
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to initialize AI session: ${error}`);
        }
    }

    private async toggleAIEnhancement() {
        const config = vscode.workspace.getConfiguration('knowledgehub');
        const currentState = config.get('ai.autoEnhance', true);
        
        await config.update('ai.autoEnhance', !currentState, vscode.ConfigurationTarget.Global);
        
        const newState = !currentState ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`AI Enhancement ${newState}`);
    }

    private async showDashboard() {
        try {
            const dashboardUrl = await this.knowledgeHubClient.getDashboardUrl();
            vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open dashboard: ${error}`);
        }
    }

    private async analyzeProject() {
        try {
            this.outputChannel.appendLine('🔍 Analyzing project context...');
            
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showWarningMessage('No workspace folder open');
                return;
            }

            const analysis = await this.knowledgeHubClient.analyzeProject(workspaceRoot);
            
            // Show analysis in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(analysis, null, 2),
                language: 'json'
            });
            
            await vscode.window.showTextDocument(doc);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze project: ${error}`);
        }
    }

    private async showMemory() {
        try {
            const memories = await this.knowledgeHubClient.getRecentMemories();
            
            const quickPick = vscode.window.createQuickPick();
            quickPick.title = 'Recent AI Memories';
            quickPick.items = memories.map(memory => ({
                label: memory.title,
                description: memory.summary,
                detail: `Type: ${memory.type} | ${memory.timestamp}`
            }));
            
            quickPick.onDidChangeSelection(selection => {
                if (selection[0]) {
                    vscode.window.showInformationMessage(selection[0].detail || '');
                }
            });
            
            quickPick.show();
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load memories: ${error}`);
        }
    }

    private showWelcomeMessage() {
        const config = vscode.workspace.getConfiguration('knowledgehub');
        const hasShownWelcome = config.get('ui.hasShownWelcome', false);
        
        if (!hasShownWelcome) {
            vscode.window.showInformationMessage(
                'KnowledgeHub AI Intelligence is now enhancing your AI tools with memory, learning, and project context!',
                'Show Dashboard',
                'Don\'t show again'
            ).then(selection => {
                if (selection === 'Show Dashboard') {
                    this.showDashboard();
                } else if (selection === 'Don\'t show again') {
                    config.update('ui.hasShownWelcome', true, vscode.ConfigurationTarget.Global);
                }
            });
        }
    }

    deactivate() {
        this.outputChannel.appendLine('🔄 Deactivating KnowledgeHub AI Intelligence...');
        
        // Cleanup resources
        this.liveContextStream.stop();
        this.aiEnhancementLayer.stop();
        this.knowledgeHubClient.disconnect();
        
        this.outputChannel.appendLine('✅ KnowledgeHub AI Intelligence deactivated');
    }
}

// VS Code extension entry points
let extension: KnowledgeHubExtension;

export function activate(context: vscode.ExtensionContext) {
    extension = new KnowledgeHubExtension();
    return extension.activate(context);
}

export function deactivate() {
    if (extension) {
        extension.deactivate();
    }
}