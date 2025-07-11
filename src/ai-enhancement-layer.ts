import * as vscode from 'vscode';
import { KnowledgeHubClient, EnhancedContext } from './knowledgehub-client';

export interface AIRequest {
    prompt: string;
    context?: any;
    provider?: string;
    model?: string;
}

export interface EnhancedAIRequest extends AIRequest {
    enhancedPrompt: string;
    knowledgeHubContext: EnhancedContext;
    vscodeContext: VSCodeContext;
}

export interface VSCodeContext {
    activeFile: string;
    workspaceRoot: string;
    gitBranch: string;
    openFiles: string[];
    recentChanges: any[];
    cursorPosition?: vscode.Position;
    selectedText?: string;
}

export class AIEnhancementLayer {
    private knowledgeHub: KnowledgeHubClient;
    private isActive: boolean = false;
    private requestInterceptors: Map<string, Function> = new Map();

    constructor(knowledgeHub: KnowledgeHubClient) {
        this.knowledgeHub = knowledgeHub;
    }

    async start(): Promise<void> {
        this.isActive = true;
        
        // Register interceptors for known AI providers
        await this.registerCopilotInterceptor();
        await this.registerClineInterceptor();
        await this.registerClaudeDevInterceptor();
        await this.registerGenericAIInterceptor();
    }

    stop(): void {
        this.isActive = false;
        this.requestInterceptors.clear();
    }

    async enhanceAIRequest(originalRequest: AIRequest): Promise<EnhancedAIRequest> {
        if (!this.isActive) {
            return originalRequest as EnhancedAIRequest;
        }

        try {
            // Gather VS Code context
            const vscodeContext = await this.gatherVSCodeContext();
            
            // Get KnowledgeHub enhanced context
            const knowledgeHubContext = await this.knowledgeHub.getEnhancedContext({
                query: originalRequest.prompt,
                currentFile: vscodeContext.activeFile,
                workspaceRoot: vscodeContext.workspaceRoot,
                recentChanges: vscodeContext.recentChanges
            });

            // Create enhanced prompt
            const enhancedPrompt = await this.createEnhancedPrompt(
                originalRequest.prompt,
                knowledgeHubContext,
                vscodeContext
            );

            return {
                ...originalRequest,
                enhancedPrompt,
                knowledgeHubContext,
                vscodeContext
            };
        } catch (error) {
            console.error('Failed to enhance AI request:', error);
            return originalRequest as EnhancedAIRequest;
        }
    }

    private async registerCopilotInterceptor(): Promise<void> {
        try {
            const copilotExtension = vscode.extensions.getExtension('github.copilot');
            if (copilotExtension?.isActive) {
                // Intercept Copilot completion requests
                this.interceptCopilotCompletions();
                console.log('✅ GitHub Copilot interceptor registered');
            }
        } catch (error) {
            console.error('Failed to register Copilot interceptor:', error);
        }
    }

    private async registerClineInterceptor(): Promise<void> {
        try {
            const clineExtension = vscode.extensions.getExtension('continue.continue');
            if (clineExtension?.isActive) {
                // Intercept Cline requests
                this.interceptClineRequests();
                console.log('✅ Cline interceptor registered');
            }
        } catch (error) {
            console.error('Failed to register Cline interceptor:', error);
        }
    }

    private async registerClaudeDevInterceptor(): Promise<void> {
        try {
            const claudeDevExtension = vscode.extensions.getExtension('anthropic.claude-dev');
            if (claudeDevExtension?.isActive) {
                // Intercept Claude Dev requests
                this.interceptClaudeDevRequests();
                console.log('✅ Claude Dev interceptor registered');
            }
        } catch (error) {
            console.error('Failed to register Claude Dev interceptor:', error);
        }
    }

    private async registerGenericAIInterceptor(): Promise<void> {
        // Register generic interceptor for any AI completion providers
        vscode.languages.registerInlineCompletionItemProvider(
            '*',
            {
                provideInlineCompletionItems: async (document, position, context, token) => {
                    return this.enhanceInlineCompletion(document, position, context, token);
                }
            }
        );
        console.log('✅ Generic AI interceptor registered');
    }

    private interceptCopilotCompletions(): void {
        // Hook into Copilot's completion mechanism
        // Note: This is a conceptual implementation - actual Copilot API integration would require their SDK
        console.log('🔌 Intercepting Copilot completions...');
        
        // Register enhanced completion provider
        vscode.languages.registerCompletionItemProvider(
            '*',
            {
                provideCompletionItems: async (document, position, token, context) => {
                    // This would enhance Copilot completions with KnowledgeHub context
                    return [];
                }
            }
        );
    }

    private interceptClineRequests(): void {
        // Hook into Cline/Continue requests
        // This would require access to Continue's internal APIs
        console.log('🔌 Intercepting Cline requests...');
    }

    private interceptClaudeDevRequests(): void {
        // Hook into Claude Dev requests
        console.log('🔌 Intercepting Claude Dev requests...');
    }

    private async enhanceInlineCompletion(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        
        // Get context around cursor position
        const lineText = document.lineAt(position).text;
        const textBeforeCursor = lineText.substring(0, position.character);
        
        // Create enhanced request
        const enhancedRequest = await this.enhanceAIRequest({
            prompt: textBeforeCursor,
            context: {
                document: document.fileName,
                position,
                lineText
            }
        });

        // Return enhanced completion items
        // Note: This is a simplified example - actual implementation would
        // depend on the specific AI provider's API
        return [];
    }

    private async enhanceCompletionItems(items: vscode.CompletionItem[]): Promise<vscode.CompletionItem[]> {
        // Enhance completion items with KnowledgeHub insights
        return items.map(item => {
            // Add KnowledgeHub context to completion items
            item.detail = `${item.detail || ''} (Enhanced by KnowledgeHub)`;
            return item;
        });
    }

    private async gatherVSCodeContext(): Promise<VSCodeContext> {
        const activeEditor = vscode.window.activeTextEditor;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        return {
            activeFile: activeEditor?.document.fileName || '',
            workspaceRoot: workspaceFolder?.uri.fsPath || '',
            gitBranch: await this.getCurrentGitBranch(),
            openFiles: vscode.workspace.textDocuments.map(doc => doc.fileName),
            recentChanges: this.getRecentChanges(),
            cursorPosition: activeEditor?.selection.active,
            selectedText: activeEditor?.document.getText(activeEditor.selection)
        };
    }

    private async createEnhancedPrompt(
        originalPrompt: string,
        knowledgeHubContext: EnhancedContext,
        vscodeContext: VSCodeContext
    ): Promise<string> {
        const config = vscode.workspace.getConfiguration('knowledgehub');
        const enhancementLevel = config.get<string>('ai.enhancementLevel', 'maximum');

        if (enhancementLevel === 'minimal') {
            return `${originalPrompt}\n\n[Project: ${vscodeContext.workspaceRoot}]`;
        }

        if (enhancementLevel === 'standard') {
            return `
# Context from KnowledgeHub AI Intelligence

## Current File: ${vscodeContext.activeFile}
## Git Branch: ${vscodeContext.gitBranch}

## Recent Project Patterns:
${knowledgeHubContext.relevantPatterns.slice(0, 3).join('\n')}

## Original Request:
${originalPrompt}
`;
        }

        // Maximum enhancement
        return `
# Enhanced Context from KnowledgeHub AI Intelligence

## Project Context:
${knowledgeHubContext.projectSummary}

## Relevant Past Decisions:
${knowledgeHubContext.relevantDecisions.slice(0, 3).map(decision => `- ${decision}`).join('\n')}

## Known Patterns for This Task:
${knowledgeHubContext.relevantPatterns.slice(0, 5).map(pattern => `- ${pattern}`).join('\n')}

## Current Development Context:
- **File**: ${vscodeContext.activeFile}
- **Git Branch**: ${vscodeContext.gitBranch}
- **Workspace**: ${vscodeContext.workspaceRoot}
- **Selected Text**: ${vscodeContext.selectedText ? `"${vscodeContext.selectedText}"` : 'None'}

## AI Suggestions:
${knowledgeHubContext.suggestions.slice(0, 3).map(suggestion => `- ${suggestion}`).join('\n')}

## Original Request:
${originalPrompt}

---
Please provide a response that considers the full project context, learned patterns, and past decisions. Focus on consistency with existing codebase patterns and architectural decisions.
`;
    }

    private async getCurrentGitBranch(): Promise<string> {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension?.isActive) {
                const git = gitExtension.exports.getAPI(1);
                const repo = git.repositories[0];
                return repo?.state?.HEAD?.name || 'main';
            }
        } catch (error) {
            console.error('Failed to get Git branch:', error);
        }
        return 'main';
    }

    private getRecentChanges(): any[] {
        // This would track recent document changes
        // For now, return empty array
        return [];
    }
}