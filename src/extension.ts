/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
// tslint:disable
"use strict";
import * as path from "path";

import * as vscode from 'vscode';
import { workspace, Disposable, ExtensionContext, window } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    SettingMonitor,
    ServerOptions,
    TransportKind,
    InitializeParams,
    StreamInfo,
    createServerPipeTransport,
} from "vscode-languageclient/node";
import { Trace, createClientPipeTransport } from "vscode-jsonrpc/node";
import { CodeManager } from "./runner";

const debugMode = true;
const LSPPath = debugMode ? 'dotnet' : 'PseudoCode.LSP'
const LSPArgs = debugMode ? ["/Users/mac/RiderProjects/PseudoCode/PseudoCode.LSP/bin/Debug/net6.0/PseudoCode.LSP.dll"] : []
const CliCmd = debugMode ? "dotnet" : "PseudoCode.Cli"
const CliArgs = debugMode ? ["/Users/mac/RiderProjects/PseudoCode/PseudoCode.Cli/bin/Debug/net6.0/PseudoCode.Cli.dll"] : []

const runner = new CodeManager();
let client: LanguageClient;

function getArguments() {
    var CliAdditionalArgs: string[] = [];
    var runtime = workspace.getConfiguration('pseudocode.runtime');
    if (runtime.get("strictVariables")) {
        CliAdditionalArgs.push("-S")
    }
    if (runtime.get("printOperations")) {
        CliAdditionalArgs.push("-c")
    }
    return CliArgs.concat(CliAdditionalArgs)
}
export function activate(context: ExtensionContext) {
    // The server is implemented in node
    console.log(`hi ${LSPPath} ${LSPArgs}`);
    let serverExe = LSPPath;

    const serverChannel = window.createOutputChannel("Pseudocode Language Server");
    // let serverExe = "D:\\Development\\Omnisharp\\csharp-language-server-protocol\\sample\\SampleServer\\bin\\Debug\\netcoreapp2.0\\win7-x64\\SampleServer.exe";
    // let serverExe = "D:/Development/Omnisharp/omnisharp-roslyn/artifacts/publish/OmniSharp.Stdio.Driver/win7-x64/OmniSharp.exe";
    // The debug options for the server
    // let debugOptions = { execArgv: ['-lsp', '-d' };5

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        // run: { command: serverExe, args: ['-lsp', '-d'] },
        command: serverExe,
        args: LSPArgs,
        transport: TransportKind.stdio,
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        outputChannel: serverChannel,
        // Register the server for plain text documents
        documentSelector: [{
            scheme: 'file',
            language: 'caie-pseudocode'
        }
        ],
        progressOnInitialization: true,
        synchronize: {

            // Synchronize the setting section 'languageServerExample' to the server
            configurationSection: "caie-pseudocode",
            fileEvents: [
                workspace.createFileSystemWatcher("**/*.pseudo"),
                workspace.createFileSystemWatcher("**/*.p"),
            ],
        },
    };

    // Create the language client and start the client.
    client = new LanguageClient("caie-pseudocode", "PseudoCode Language Client", serverOptions, clientOptions);
    client.registerProposedFeatures();
    client.setTrace(Trace.Verbose);
    client.start();


    registerRun(context)
    registerUpdate(context)
}

function registerRun(context: ExtensionContext) {
    const command = 'caie-pseudocode.run';
    const commandHandler = (fileUri: vscode.Uri) => {
        runner.getCurrentFile(fileUri).then(doc => {
            runner.executeCommandInTerminal(`cd \"${path.dirname(doc.fileName)}\"\n${CliCmd} ${getArguments().join(" ")} \"${doc.fileName}\"`)
        })

    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}
function registerUpdate(context: ExtensionContext) {

    const command = 'caie-pseudocode.update';
    const commandHandler = () => {
        runner.executeCommandInTerminal(`PseudoCode.Update`)
    };

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}
export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
