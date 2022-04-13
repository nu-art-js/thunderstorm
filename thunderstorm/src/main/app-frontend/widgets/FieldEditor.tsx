import * as React from 'react';
import {HTMLProps, ReactNode} from 'react';
import {StorageKey} from '../modules/StorageModule';
import {ComponentSync} from '../core/ComponentSync';
import {TS_Input, TS_InputProps} from '../components/input/TS_Input/TS_Input';
import {TS_TextArea} from '../components/input/TS_TextArea/TS_TextArea';
import {InputType} from '../components/input/TS_BaseInput';

export type FieldEditorInputProps<K extends string | number> = Omit<TS_InputProps<K>, 'onChange' | 'value' | 'onAccept' | 'type' | 'id'>

export type EditorType = 'input' | 'textarea';
export type FieldEditorProps = {
	isEditing: boolean;
	value?: string;
	editorType?: EditorType
	type: InputType;
	storageKey: StorageKey<string>;
	inputProps?: FieldEditorInputProps<any>;
	labelProps?: HTMLProps<HTMLDivElement> | ((value: string) => ReactNode)
	onAccept?: () => void;
	onCancel?: () => void;
	onBlur?: () => void;
	id: string;
};

export class FieldEditor
	extends ComponentSync<FieldEditorProps> {

	constructor(props: FieldEditorProps) {
		super(props);
		const prevValue = this.props.storageKey.get();
		if (!prevValue) {
			// this.logDebug(`FieldEditor: ${this.props.value}`);
			this.props.storageKey.set(this.props.value || '');
		}
	}

	protected deriveStateFromProps(nextProps: FieldEditorProps): any {
		return {};
	}

	onChange = (value: string) => {
		// this.logDebug(`input onChange: ${value}`);
		this.props.storageKey.set(value);
		this.forceUpdate();
	};

	private renderInput = (value: string) => {
		return (
			<TS_Input<string>
				{...this.props.inputProps}
				focus={true}
				id={this.props.id}
				type={this.props.type}
				onAccept={this.props.onAccept}
				value={value}
				onChange={this.onChange}
			/>
		);
	};

	renderArea = (value: string) => {
		return (
			<TS_TextArea<string>
				{...this.props.inputProps}
				focus={true}
				id={this.props.id}
				type={this.props.type}
				onAccept={this.props.onAccept}
				value={value}
				onChange={this.onChange}
			/>
		);
	};

	private renderLabel = () => {
		const label = this.props.value || this.props.inputProps?.placeholder || '';
		if (typeof this.props.labelProps === 'function')
			return this.props.labelProps(label);

		return <div  {...this.props.labelProps}>{label}</div>;
	};

	render() {
		const value = this.props.storageKey.get() || '';
		if (!this.props.isEditing)
			return this.renderLabel();

		switch (this.props.editorType || 'input') {
			case 'input':
				return this.renderInput(value);
			case 'textarea':
				return this.renderArea(value);
		}
	}
}