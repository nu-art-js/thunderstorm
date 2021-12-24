import * as React from 'react';
import {HTMLProps, ReactNode} from 'react';
import {EditorType, FieldEditor, FieldEditorInputProps} from './FieldEditor';
import {BaseComponent} from '../core/BaseComponent';
import {StorageKey} from '../modules/StorageModule';
import {InputType} from '../components/input/TS_BaseInput';

type State = {
	isEditing: boolean;
	storageKey: StorageKey<string>;
};

export type FieldEditorClickProps = {
	clicks?: 1 | 2
	inputProps?: FieldEditorInputProps<any>;
	labelProps?: HTMLProps<HTMLDivElement> | ((value: string) => ReactNode)
	editorType?: EditorType
	type: InputType;
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
		let storageKey = prevState.storageKey;
		if (prevProps.id !== this.props.id) {
			storageKey = this.createStorageKey();
			this.setState({storageKey: storageKey});
		}

		const prevValue = storageKey.get();
		if (!prevValue)
			storageKey.set(this.props.value || '');
	}

	private handleSave = () => {
		this.props.onAccept(this.state.storageKey.get());
		this.endEdit();
	};

	private startEdit = () => {
		if (this.state.isEditing)
			return;

		addEventListener('keydown', this.keyPressed);
		this.state.storageKey.set(this.props.value || '');
		this.setState({isEditing: true});
	};

	private endEdit = () => {
		removeEventListener('keydown', this.keyPressed);
		this.logDebug('endEdit');
		this.state.storageKey.delete();
		this.setState({isEditing: false});
	};

	keyPressed = (e: KeyboardEvent) => {
		if (e.code === 'Escape')
			this.endEdit();
	};

	render() {
		return (
			<div style={{width: '100%'}}
					 onClick={this.props.clicks === 1 ? this.startEdit : undefined}
					 onDoubleClick={this.props.clicks === undefined || this.props.clicks === 2 ? this.startEdit : undefined}
					 onBlur={() => this.handleSave()}
					 {...this.props.labelProps}>
				<FieldEditor
					id={this.props.id}
					type={this.props.type}
					editorType={this.props.editorType}
					isEditing={this.state.isEditing}
					inputProps={this.props.inputProps}
					labelProps={this.props.labelProps}
					onCancel={this.endEdit}
					onAccept={this.handleSave}
					storageKey={this.state.storageKey}
					value={this.props.value}
				/>
			</div>
		);
	}
}