import * as vscode from 'vscode';
import * as rs from 'text-readability';

export function activate(context: vscode.ExtensionContext) {
	let activeEditor = vscode.window.activeTextEditor;
	let lastActiveEditor = vscode.window.activeTextEditor;

	let showDetails = false;
	let details: vscode.WebviewPanel | undefined;

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

		readabilityStatusBarItem.text = `Readability: ${rs.textStandard(activeEditor.document.getText(), false)}`;
		readabilityStatusBarItem.show();
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