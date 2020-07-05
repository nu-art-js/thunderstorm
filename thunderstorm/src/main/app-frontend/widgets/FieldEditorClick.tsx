import * as React from 'react';
import {FieldEditor} from "./FieldEditor";
import { BaseComponent } from '../core/BaseComponent';
import { StorageKey } from '../modules/StorageModule';

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
		if (prevProps.id !== this.props.id) {
			this.setState({storageKey: this.createStorageKey()});
		}
	}

	handleSave = () => {
		this.props.onAccept(this.state.storageKey.get());
		this.endEdit();
	};

	startEdit = () => {
		addEventListener("keydown", this.keyPressed);
		this.setState({isEditing: true})
	}

	endEdit = () => {
		removeEventListener("keydown", this.keyPressed);
		this.state.storageKey.delete();
		this.setState({isEditing: false});
	};

	keyPressed = (e: KeyboardEvent) => {
		if (e.code === 'Escape')
			this.endEdit()
	}

	render() {
		const {inputStyle, labelStyle} = this.props;
		return (
			<div className={`ll_h_c`}
			     onDoubleClick={this.startEdit}
			     onBlur={() => {this.handleSave()}}
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