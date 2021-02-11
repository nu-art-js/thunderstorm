import * as React from 'react';
import {HTMLProps} from 'react';
import {StorageKey} from '../modules/StorageModule';
import {BaseComponent} from '../core/BaseComponent';
import {
	TS_Input,
	TS_InputProps
} from '../components/input/TS_Input';
import {TS_TextArea} from "../components/input/TS_TextArea";
import {InputType} from '../components/input/TS_BaseInput';

export type FieldEditorInputProps<K extends string | number> = Omit<TS_InputProps<K>, "onChange" | "value" | "onAccept" | "type" | "id">

export type FieldEditorProps = {
	isEditing: boolean;
	value?: string;
	type: InputType;
	storageKey: StorageKey<string>;
	inputProps?: FieldEditorInputProps<any>;
	labelProps?: HTMLProps<HTMLDivElement>
	onAccept?: () => void;
	onCancel?: () => void;
	onBlur?: () => void;
	id: string;
	placeholder?: string;
};

export class FieldEditor
	extends BaseComponent<FieldEditorProps> {

	constructor(props: FieldEditorProps) {
		super(props);
		const prevValue = this.props.storageKey.get();
		if (!prevValue) {
			this.logDebug(`FieldEditor: ${this.props.value}`);
			this.props.storageKey.set(this.props.value || "");
		}
	}

	onChange = (value: string) => {
		this.logDebug(`input onChange: ${value}`);
		this.props.storageKey.set(value);
		this.forceUpdate();
	};

	private renderInput = (value: string) => {
		return (
			<TS_Input<string>
				{...this.props.inputProps}
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
				id={this.props.id}
				type={this.props.type}
				onAccept={this.props.onAccept}
				value={value}
				onChange={this.onChange}
			/>
		);
	};

	private renderLabel = () => <div {...this.props.labelProps}>{this.props.value || ""}</div>;

	render() {
		const value = this.props.storageKey.get() || "";
		return this.props.isEditing ? this.renderInput(value) : this.renderLabel();
	}
}