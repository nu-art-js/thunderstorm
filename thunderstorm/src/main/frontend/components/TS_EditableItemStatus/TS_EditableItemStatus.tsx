import * as React from 'react';
import {TS_EditableItemComponent} from '../TS_EditableItemComponent/TS_EditableItemComponent';
import {EditableRef} from '../Item_Editor';

type Props = {}
type State = {
	status: string
}

export class TS_EditableItemStatus
	extends TS_EditableItemComponent<any, Props, State> {

	protected deriveStateFromProps(nextProps: Props & EditableRef<any>, state: State & EditableRef<any>): State & EditableRef<any> {
		state = super.deriveStateFromProps(nextProps, state);
		this.getStatusLabel(state);
		return state;
	}

	private getStatusLabel(state: State & EditableRef<any>) {
		const editable = state.editable;

		if (editable.hasErrors() && !editable.hasChanges())
			return state.status = 'Saved With Errors';

		if (editable.hasErrors())
			return state.status = 'Validation Error';

		if (editable.hasChanges()) {
			return state.status = 'Unsaved Changes';
		}

		if (!editable.get('_id'))
			return state.status = 'Creating New';

		if (editable.get('_id'))
			return state.status = 'Saved';

		return state.status = 'Not Implemented';
	}

	render() {
		return <div className={'ts-editable-item-status'}>{this.state.status}</div>;
	}
}