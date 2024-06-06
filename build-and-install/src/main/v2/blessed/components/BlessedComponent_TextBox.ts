import {BlessedComponent} from './BlessedComponent';
import {BlessedWidgetOptions} from '../core';

type Props = {
	text: string
};

type State = {
	text: string;
};

export class BlessedComponent_TextBox
	extends BlessedComponent<'text', Props, State> {

	constructor(widgetProps: BlessedWidgetOptions['text']) {
		super('text', widgetProps);
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		return {text: nextProps.text};
	}

	protected createChildren(): void {
		//No children for this component
	}

	protected renderSelf(): void {
		if (!this.widget)
			return;

		this.widget.setContent(this.state.text);
	}
}