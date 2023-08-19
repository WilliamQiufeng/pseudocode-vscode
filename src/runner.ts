"use strict";
import * as fs from "fs";
import * as micromatch from "micromatch";
import * as os from "os";
import { basename, dirname, extname, join } from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";

const TmpDir = os.tmpdir();

export class CodeManager implements vscode.Disposable {
    private _terminal: vscode.Terminal;
    private _codeFile: string;
    private _cwd: string;
    private _document: vscode.TextDocument;
    private _workspaceFolder: string;
    private _config: vscode.WorkspaceConfiguration;
    private _runFromExplorer: any;

    constructor() {
        this._terminal = null;
    }
    dispose() {
    }

    public onDidCloseTerminal(): void {
        this._terminal = null;
    }

    public async getCurrentFile(fileUri: Uri) {

        this._runFromExplorer = this.checkIsRunFromExplorer(fileUri);
        if (this._runFromExplorer) {
            this._document = await vscode.workspace.openTextDocument(fileUri);
        } else {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                this._document = editor.document;
            } else {
                vscode.window.showInformationMessage("No code found or selected.");
                return;
            }
        }
        return this._document;
    }


    private checkIsRunFromExplorer(fileUri: vscode.Uri): boolean {
        const editor = vscode.window.activeTextEditor;
        if (!fileUri || !fileUri.fsPath) {
            return false;
        }
        if (!editor) {
            return true;
        }
        if (fileUri.fsPath === editor.document.uri.fsPath) {
            return false;
        }
        return true;
    }
    private initialize(): void {
        this._config = this.getConfiguration("caie-pseudocode");
        // this._cwd = this._config.get<string>("cwd");
        // if (this._cwd) {
        //     return;
        // }
        // this._workspaceFolder = this.getWorkspaceFolder();
        // if ((this._config.get<boolean>("fileDirectoryAsCwd") || !this._workspaceFolder)
        //     && this._document && !this._document.isUntitled) {
        //     this._cwd = dirname(this._document.fileName);
        // } else {
        //     this._cwd = this._workspaceFolder;
        // }
        // if (this._cwd) {
        //     return;
        // }
        // this._cwd = TmpDir;
    }

    private getConfiguration(section?: string): vscode.WorkspaceConfiguration {
        if (this._document) {
            return vscode.workspace.getConfiguration(section, this._document.uri);
        } else {
            return vscode.workspace.getConfiguration(section);
        }
    }

    private getWorkspaceFolder(): string {
        if (vscode.workspace.workspaceFolders) {
            if (this._document) {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(this._document.uri);
                if (workspaceFolder) {
                    return workspaceFolder.uri.fsPath;
                }
            }
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            return undefined;
        }
    }

    private getWorkspaceRoot(codeFileDir: string): string {
        return this._workspaceFolder ? this._workspaceFolder : codeFileDir;
    }

    /**
     * Gets the base name of the code file, that is without its directory.
     */
    private getCodeBaseFile(): string {
        const regexMatch = this._codeFile.match(/.*[\/\\](.*)/);
        return regexMatch ? regexMatch[1] : this._codeFile;
    }

    /**
     * Gets the code file name without its directory and extension.
     */
    private getCodeFileWithoutDirAndExt(): string {
        const regexMatch = this._codeFile.match(/.*[\/\\](.*(?=\..*))/);
        return regexMatch ? regexMatch[1] : this._codeFile;
    }

    /**
     * Gets the directory of the code file.
     */
    private getCodeFileDir(): string {
        const regexMatch = this._codeFile.match(/(.*[\/\\]).*/);
        return regexMatch ? regexMatch[1] : this._codeFile;
    }

    /**
     * Gets the drive letter of the code file.
     */
    private getDriveLetter(): string {
        const regexMatch = this._codeFile.match(/^([A-Za-z]:).*/);
        return regexMatch ? regexMatch[1] : "$driveLetter";
    }

    /**
     * Gets the directory of the code file without a trailing slash.
     */
    private getCodeFileDirWithoutTrailingSlash(): string {
        return this.getCodeFileDir().replace(/[\/\\]$/, "");
    }

    /**
     * Includes double quotes around a given file name.
     */
    private quoteFileName(fileName: string): string {
        return '\"' + fileName + '\"';
    }
    public async executeCommandInTerminal(command: string) {
        let isNewTerminal = false;
        if (this._terminal === null) {
            this._terminal = vscode.window.createTerminal("CAIE Pseudocode");
            isNewTerminal = true;
        }
        this._terminal.sendText(command);
    }
}