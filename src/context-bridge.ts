import * as vscode from 'vscode';
import { KnowledgeHubClient, EnhancedContext } from './knowledgehub-client';

export interface AIProviderExtension {
    id: string;
    name: string;
    displayName: string;
    extension: vscode.Extension<any>;
    apiVersion?: string;
}

export class ContextBridge {
    private knowledgeHub: KnowledgeHubClient;
    private bridgedProviders: Map<string, AIProviderExtension> = new Map();

    constructor(knowledgeHub: KnowledgeHubClient) {
        this.knowledgeHub = knowledgeHub;
    }

    async bridgeContextToAI(providerName: string, extension: vscode.Extension<any>): Promise<boolean> {
        try {
            switch (providerName) {
                case 'github.copilot':
                    return await this.bridgeToCopilot(extension);
                
                case 'continue.continue':
                    return await this.bridgeToCline(extension);
                
                case 'anthropic.claude-dev':
                    return await this.bridgeToClaudeDev(extension);
                
                default:
                    return await this.bridgeToGenericAI(providerName, extension);
            }
        } catch (error) {
            console.error(`Failed to bridge context to ${providerName}:`, error);
            return false;
        }
    }

    private async bridgeToCopilot(extension: vscode.Extension<any>): Promise<boolean> {
        try {
            // GitHub Copilot integration
            console.log('🔗 Bridging context to GitHub Copilot...');
            
            // Register enhanced completion provider that wraps Copilot
            const provider = vscode.languages.registerInlineCompletionItemProvider(
                '*', // All file types
                {
                    provideInlineCompletionItems: async (document, position, context, token) => {
                        return this.enhanceCopilotCompletions(document, position, context, token);
                    }
                }
            );

            this.bridgedProviders.set('github.copilot', {
                id: 'github.copilot',
                name: 'copilot',
                displayName: 'GitHub Copilot',
                extension,
                apiVersion: '1.0'
            });

            return true;
        } catch (error) {
            console.error('Failed to bridge to Copilot:', error);
            return false;
        }
    }

    private async bridgeToCline(extension: vscode.Extension<any>): Promise<boolean> {
        try {
            // Continue/Cline integration
            console.log('🔗 Bridging context to Cline...');
            
            // Hook into Continue's API if available
            if (extension.exports && extension.exports.registerContextProvider) {
                extension.exports.registerContextProvider({
                    name: 'knowledgehub',
                    getContext: async (query: string) => {
                        const enhancedContext = await this.knowledgeHub.getEnhancedContext({
                            query,
                            currentFile: vscode.window.activeTextEditor?.document.fileName,
                            workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                        });
                        
                        return this.formatContextForCline(enhancedContext);
                    }
                });
            }

            this.bridgedProviders.set('continue.continue', {
                id: 'continue.continue',
                name: 'cline',
                displayName: 'Cline',
                extension,
                apiVersion: '1.0'
            });

            return true;
        } catch (error) {
            console.error('Failed to bridge to Cline:', error);
            return false;
        }
    }

    private async bridgeToClaudeDev(extension: vscode.Extension<any>): Promise<boolean> {
        try {
            // Claude Dev integration
            console.log('🔗 Bridging context to Claude Dev...');
            
            // Hook into Claude Dev's context system
            if (extension.exports && extension.exports.addContextProvider) {
                extension.exports.addContextProvider({
                    name: 'KnowledgeHub AI Intelligence',
                    getContext: async (request: any) => {
                        const enhancedContext = await this.knowledgeHub.getEnhancedContext({
                            query: request.prompt || request.query,
                            currentFile: request.currentFile,
                            workspaceRoot: request.workspaceRoot
                        });
                        
                        return this.formatContextForClaudeDev(enhancedContext);
                    }
                });
            }

            this.bridgedProviders.set('anthropic.claude-dev', {
                id: 'anthropic.claude-dev',
                name: 'claude-dev',
                displayName: 'Claude Dev',
                extension,
                apiVersion: '1.0'
            });

            return true;
        } catch (error) {
            console.error('Failed to bridge to Claude Dev:', error);
            return false;
        }
    }

    private async bridgeToGenericAI(providerName: string, extension: vscode.Extension<any>): Promise<boolean> {
        try {
            console.log(`🔗 Bridging context to generic AI provider: ${providerName}...`);
            
            // Generic AI provider bridge
            // This would use common patterns for AI extension integration
            
            this.bridgedProviders.set(providerName, {
                id: providerName,
                name: providerName.split('.').pop() || providerName,
                displayName: extension.packageJSON.displayName || providerName,
                extension,
                apiVersion: 'generic'
            });

            return true;
        } catch (error) {
            console.error(`Failed to bridge to ${providerName}:`, error);
            return false;
        }
    }

    private async enhanceCopilotCompletions(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | undefined> {
        
        try {
            // Get context from current cursor position
            const lineText = document.lineAt(position).text;
            const textBeforeCursor = lineText.substring(0, position.character);
            const textAfterCursor = lineText.substring(position.character);
            
            // Get enhanced context from KnowledgeHub
            const enhancedContext = await this.knowledgeHub.getEnhancedContext({
                query: textBeforeCursor,
                currentFile: document.fileName,
                workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
            });

            // Create enhanced completion context
            const enhancedPrompt = this.createEnhancedCompletionPrompt(
                textBeforeCursor,
                textAfterCursor,
                enhancedContext,
                document
            );

            // Note: In a real implementation, this would call the actual Copilot API
            // with the enhanced context. For now, we return undefined to let the
            // original Copilot handle the completion, but the context would be enhanced.
            
            return undefined;
            
        } catch (error) {
            console.error('Failed to enhance Copilot completion:', error);
            return undefined;
        }
    }

    private createEnhancedCompletionPrompt(
        textBefore: string,
        textAfter: string,
        context: EnhancedContext,
        document: vscode.TextDocument
    ): string {
        return `
# Enhanced Completion Context

## File: ${document.fileName}
## Language: ${document.languageId}

## Project Context:
${context.projectSummary}

## Relevant Patterns:
${context.relevantPatterns.slice(0, 3).join('\n')}

## Code Context:
\`\`\`${document.languageId}
${textBefore}█${textAfter}
\`\`\`

## Suggestions:
${context.suggestions.slice(0, 2).join('\n')}

Complete the code at the cursor position (█) considering the project context and patterns.
`;
    }

    private formatContextForCline(context: EnhancedContext): any {
        return {
            type: 'knowledgehub',
            content: {
                projectSummary: context.projectSummary,
                patterns: context.relevantPatterns,
                decisions: context.relevantDecisions,
                suggestions: context.suggestions
            },
            metadata: {
                source: 'KnowledgeHub AI Intelligence',
                timestamp: new Date().toISOString()
            }
        };
    }

    private formatContextForClaudeDev(context: EnhancedContext): any {
        return {
            contextType: 'project-intelligence',
            data: {
                summary: context.projectSummary,
                patterns: context.relevantPatterns,
                decisions: context.relevantDecisions,
                suggestions: context.suggestions,
                branch: context.currentBranch
            },
            source: 'KnowledgeHub'
        };
    }

    getBridgedProviders(): AIProviderExtension[] {
        return Array.from(this.bridgedProviders.values());
    }

    isBridged(providerId: string): boolean {
        return this.bridgedProviders.has(providerId);
    }
}