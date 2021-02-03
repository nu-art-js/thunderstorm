import * as React from 'react';
import {FieldEditor} from "./FieldEditor";
import {BaseComponent} from '../core/BaseComponent';
import {StorageKey} from '../modules/StorageModule';

type State = {
	isEditing: boolean;
	storageKey: StorageKey<string>;
};

export type FieldEditorClickProps = {
	inputStyle?: React.CSSProperties;
	labelStyle?: React.CSSProperties
	placeholder?: string;
	id: string;
	onAccept: (value: string) => void;
	value?: string;
};

export class FieldEditorClick
	extends BaseComponent<FieldEditorClickProps, State> {

	private createStorageKey() {
		return new StorageKey<string>(`editable-label-controller-${this.props.id}`);
	}

	constructor(props: FieldEditorClickProps) {
		super(props);
		this.state = {
			storageKey: this.createStorageKey(),
			isEditing: false,
		};
	}

	componentDidUpdate(prevProps: Readonly<FieldEditorClickProps>, prevState: Readonly<State>) {
		if (prevProps.id !== this.props.id)
			this.setState({storageKey: this.createStorageKey()});
	}

	private handleSave = () => {
		this.props.onAccept(this.state.storageKey.get());
		this.endEdit();
	};

	private startEdit = () => {
		addEventListener("keydown", this.keyPressed);
		this.state.storageKey.set(this.props.value || '');
		this.setState({isEditing: true});
	};

	private endEdit = () => {
		removeEventListener("keydown", this.keyPressed);
		this.state.storageKey.delete();
		this.setState({isEditing: false});
	};

	keyPressed = (e: KeyboardEvent) => {
		if (e.code === 'Escape')
			this.endEdit();
	};

	render() {
		const {inputStyle, labelStyle} = this.props;
		return (
			<div className={`ll_h_c`}
			     onDoubleClick={this.startEdit}
			     onBlur={() => this.handleSave()}
			>
				<FieldEditor
					isEditing={this.state.isEditing}
					inputStyle={inputStyle}
					labelStyle={labelStyle}
					onCancel={this.endEdit}
					onAccept={this.handleSave}
					storageKey={this.state.storageKey}
					value={this.props.value}
					placeholder={this.props.placeholder}
					id={this.props.id}
				/>
			</div>
		);
	}
}