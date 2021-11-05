import * as vscode from 'vscode';
import * as rs from 'text-readability';
import { DetailsView, StatusItem } from './view';
import { AnalysisResult, analyzeText } from './analyzer';

export function activate(context: vscode.ExtensionContext) {
	const detailsCommandId = 'readability.showDetails';

	let lastActiveEditor = vscode.window.activeTextEditor;
	let detailsView = new DetailsView();
	let statusItem = new StatusItem(context.subscriptions, detailsCommandId);
	let analysisResult : AnalysisResult | undefined;

	// True iff the desired state is to show the details for plaintext editors.
	//
	// The details panel is showing when this is true and the last active editor
	// was of a plain text document.
	//
	// This value can be toggled by the user by clicking on the status bar item.
	// When the user closes the details window this is set to false.
	let showDetails = false;

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
		if (!detailsView.isVisible()  && shouldShowDetails()) {
			detailsView.show(analysisResult, () => {
					if (shouldShowDetails()) {
						// If we're disposed while the state says we should be showing it means
						// the uses explicitly closed the details panel, so we update
						// the wanted state to not show an editor.
						showDetails = false;
					}
			});
		} else if (detailsView.isVisible() && !shouldShowDetails()) {
			detailsView.hide();
		}
	}

	function updateStatusItemVisibility() {
			if (lastActiveEditor !== undefined && lastActiveEditor.document.languageId !== 'plaintext') {
				statusItem.hide();
			} else {
				statusItem.show();
			}
	}

	context.subscriptions.push(vscode.commands.registerCommand(detailsCommandId, () => {
		showDetails = !showDetails;
		updateDetailsVisibility();
	}));


	function evaluateReadability() {
		if (!lastActiveEditor) {
			return;
		}
		if (lastActiveEditor.document.languageId !== 'plaintext') {
			return;
		}

		analysisResult = analyzeText(lastActiveEditor.document.getText());
		let standard = analysisResult.textStandard;
		statusItem.setText(`Readability: ${standard}`);
		detailsView.updateReport(analysisResult);
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