import * as vscode from 'vscode';
import * as rs from 'text-readability';

export function activate(context: vscode.ExtensionContext) {
	let activeEditor = vscode.window.activeTextEditor;
	let lastActiveEditor = vscode.window.activeTextEditor;

	let showDetails = false;
	let details: vscode.WebviewPanel | undefined;
	let reportHtml: string;

	function shouldShowDetails() {
		if (lastActiveEditor === undefined) {
			return false;
		}
		return showDetails && lastActiveEditor.document.languageId === 'plaintext';
	}

	function updateDetailsVisibility() {
		if (details === undefined  && shouldShowDetails()) {
			details = vscode.window.createWebviewPanel(
				'readabilityDetails', // Identifies the type of the webview. Used internally
				'Readability', // Title of the panel displayed to the user
				vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
				{} // Webview options. More on these later.
			);
			if (reportHtml !== undefined) {
				details.webview.html = reportHtml;
			}
			details.onDidDispose(
				() => {
					if (shouldShowDetails()) {
						// If we're disposed while the state says we should be showing it means
						// the uses explicitly closed the details window, so we update
						// the wanted state to not show an editor.
						showDetails = false;
					}
					details = undefined;
				}
			);
		} else if (details !== undefined && !shouldShowDetails()) {
			details.dispose();
		}
	}

	function generateDetailedReport(text: string) {
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

	const detailsCommandId = 'readability.showDetails';
	context.subscriptions.push(vscode.commands.registerCommand(detailsCommandId, () => {
		showDetails = !showDetails;
		updateDetailsVisibility();
	}));

	let readabilityStatusBarItem: vscode.StatusBarItem;
	readabilityStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	readabilityStatusBarItem.command = detailsCommandId;
	context.subscriptions.push(readabilityStatusBarItem);

	function evaluateReadability() {
		if (activeEditor?.document.languageId !== 'plaintext') {
			readabilityStatusBarItem.hide();
			return;
		}

		let standard = rs.textStandard(activeEditor.document.getText(), false);
		readabilityStatusBarItem.text = `Readability: ${standard}`;
		readabilityStatusBarItem.show();
		reportHtml = generateDetailedReport(activeEditor.document.getText());
		if (details !== undefined) {
			details.webview.html = reportHtml;
		}
	}

	evaluateReadability();

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			lastActiveEditor = editor;
			evaluateReadability();
		}
		updateDetailsVisibility();
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			evaluateReadability();
		}
	}, null, context.subscriptions);
}