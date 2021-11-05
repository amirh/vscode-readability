import * as vscode from 'vscode';
import * as rs from 'text-readability';
import { on } from 'events';

export function showDetailsView(reportHtml: string | undefined, onDispose: () => void) : vscode.WebviewPanel {
			let detailsPanel = vscode.window.createWebviewPanel(
				'readabilityDetails', // Identifies the type of the webview. Used internally
				'Readability', // Title of the panel displayed to the user
				vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
				{} // Webview options. More on these later.
			);
			if (reportHtml !== undefined) {
				detailsPanel.webview.html = reportHtml;
			}
			detailsPanel.onDidDispose(onDispose);
            return detailsPanel;
}

export function generateDetailedReport(text: string): string {
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
    <td>${rs.textStandard(text, false)}</td>
  </tr>
  <tr>
    <td>Flesch Reading Ease</td>
    <td>${rs.fleschReadingEase(text)}</td>
  </tr>
  <tr>
    <td>Flesch-Kincaid Grade</td>
    <td>${rs.fleschKincaidGrade(text)}</td>
  </tr>
  <tr>
    <td>Fog Scale</td>
    <td>${rs.gunningFog(text)}</td>
  </tr>
  <tr>
    <td>SMOG Index</td>
    <td>${rs.smogIndex(text)}</td>
  </tr>
  <tr>
    <td>Automated Readability</td>
    <td>${rs.automatedReadabilityIndex(text)}</td>
  </tr>
  <tr>
    <td>The Coleman-Liau</td>
    <td>${rs.colemanLiauIndex(text)}</td>
  </tr>
  <tr>
    <td>Linsear Write</td>
    <td>${rs.linsearWriteFormula(text)}</td>
  </tr>
  <tr>
    <td>Dale-Chall Readability</td>
    <td>${rs.daleChallReadabilityScore(text)}</td>
  </tr>
  </table>
</body>
</html>`;
}