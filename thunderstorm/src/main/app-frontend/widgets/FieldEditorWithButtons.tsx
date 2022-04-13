import * as React from 'react';
import {HTMLProps} from 'react';
import {FieldEditor, FieldEditorInputProps} from './FieldEditor';
import {StorageKey} from '../modules/StorageModule';
import {ComponentSync} from '../core/ComponentSync';
import {InputType} from '../components/input/TS_BaseInput';

type State = {
	isEditing: boolean;
	storageKey: StorageKey<string>;
};

type Props = {
	inputProps: FieldEditorInputProps<any>;
	labelProps?: HTMLProps<HTMLDivElement>
	type: InputType;
	id: string;
	onAccept: (value: string) => void;
	value?: string;
};

export class FieldEditorWithButtons
	extends ComponentSync<Props, State> {

	private createStorageKey() {
		return new StorageKey<string>(`editable-label-controller-${this.props.id}`);
	}

	protected deriveStateFromProps(nextProps: Props) {
		return {
			storageKey: this.createStorageKey(),
			isEditing: false,
		};
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
		if (prevProps.id !== this.props.id) {
			this.setState({storageKey: this.createStorageKey()});
		}
	}

	handleEdit = () => {
		// Save the state's value in case of cancellation.
		this.setState({isEditing: true});
	};

	handleSave = () => {
		this.props.onAccept(this.state.storageKey.get());
		this.handleCancel();
	};

	handleCancel = () => {
		this.state.storageKey.delete();
		this.setState({isEditing: false});
	};

	render() {
		const {isEditing} = this.state;
		return (
			<div className={`ll_h_c`} style={{justifyContent: 'space-between'}}>
				<div>
					<FieldEditor
						id={this.props.id}
						type={this.props.type}
						isEditing={this.state.isEditing}
						inputProps={this.props.inputProps}
						labelProps={this.props.labelProps}
						onAccept={this.handleSave}
						onCancel={this.handleCancel}
						storageKey={this.state.storageKey}
						value={this.props.value}
					/>
				</div>
				{isEditing ? this.renderControlButtons() : this.renderEditButton()}
			</div>
		);
	}

	private renderEditButton = () => {
		return <button onClick={this.handleEdit}>
			Edit
		</button>;
	};

	private renderControlButtons = () => {
		return <div>
			<button onClick={this.handleSave}>
				Save
			</button>
			<button onClick={this.handleCancel}>
				Cancel
			</button>
		</div>;
	};
}