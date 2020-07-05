import * as React from 'react';
import {FieldEditor} from "./FieldEditor";
import {StorageKey} from '../modules/StorageModule';
import {BaseComponent} from '../core/BaseComponent';

type State = {
	isEditing: boolean;
	storageKey: StorageKey<string>;
};

type Props = {
	inputStyle?: React.CSSProperties;
	labelStyle?: React.CSSProperties
	placeholder?: string;
	id: string;
	onAccept: (value: string) => void;
	value?: string;
};

export class FieldEditorWithButtons
	extends BaseComponent<Props, State> {

	private createStorageKey() {
		return new StorageKey<string>(`editable-label-controller-${this.props.id}`);
	}

	constructor(props: Props) {
		super(props);
		const storage = this.createStorageKey();
		this.state = {
			storageKey: storage,
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
		const {inputStyle, labelStyle} = this.props;
		return (
			<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
				<div>
					<FieldEditor
						isEditing={this.state.isEditing}
						inputStyle={inputStyle}
						labelStyle={labelStyle}
						onAccept={this.handleSave}
						onCancel={this.handleCancel}
						storageKey={this.state.storageKey}
						value={this.props.value}
						placeholder={this.props.placeholder}
						id={this.props.id}
					/>
				</div>
				{isEditing ? this.renderControlButtons() : this.renderEditButton()}
			</div>
		);
	}

	private renderEditButton = () => {
		return <button onClick={this.handleEdit}>
			Edit
		</button>
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
	}
}