/**
 * Created by tacb0ss on 27/07/2018.
 */
import Module from '../core/Module';
import createHistory from 'history/createBrowserHistory';
import qs from 'query-string';

class UndoRedoModule
	extends Module {

	constructor() {
		super();
		this.history = [];
		this.index = -1;
		this.maxHistorySize = 100;
	}

	push(label, redo, undo) {
		this.history.splice(this.index, this.history.length - (this.history.length - this.index));

		if (this.history.length > this.maxHistorySize)
			this.history.slice(0, 1);

		this.history.push({
			label: label,
			redo: redo,
			undo: undo
		});

		redo();
	}

	undo() {
		if (this.index === -1)
			return;

		this.history[this.index--].undo();
	}

	redo() {
		if (this.index === this.history.length - 1)
			return;

		this.history[this.index++].redo();
	}

	getHistory() {
		return this.history;
	}
}

export default new UndoRedoModule();
