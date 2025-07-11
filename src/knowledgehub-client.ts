import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface AISessionInfo {
    sessionId: string;
    memories: number;
    tasks: number;
    predictedFocus: string;
    estimatedDuration: string;
    aiFeatures: string[];
}

export interface ProjectAnalysis {
    projectType: string;
    technologies: string[];
    patterns: string[];
    suggestions: string[];
    complexity: string;
    context: any;
}

export interface Memory {
    id: string;
    title: string;
    summary: string;
    type: string;
    timestamp: string;
    relevance: number;
}

export interface EnhancedContext {
    projectSummary: string;
    relevantDecisions: string[];
    relevantPatterns: string[];
    currentBranch: string;
    recentChanges: any;
    suggestions: string[];
}

export class KnowledgeHubClient {
    private client: AxiosInstance;
    private outputChannel: vscode.OutputChannel;
    private serverUrl: string;
    private currentSessionId?: string;

    constructor(serverUrl: string, outputChannel: vscode.OutputChannel) {
        this.serverUrl = serverUrl;
        this.outputChannel = outputChannel;
        
        this.client = axios.create({
            baseURL: serverUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'KnowledgeHub-VSCode-Extension/1.0.0'
            }
        });

        // Add request/response interceptors for logging
        this.client.interceptors.request.use(
            (config) => {
                this.outputChannel.appendLine(`📤 ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.outputChannel.appendLine(`❌ Request error: ${error.message}`);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                this.outputChannel.appendLine(`📥 ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                this.outputChannel.appendLine(`❌ Response error: ${error.message}`);
                return Promise.reject(error);
            }
        );
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.status === 200 && response.data.status === 'healthy';
        } catch (error) {
            this.outputChannel.appendLine(`Connection test failed: ${error}`);
            return false;
        }
    }

    async initializeAISession(): Promise<AISessionInfo> {
        try {
            const workspaceInfo = this.getWorkspaceInfo();
            
            const response = await this.client.post('/api/claude-auto/session/init', {
                workspace: workspaceInfo,
                timestamp: new Date().toISOString(),
                vscodeVersion: vscode.version,
                extensions: this.getInstalledExtensions()
            });

            this.currentSessionId = response.data.sessionId;
            
            return {
                sessionId: response.data.sessionId,
                memories: response.data.memoriesLoaded || 0,
                tasks: response.data.incompleteTasks || 0,
                predictedFocus: response.data.predictedFocus || 'Development',
                estimatedDuration: response.data.estimatedDuration || '2-3 hours',
                aiFeatures: response.data.aiFeatures || []
            };
        } catch (error) {
            throw new Error(`Failed to initialize AI session: ${error}`);
        }
    }

    async getEnhancedContext(request: {
        query: string;
        currentFile?: string;
        workspaceRoot?: string;
        recentChanges?: any;
    }): Promise<EnhancedContext> {
        try {
            const response = await this.client.post('/api/claude-auto/context/enhance', {
                ...request,
                sessionId: this.currentSessionId,
                vscodeContext: {
                    activeFile: vscode.window.activeTextEditor?.document.fileName,
                    workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                    gitBranch: await this.getCurrentGitBranch(),
                    openFiles: vscode.workspace.textDocuments.map(doc => doc.fileName),
                    recentEdits: this.getRecentEdits()
                }
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to get enhanced context: ${error}`);
        }
    }

    async analyzeProject(workspaceRoot: string): Promise<ProjectAnalysis> {
        try {
            const response = await this.client.post('/api/claude-auto/project/analyze', {
                workspaceRoot,
                sessionId: this.currentSessionId,
                includePatterns: true,
                includeSuggestions: true
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to analyze project: ${error}`);
        }
    }

    async getRecentMemories(limit: number = 10): Promise<Memory[]> {
        try {
            const response = await this.client.get(`/api/memory/context/quick/claude?limit=${limit}`);
            return response.data.memories || [];
        } catch (error) {
            throw new Error(`Failed to get recent memories: ${error}`);
        }
    }

    async trackCodeChange(change: {
        file: string;
        changes: vscode.TextDocumentContentChangeEvent[];
        timestamp: string;
    }): Promise<void> {
        try {
            await this.client.post('/api/claude-auto/code/track', {
                ...change,
                sessionId: this.currentSessionId
            });
        } catch (error) {
            this.outputChannel.appendLine(`Failed to track code change: ${error}`);
        }
    }

    async recordDecision(decision: {
        description: string;
        alternatives: string[];
        reasoning: string;
        confidence: number;
    }): Promise<void> {
        try {
            await this.client.post('/api/claude-auto/decision/record', {
                ...decision,
                sessionId: this.currentSessionId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.outputChannel.appendLine(`Failed to record decision: ${error}`);
        }
    }

    async learnFromError(error: {
        message: string;
        stack?: string;
        context: any;
        solution?: string;
    }): Promise<void> {
        try {
            await this.client.post('/api/claude-auto/learning/error', {
                ...error,
                sessionId: this.currentSessionId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.outputChannel.appendLine(`Failed to record error learning: ${error}`);
        }
    }

    async getDashboardUrl(): Promise<string> {
        return `${this.serverUrl}/ai-dashboard`;
    }

    private getWorkspaceInfo() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        return {
            name: workspaceFolder?.name || 'Unknown',
            path: workspaceFolder?.uri.fsPath || '',
            language: vscode.window.activeTextEditor?.document.languageId || 'unknown',
            files: vscode.workspace.textDocuments.length
        };
    }

    private getInstalledExtensions(): string[] {
        return vscode.extensions.all
            .filter(ext => ext.isActive)
            .map(ext => ext.id);
    }

    private async getCurrentGitBranch(): Promise<string> {
        try {
            // Use VS Code's built-in Git extension
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension?.isActive) {
                const git = gitExtension.exports.getAPI(1);
                const repo = git.repositories[0];
                return repo?.state?.HEAD?.name || 'main';
            }
        } catch (error) {
            this.outputChannel.appendLine(`Failed to get Git branch: ${error}`);
        }
        return 'main';
    }

    private getRecentEdits(): any[] {
        // Track recent edits in memory for context
        // This would be implemented with actual change tracking
        return [];
    }

    disconnect(): void {
        // Cleanup any connections
        this.outputChannel.appendLine('🔌 Disconnected from KnowledgeHub');
    }
}