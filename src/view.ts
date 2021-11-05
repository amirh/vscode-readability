import * as vscode from 'vscode';
import * as rs from 'text-readability';
import { on } from 'events';
import { AnalysisResult } from './analyzer';

export class DetailsView {
	// The details panel if it's showing, undefined otherwise.
	detailsPanel: vscode.WebviewPanel | undefined;

    show(analysisResult: AnalysisResult | undefined, onDispose: () => void) : vscode.WebviewPanel {
                this.detailsPanel = vscode.window.createWebviewPanel(
                    'readabilityDetails', // Identifies the type of the webview. Used internally
                    'Readability', // Title of the panel displayed to the user
                    vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
                    {} // Webview options. More on these later.
                );
                if (analysisResult !== undefined) {
                    this.detailsPanel.webview.html = generateDetailedReport(analysisResult);
                }
                this.detailsPanel.onDidDispose(() => {
                    onDispose();
                    this.detailsPanel = undefined;
                });
                return this.detailsPanel;
    }

    hide() {
        this.detailsPanel?.dispose();
    }

    isVisible() : boolean {
        return this.detailsPanel !== undefined;
    }

    updateHtml(html: string) {
        if (this.detailsPanel === undefined) {
            return;
        }
        this.detailsPanel.webview.html = html;
    }

    updateReport(results: AnalysisResult) {
        this.updateHtml(generateDetailedReport(results));
    }

}

export class StatusItem {
	readabilityStatusBarItem: vscode.StatusBarItem;

    constructor(subscriptions: { dispose(): any }[], detailsCommandId: string) {
        this.readabilityStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.readabilityStatusBarItem.command = detailsCommandId;
        subscriptions.push(this.readabilityStatusBarItem);
    }

    hide() {
        this.readabilityStatusBarItem.hide();
    }

    show() {
        this.readabilityStatusBarItem.show();
    }

    setText(text: string) {
        this.readabilityStatusBarItem.text = text;
    }
}

function generateDetailedReport(result: AnalysisResult): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Readability</title>
</head>
<body>
  <table>
  <tr>
    <td>Readability Consensus</td>
    <td>${result.textStandard}</td>
  </tr>
  <tr>
    <td>Flesch Reading Ease</td>
    <td>${result.fleschReadingEase}</td>
  </tr>
  <tr>
    <td>Flesch-Kincaid Grade</td>
    <td>${result.fleschKincaidGrade}</td>
  </tr>
  <tr>
    <td>Fog Scale</td>
    <td>${result.gunningFog}</td>
  </tr>
  <tr>
    <td>SMOG Index</td>
    <td>${result.smogIndex}</td>
  </tr>
  <tr>
    <td>Automated Readability</td>
    <td>${result.automatedReadabilityIndex}</td>
  </tr>
  <tr>
    <td>The Coleman-Liau</td>
    <td>${result.colemanLiauIndex}</td>
  </tr>
  <tr>
    <td>Linsear Write</td>
    <td>${result.linsearWriteFormula}</td>
  </tr>
  <tr>
    <td>Dale-Chall Readability</td>
    <td>${result.daleChallReadabilityScore}</td>
  </tr>
  </table>
</body>
</html>`;
}