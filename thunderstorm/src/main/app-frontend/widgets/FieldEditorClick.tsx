import * as React from 'react';
import {HTMLProps} from 'react';
import {
	FieldEditor,
	FieldEditorInputProps
} from "./FieldEditor";
import {BaseComponent} from '../core/BaseComponent';
import {StorageKey} from '../modules/StorageModule';
import { InputType } from '../components/input/TS_BaseInput';

type State = {
	isEditing: boolean;
	storageKey: StorageKey<string>;
};

type Props = {
	inputProps: FieldEditorInputProps<any>;
	labelProps?: HTMLProps<HTMLDivElement>
	placeholder?: string;
	type: InputType;
	id: string;
	onAccept: (value: string) => void;
	value?: string;
};

export class FieldEditorClick
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
		let storageKey = prevState.storageKey;
		if (prevProps.id !== this.props.id) {
			storageKey = this.createStorageKey();
			this.setState({storageKey: storageKey});
		}

		const prevValue = storageKey.get();
		if (!prevValue) {
			storageKey.set(this.props.value || "");
		}
	}

	handleSave = () => {
		this.props.onAccept(this.state.storageKey.get());
		this.endEdit();
	};

	startEdit = () => {
		addEventListener("keydown", this.keyPressed);
		this.setState({isEditing: true});
	};

	endEdit = () => {
		removeEventListener("keydown", this.keyPressed);
		this.logDebug("endEdit");
		this.state.storageKey.delete();
		this.setState({isEditing: false});
	};

	keyPressed = (e: KeyboardEvent) => {
		if (e.code === 'Escape')
			this.endEdit();
	};

	render() {
		return (
			<div className={`ll_h_c`}
			     onDoubleClick={this.startEdit}
			     onBlur={() => this.handleSave()}>
				<FieldEditor
					id={this.props.id}
					type={this.props.type}
					isEditing={this.state.isEditing}
					inputProps={this.props.inputProps}
					labelProps={this.props.labelProps}
					onCancel={this.endEdit}
					onAccept={this.handleSave}
					storageKey={this.state.storageKey}
					value={this.props.value}
					placeholder={this.props.placeholder}
				/>
			</div>
		);
	}
}