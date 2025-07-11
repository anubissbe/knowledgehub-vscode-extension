import * as vscode from 'vscode';
import { KnowledgeHubClient } from './knowledgehub-client';

export interface LiveContext {
    recentChanges: DocumentChange[];
    currentFocus: string;
    projectState: any;
    activePatterns: string[];
}

export interface DocumentChange {
    file: string;
    changes: vscode.TextDocumentContentChangeEvent[];
    timestamp: number;
    language: string;
}

export class LiveContextStream {
    private knowledgeHub: KnowledgeHubClient;
    private contextBuffer: ContextBuffer;
    private disposables: vscode.Disposable[] = [];
    private isActive: boolean = false;
    private contextUpdateTimer?: NodeJS.Timeout;

    constructor(knowledgeHub: KnowledgeHubClient) {
        this.knowledgeHub = knowledgeHub;
        this.contextBuffer = new ContextBuffer();
    }

    async startContextTracking(): Promise<void> {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        
        // Track document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(this.onDocumentChange.bind(this))
        );

        // Track active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(this.onEditorChange.bind(this))
        );

        // Track document saves
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(this.onDocumentSave.bind(this))
        );

        // Track workspace folder changes
        this.disposables.push(
            vscode.workspace.onDidChangeWorkspaceFolders(this.onWorkspaceFolderChange.bind(this))
        );

        // Track selection changes
        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection(this.onSelectionChange.bind(this))
        );

        // Periodic context updates
        this.contextUpdateTimer = setInterval(
            this.updateContextPeriodically.bind(this),
            5000 // Every 5 seconds
        );

        console.log('📊 Live context tracking started');
    }

    stop(): void {
        this.isActive = false;
        
        // Dispose all event listeners
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];

        // Clear timer
        if (this.contextUpdateTimer) {
            clearInterval(this.contextUpdateTimer);
            this.contextUpdateTimer = undefined;
        }

        console.log('📊 Live context tracking stopped');
    }

    async getLatestContext(): Promise<LiveContext> {
        return {
            recentChanges: this.contextBuffer.getRecentChanges(),
            currentFocus: await this.getCurrentFocus(),
            projectState: await this.getProjectState(),
            activePatterns: await this.getActivePatterns()
        };
    }

    private async onDocumentChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
        if (!this.isActive || event.document.uri.scheme !== 'file') {
            return;
        }

        const change: DocumentChange = {
            file: event.document.fileName,
            changes: Array.from(event.contentChanges),
            timestamp: Date.now(),
            language: event.document.languageId
        };

        // Add to context buffer
        this.contextBuffer.addChange(change);

        // Track with KnowledgeHub (async, don't wait)
        this.knowledgeHub.trackCodeChange({
            file: event.document.fileName,
            changes: Array.from(event.contentChanges),
            timestamp: new Date().toISOString()
        }).catch(error => {
            console.error('Failed to track code change:', error);
        });
    }

    private async onEditorChange(editor: vscode.TextEditor | undefined): Promise<void> {
        if (!this.isActive || !editor) {
            return;
        }

        this.contextBuffer.setCurrentFile(editor.document.fileName);
        
        // Update focus context
        await this.updateCurrentFocus(editor.document.fileName);
    }

    private async onDocumentSave(document: vscode.TextDocument): Promise<void> {
        if (!this.isActive || document.uri.scheme !== 'file') {
            return;
        }

        // Record save event
        this.contextBuffer.addSaveEvent(document.fileName);
        
        // Trigger context analysis
        await this.analyzeChangesOnSave(document.fileName);
    }

    private async onWorkspaceFolderChange(event: vscode.WorkspaceFoldersChangeEvent): Promise<void> {
        if (!this.isActive) {
            return;
        }

        // Update project context when workspace changes
        await this.updateProjectState();
    }

    private async onSelectionChange(event: vscode.TextEditorSelectionChangeEvent): Promise<void> {
        if (!this.isActive) {
            return;
        }

        // Track selection patterns for context
        this.contextBuffer.addSelectionChange({
            file: event.textEditor.document.fileName,
            selection: event.selections[0],
            timestamp: Date.now()
        });
    }

    private async updateContextPeriodically(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        try {
            // Periodic context sync with KnowledgeHub
            const context = await this.getLatestContext();
            
            // Update KnowledgeHub with current context
            // This keeps the AI system updated with latest development state
            
        } catch (error) {
            console.error('Failed to update context periodically:', error);
        }
    }

    private async getCurrentFocus(): Promise<string> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return 'No active file';
        }

        const fileName = activeEditor.document.fileName;
        const language = activeEditor.document.languageId;
        const lineCount = activeEditor.document.lineCount;
        
        return `${language} file: ${fileName} (${lineCount} lines)`;
    }

    private async getProjectState(): Promise<any> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return { state: 'no-workspace' };
        }

        return {
            name: workspaceFolder.name,
            path: workspaceFolder.uri.fsPath,
            openFiles: vscode.workspace.textDocuments.length,
            languages: this.getActiveLanguages(),
            recentActivity: this.contextBuffer.getActivitySummary()
        };
    }

    private async getActivePatterns(): Promise<string[]> {
        // Analyze recent changes for patterns
        const recentChanges = this.contextBuffer.getRecentChanges();
        const patterns: string[] = [];

        // Detect common patterns in recent changes
        const languages = new Set(recentChanges.map(change => change.language));
        patterns.push(...Array.from(languages).map(lang => `${lang} development`));

        // Detect file patterns
        const fileTypes = new Set(recentChanges.map(change => 
            change.file.split('.').pop() || 'unknown'
        ));
        patterns.push(...Array.from(fileTypes).map(type => `${type} files`));

        return patterns;
    }

    private getActiveLanguages(): string[] {
        return Array.from(new Set(
            vscode.workspace.textDocuments.map(doc => doc.languageId)
        ));
    }

    private async updateCurrentFocus(fileName: string): Promise<void> {
        // Update focus context in KnowledgeHub
        // This helps the AI understand what the developer is currently working on
    }

    private async analyzeChangesOnSave(fileName: string): Promise<void> {
        // Analyze changes when file is saved
        // This can trigger learning and pattern recognition
        const recentChanges = this.contextBuffer.getChangesForFile(fileName);
        
        if (recentChanges.length > 0) {
            // Send to KnowledgeHub for analysis
            // This helps build understanding of development patterns
        }
    }

    private async updateProjectState(): Promise<void> {
        // Update project state when workspace changes
        // This helps maintain accurate project context
    }
}

class ContextBuffer {
    private changes: DocumentChange[] = [];
    private saves: { file: string; timestamp: number }[] = [];
    private selections: any[] = [];
    private currentFile: string = '';
    private maxBufferSize: number = 100;

    addChange(change: DocumentChange): void {
        this.changes.push(change);
        
        // Keep buffer size manageable
        if (this.changes.length > this.maxBufferSize) {
            this.changes = this.changes.slice(-this.maxBufferSize);
        }
    }

    addSaveEvent(file: string): void {
        this.saves.push({ file, timestamp: Date.now() });
        
        if (this.saves.length > 50) {
            this.saves = this.saves.slice(-50);
        }
    }

    addSelectionChange(selection: any): void {
        this.selections.push(selection);
        
        if (this.selections.length > 20) {
            this.selections = this.selections.slice(-20);
        }
    }

    setCurrentFile(file: string): void {
        this.currentFile = file;
    }

    getRecentChanges(minutes: number = 10): DocumentChange[] {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.changes.filter(change => change.timestamp > cutoff);
    }

    getChangesForFile(file: string): DocumentChange[] {
        return this.changes.filter(change => change.file === file);
    }

    getActivitySummary(): any {
        const now = Date.now();
        const hour = 60 * 60 * 1000;
        
        return {
            changesLastHour: this.changes.filter(c => c.timestamp > now - hour).length,
            savesLastHour: this.saves.filter(s => s.timestamp > now - hour).length,
            activeFiles: new Set(this.changes.map(c => c.file)).size,
            currentFile: this.currentFile
        };
    }
}