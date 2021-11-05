import * as vscode from 'vscode';
import * as rs from 'text-readability';
import { generateDetailedReport, showDetailsView } from './view';

export function activate(context: vscode.ExtensionContext) {
	let lastActiveEditor = vscode.window.activeTextEditor;
	// The details panel if it's showing, undefined otherwise.
	let detailsPanel: vscode.WebviewPanel | undefined;

	// True iff the desired state is to show the details for plaintext editors.
	//
	// The details panel is showing when this is true and the last active editor
	// was of a plain text document.
	//
	// This value can be toggled by the user by clicking on the status bar item.
	// When the user closes the details window this is set to false.
	let showDetails = false;

	// The html for the detailed report.
	let reportHtml: string;

	// Returns true if the desired state is to show the details panel.
	function shouldShowDetails() {
		if (lastActiveEditor === undefined) {
			return false;
		}
		return showDetails && lastActiveEditor.document.languageId === 'plaintext';
	}

	// Updates the view state by showing/hiding the details panel based to match
	// the desired view state.
	function updateDetailsVisibility() {
		if (detailsPanel === undefined  && shouldShowDetails()) {
			detailsPanel = showDetailsView(reportHtml, () => {
					if (shouldShowDetails()) {
						// If we're disposed while the state says we should be showing it means
						// the uses explicitly closed the details panel, so we update
						// the wanted state to not show an editor.
						showDetails = false;
					}
					detailsPanel = undefined;
			});
		} else if (detailsPanel !== undefined && !shouldShowDetails()) {
			detailsPanel.dispose();
		}
	}

	function updateStatusItemVisibility() {
			if (lastActiveEditor !== undefined && lastActiveEditor.document.languageId !== 'plaintext') {
				readabilityStatusBarItem.hide();
			} else {
				readabilityStatusBarItem.show();
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
		if (!lastActiveEditor) {
			return;
		}
		if (lastActiveEditor.document.languageId !== 'plaintext') {
			return;
		}

		let standard = rs.textStandard(lastActiveEditor.document.getText(), false);
		readabilityStatusBarItem.text = `Readability: ${standard}`;
		reportHtml = generateDetailedReport(lastActiveEditor.document.getText());
		if (detailsPanel !== undefined) {
			detailsPanel.webview.html = reportHtml;
		}
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			lastActiveEditor = editor;
			evaluateReadability();
		}
		updateStatusItemVisibility();
		updateDetailsVisibility();
	}, null, context.subscriptions);

	let timeout: NodeJS.Timer | undefined = undefined;
	function triggerEvaluateReadability() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(evaluateReadability, 500);
	}

	vscode.workspace.onDidChangeTextDocument(event => {
		if (lastActiveEditor && event.document === lastActiveEditor.document) {
			triggerEvaluateReadability();
		}
	}, null, context.subscriptions);

	if (lastActiveEditor) {
		evaluateReadability();
		updateStatusItemVisibility();
	}
}