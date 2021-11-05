import * as vscode from 'vscode';
import * as rs from 'text-readability';

export function activate(context: vscode.ExtensionContext) {
	let activeEditor = vscode.window.activeTextEditor;

	let readabilityStatusBarItem: vscode.StatusBarItem;
	readabilityStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

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
			evaluateReadability();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			evaluateReadability();
		}
	}, null, context.subscriptions);

}