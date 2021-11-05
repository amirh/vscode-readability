import * as vscode from 'vscode';
import * as rs from 'text-readability';
import { DetailsView, StatusItem } from './view';
import { AnalysisResult, analyzeText } from './analyzer';

const detailsCommandId = 'readability.showDetails';

export function activate(context: vscode.ExtensionContext) {
	let controller = new ReadabilityController(context);
}

class ReadabilityController {
	lastActiveEditor: vscode.TextEditor | undefined;
	detailsView: DetailsView;
	statusItem: StatusItem;
	analysisResult: AnalysisResult | undefined;
	timeout: NodeJS.Timer | undefined = undefined;

	// True iff the desired state is to show the details for plaintext editors.
	//
	// The details panel is showing when this is true and the last active editor
	// was of a plain text document.
	//
	// This value can be toggled by the user by clicking on the status bar item.
	// When the user closes the details window this is set to false.
	showDetails = false;

	constructor(context: vscode.ExtensionContext) {
		this.lastActiveEditor = vscode.window.activeTextEditor;
		this.detailsView = new DetailsView();
		this.statusItem = new StatusItem(context.subscriptions, detailsCommandId);

		context.subscriptions.push(vscode.commands.registerCommand(detailsCommandId, () => {
			this.showDetails = !this.showDetails;
			this.updateDetailsVisibility();
		}));

		this.wireVSCodeEvents(context);

		this.evaluateReadability();
		this.updateStatusItemVisibility();
	}

	wireVSCodeEvents(context: vscode.ExtensionContext) {
		vscode.window.onDidChangeActiveTextEditor(editor => {
			this.onDidChangeActiveTextEditorChanged(editor);
		}, null, context.subscriptions);

		vscode.workspace.onDidChangeTextDocument(event => {
			this.onDidChangeTextDocument(event);
		}, null, context.subscriptions);
	}

	onDidChangeActiveTextEditorChanged(editor: vscode.TextEditor | undefined) {
			if (editor) {
				this.lastActiveEditor = editor;
				this.evaluateReadability();
			}
			this.updateStatusItemVisibility();
			this.updateDetailsVisibility();
	}

	onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
			if (this.lastActiveEditor && event.document === this.lastActiveEditor.document) {
				this.triggerEvaluateReadability();
			}
	}

	// Returns true if the desired state is to show the details panel.
	shouldShowDetails() {
		if (this.lastActiveEditor === undefined) {
			return false;
		}
		return this.showDetails && this.lastActiveEditor.document.languageId === 'plaintext';
	}

	// Updates the view state by showing/hiding the details panel based to match
	// the desired view state.
	updateDetailsVisibility() {
		if (!this.detailsView.isVisible()  && this.shouldShowDetails()) {
			this.detailsView.show(this.analysisResult, () => {
					if (this.shouldShowDetails()) {
						// If we're disposed while the state says we should be showing it means
						// the uses explicitly closed the details panel, so we update
						// the wanted state to not show an editor.
						this.showDetails = false;
					}
			});
		} else if (this.detailsView.isVisible() && !this.shouldShowDetails()) {
			this.detailsView.hide();
		}
	}

	updateStatusItemVisibility() {
			if (this.lastActiveEditor !== undefined && this.lastActiveEditor.document.languageId !== 'plaintext') {
				this.statusItem.hide();
			} else {
				this.statusItem.show();
			}
	}

	evaluateReadability() {
		if (!this.lastActiveEditor) {
			return;
		}
		if (this.lastActiveEditor.document.languageId !== 'plaintext') {
			return;
		}

		this.analysisResult = analyzeText(this.lastActiveEditor.document.getText());
		let standard = this.analysisResult.textStandard;
		this.statusItem.setText(`Readability: ${standard}`);
		this.detailsView.updateReport(this.analysisResult);
	}

	triggerEvaluateReadability() {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
		this.timeout = setTimeout(() => {
			this.evaluateReadability();
		}, 250);
	}
}