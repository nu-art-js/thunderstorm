import * as React from 'react';
import {TS_EditableItemComponent} from '../TS_EditableItemComponent/TS_EditableItemComponent';
import {
	EditableItem_Status, EditableItemStatus_Creating, EditableItemStatus_FailedValidation, EditableItemStatus_Saved, EditableItemStatus_SavedWithErrors,
	EditableItemStatus_Saving, EditableItemStatus_Unknown, EditableItemStatus_UnsavedChanges, EditableItemStatusListener
} from '../../utils/EditableItem';
import {InferProps, InferState} from '../../utils/types';


type Props = {
	labels: { [K in EditableItem_Status]: string }
}
type State = {
	statusLabel: string
}

export class TS_EditableItemStatus
	extends TS_EditableItemComponent<any, Props, State>
	implements EditableItemStatusListener {

	static defaultProps: Props = {
		labels: {
			[EditableItemStatus_Saving]: 'Saving...',
			[EditableItemStatus_SavedWithErrors]: 'Saved With Errors',
			[EditableItemStatus_FailedValidation]: 'Validation Error',
			[EditableItemStatus_UnsavedChanges]: 'Unsaved Changes',
			[EditableItemStatus_Creating]: 'Creating New',
			[EditableItemStatus_Saved]: 'Saved',
			[EditableItemStatus_Unknown]: 'Not Implemented',
		}
	};

	protected deriveStateFromProps(nextProps: InferProps<this>, _state: InferState<this>): InferState<this> {
		const state = super.deriveStateFromProps(nextProps, _state) as InferState<this>;
		state.statusLabel = this.props.labels[_state.editable.getStatus()] ?? 'Missing Status';
		return state;
	}

	componentDidMount() {
		setTimeout(() => this.props.editable.addStatusListener(this), 0);
	}

	componentWillUnmount() {
		this.props.editable.removeStatusListener(this);
	}

	onEditableItemStatusChanged(newStatus: EditableItem_Status): any {
		this.reDeriveState({});
	}

	render() {
		return <div className={'ts-editable-item-status'}>{this.state.statusLabel}</div>;
	}
}