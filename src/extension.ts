/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
// tslint:disable
"use strict";
import * as path from "path";

import * as vscode from 'vscode';
import { workspace, Disposable, ExtensionContext } from 'vscode';
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

const debugMode = false;
const LSPPath = debugMode ? 'dotnet' : 'PseudoCode.LSP'
const LSPArgs = debugMode ? ["/Users/mac/RiderProjects/PseudoCode/PseudoCode.LSP/bin/Debug/net6.0/PseudoCode.LSP.dll"] : []
const CliCmd = debugMode ? "dotnet" : "PseudoCode.Cli"
const CliArgs = debugMode ? ["/Users/mac/RiderProjects/PseudoCode/PseudoCode.Cli/bin/Debug/net6.0/PseudoCode.Cli.dll"] : []

const runner = new CodeManager();

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
    console.log("hi")
    let serverExe = LSPPath;

    // let serverExe = "D:\\Development\\Omnisharp\\csharp-language-server-protocol\\sample\\SampleServer\\bin\\Debug\\netcoreapp2.0\\win7-x64\\SampleServer.exe";
    // let serverExe = "D:/Development/Omnisharp/omnisharp-roslyn/artifacts/publish/OmniSharp.Stdio.Driver/win7-x64/OmniSharp.exe";
    // The debug options for the server
    // let debugOptions = { execArgv: ['-lsp', '-d' };5

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        // run: { command: serverExe, args: ['-lsp', '-d'] },
        run: {
            command: serverExe,
            args: LSPArgs,
            transport: TransportKind.pipe,
        },
        // debug: { command: serverExe, args: ['-lsp', '-d'] }
        debug: {
            command: serverExe,
            args: LSPArgs,
            transport: TransportKind.pipe,
            runtime: "",
        },
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [
            {
                pattern: "**/*.pseudo",
            },
            {
                pattern: "**/*.p",
            },
        ],
        progressOnInitialization: true,
        synchronize: {
            // Synchronize the setting section 'languageServerExample' to the server
            configurationSection: "pseudocode",
            fileEvents: workspace.createFileSystemWatcher("**/*.pseudo"),
        },
    };

    // Create the language client and start the client.
    const client = new LanguageClient("pseudocode", "PseudoCode Language Client", serverOptions, clientOptions);
    client.registerProposedFeatures();
    client.trace = Trace.Verbose;
    let disposable = client.start();

    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);

    registerRun(context)
    registerUpdate(context)

}

function registerRun(context: ExtensionContext) {
    const command = 'caie-pseudocode.run';
    const commandHandler = (fileUri: vscode.Uri) => {
        runner.getCurrentFile(fileUri).then(doc => {
            runner.executeCommandInTerminal(`cd \"\${fileDirname}\"\n${CliCmd} ${getArguments().join(" ")} \"${doc.fileName}\"`)
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