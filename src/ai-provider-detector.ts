import * as vscode from 'vscode';

export interface DetectedAIProvider {
    id: string;
    name: string;
    displayName: string;
    extension: vscode.Extension<any>;
    isActive: boolean;
    version: string;
    capabilities: string[];
}

export class AIProviderDetector {
    private knownProviders: Map<string, AIProviderInfo> = new Map();

    constructor() {
        this.initializeKnownProviders();
    }

    private initializeKnownProviders(): void {
        // GitHub Copilot
        this.knownProviders.set('github.copilot', {
            name: 'github.copilot',
            displayName: 'GitHub Copilot',
            capabilities: ['code-completion', 'inline-completion', 'chat'],
            apiMethods: ['getCompletions', 'getInlineCompletions']
        });

        // Continue (Cline)
        this.knownProviders.set('continue.continue', {
            name: 'continue.continue',
            displayName: 'Continue (Cline)',
            capabilities: ['chat', 'code-generation', 'context-aware'],
            apiMethods: ['registerContextProvider', 'addContextProvider']
        });

        // Claude Dev
        this.knownProviders.set('anthropic.claude-dev', {
            name: 'anthropic.claude-dev',
            displayName: 'Claude Dev',
            capabilities: ['chat', 'code-generation', 'file-operations'],
            apiMethods: ['addContextProvider', 'registerProvider']
        });

        // Codeium
        this.knownProviders.set('codeium.codeium', {
            name: 'codeium.codeium',
            displayName: 'Codeium',
            capabilities: ['code-completion', 'inline-completion'],
            apiMethods: ['provideInlineCompletionItems']
        });

        // TabNine
        this.knownProviders.set('tabnine.tabnine-vscode', {
            name: 'tabnine.tabnine-vscode',
            displayName: 'TabNine',
            capabilities: ['code-completion', 'inline-completion'],
            apiMethods: ['provideCompletionItems']
        });

        // IntelliCode
        this.knownProviders.set('visualstudioexptteam.vscodeintellicode', {
            name: 'visualstudioexptteam.vscodeintellicode',
            displayName: 'Visual Studio IntelliCode',
            capabilities: ['code-completion', 'suggestions'],
            apiMethods: ['provideCompletionItems']
        });

        // Kite (if still active)
        this.knownProviders.set('kiteco.kite', {
            name: 'kiteco.kite',
            displayName: 'Kite',
            capabilities: ['code-completion', 'documentation'],
            apiMethods: ['provideCompletionItems']
        });

        // AWS CodeWhisperer
        this.knownProviders.set('amazonwebservices.aws-toolkit-vscode', {
            name: 'amazonwebservices.aws-toolkit-vscode',
            displayName: 'AWS CodeWhisperer',
            capabilities: ['code-completion', 'inline-completion'],
            apiMethods: ['provideInlineCompletionItems']
        });

        // JetBrains AI Assistant (if available for VS Code)
        this.knownProviders.set('jetbrains.ai-assistant', {
            name: 'jetbrains.ai-assistant',
            displayName: 'JetBrains AI Assistant',
            capabilities: ['chat', 'code-generation'],
            apiMethods: ['registerProvider']
        });

        // Aider
        this.knownProviders.set('aider.aider-vscode', {
            name: 'aider.aider-vscode',
            displayName: 'Aider',
            capabilities: ['chat', 'code-generation', 'git-aware'],
            apiMethods: ['registerContextProvider']
        });
    }

    async detectProviders(): Promise<DetectedAIProvider[]> {
        const detectedProviders: DetectedAIProvider[] = [];
        const allExtensions = vscode.extensions.all;

        // Check known providers
        for (const [extensionId, providerInfo] of this.knownProviders) {
            const extension = allExtensions.find(ext => ext.id === extensionId);
            
            if (extension) {
                detectedProviders.push({
                    id: extensionId,
                    name: providerInfo.name,
                    displayName: providerInfo.displayName,
                    extension,
                    isActive: extension.isActive,
                    version: extension.packageJSON.version || 'unknown',
                    capabilities: providerInfo.capabilities
                });
            }
        }

        // Detect unknown AI providers by analyzing extension metadata
        const unknownAIProviders = this.detectUnknownAIProviders(allExtensions);
        detectedProviders.push(...unknownAIProviders);

        return detectedProviders.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    private detectUnknownAIProviders(extensions: readonly vscode.Extension<any>[]): DetectedAIProvider[] {
        const unknownProviders: DetectedAIProvider[] = [];
        
        for (const extension of extensions) {
            // Skip if already known
            if (this.knownProviders.has(extension.id)) {
                continue;
            }

            // Check if extension might be an AI provider
            if (this.isLikelyAIProvider(extension)) {
                unknownProviders.push({
                    id: extension.id,
                    name: extension.id,
                    displayName: extension.packageJSON.displayName || extension.id,
                    extension,
                    isActive: extension.isActive,
                    version: extension.packageJSON.version || 'unknown',
                    capabilities: this.inferCapabilities(extension)
                });
            }
        }

        return unknownProviders;
    }

    private isLikelyAIProvider(extension: vscode.Extension<any>): boolean {
        const packageJSON = extension.packageJSON;
        
        // Check various indicators that this might be an AI provider
        const indicators = [
            // Keywords in description or name
            this.containsAIKeywords(packageJSON.description || ''),
            this.containsAIKeywords(packageJSON.displayName || ''),
            this.containsAIKeywords((packageJSON.keywords || []).join(' ')),
            
            // Categories
            this.hasAICategory(packageJSON.categories || []),
            
            // Commands that suggest AI functionality
            this.hasAICommands(packageJSON.contributes?.commands || []),
            
            // Contributions that suggest completion providers
            this.hasCompletionProviders(packageJSON.contributes || {}),
        ];

        // Must have at least 2 indicators to be considered likely
        return indicators.filter(Boolean).length >= 2;
    }

    private containsAIKeywords(text: string): boolean {
        const aiKeywords = [
            'ai', 'artificial intelligence', 'machine learning', 'ml',
            'copilot', 'assistant', 'autocomplete', 'completion',
            'smart', 'intelligent', 'suggestion', 'predict',
            'claude', 'gpt', 'openai', 'anthropic', 'codeium',
            'tabnine', 'kite', 'intellicode', 'codewhisperer'
        ];
        
        const lowerText = text.toLowerCase();
        return aiKeywords.some(keyword => lowerText.includes(keyword));
    }

    private hasAICategory(categories: string[]): boolean {
        const aiCategories = [
            'AI', 'Machine Learning', 'Artificial Intelligence',
            'Productivity', 'Code Completion', 'Assistant'
        ];
        
        return categories.some(category => 
            aiCategories.some(aiCat => 
                category.toLowerCase().includes(aiCat.toLowerCase())
            )
        );
    }

    private hasAICommands(commands: any[]): boolean {
        const aiCommandKeywords = [
            'complete', 'suggest', 'ai', 'assistant', 'generate',
            'chat', 'ask', 'help', 'smart', 'auto'
        ];
        
        return commands.some(command => 
            aiCommandKeywords.some(keyword => 
                (command.command || '').toLowerCase().includes(keyword) ||
                (command.title || '').toLowerCase().includes(keyword)
            )
        );
    }

    private hasCompletionProviders(contributes: any): boolean {
        return !!(
            contributes.completionProviders ||
            contributes.inlineCompletionProviders ||
            contributes.languages
        );
    }

    private inferCapabilities(extension: vscode.Extension<any>): string[] {
        const capabilities: string[] = [];
        const packageJSON = extension.packageJSON;
        
        // Infer capabilities from contributes
        const contributes = packageJSON.contributes || {};
        
        if (contributes.completionProviders || contributes.inlineCompletionProviders) {
            capabilities.push('code-completion');
        }
        
        if (contributes.commands) {
            const commands = contributes.commands || [];
            if (commands.some((cmd: any) => 
                (cmd.title || '').toLowerCase().includes('chat') ||
                (cmd.command || '').toLowerCase().includes('chat')
            )) {
                capabilities.push('chat');
            }
        }
        
        // Default capability
        if (capabilities.length === 0) {
            capabilities.push('unknown');
        }
        
        return capabilities;
    }

    async getProviderAPI(providerId: string): Promise<any> {
        const extension = vscode.extensions.getExtension(providerId);
        
        if (!extension) {
            return null;
        }

        if (!extension.isActive) {
            try {
                await extension.activate();
            } catch (error) {
                console.error(`Failed to activate extension ${providerId}:`, error);
                return null;
            }
        }

        return extension.exports;
    }

    isKnownProvider(providerId: string): boolean {
        return this.knownProviders.has(providerId);
    }

    getProviderInfo(providerId: string): AIProviderInfo | undefined {
        return this.knownProviders.get(providerId);
    }

    async waitForProviderActivation(providerId: string, timeout: number = 5000): Promise<boolean> {
        const extension = vscode.extensions.getExtension(providerId);
        
        if (!extension) {
            return false;
        }

        if (extension.isActive) {
            return true;
        }

        return new Promise<boolean>((resolve) => {
            const timer = setTimeout(() => resolve(false), timeout);
            
            Promise.resolve(extension.activate()).then(() => {
                clearTimeout(timer);
                resolve(true);
            }).catch(() => {
                clearTimeout(timer);
                resolve(false);
            });
        });
    }
}

interface AIProviderInfo {
    name: string;
    displayName: string;
    capabilities: string[];
    apiMethods: string[];
}