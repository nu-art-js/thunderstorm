import {BlessedComponent} from './BlessedComponent';
import {BlessedWidgetOptions} from '../core';

type Props = {
	logs: string;
}

type State = {
	logs: string;
}

export class BlessedComponent_BufferLogs
	extends BlessedComponent<'log', Props, State> {

	constructor(widgetProps: BlessedWidgetOptions['log']) {
		super('log', widgetProps);
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		return {logs: nextProps.logs};
	}

	protected createChildren(): void {
		//No children for this component
	}

	protected renderSelf(): void {
		if (!this.widget)
			return;

		//As setContent resets the scroll, we need to save it and then set after setting the content
		const scroll = this.widget.getScroll();
		this.widget.setContent(this.state.logs);
		this.widget.setScroll(scroll);
	}
}