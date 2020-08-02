import * as React from 'react';
import {StorageKey} from '../modules/StorageModule';
import {BaseComponent} from '../core/BaseComponent';
import {TS_Input} from '../components/TS_Input';

type Props = {
	isEditing: boolean;
	value?: string;
	storageKey: StorageKey<string>;
	inputStyle?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
	onAccept?: () => void;
	onCancel?: () => void;
	onBlur?: () => void;
	id: string;
	placeholder?: string;
};

export class FieldEditor
	extends BaseComponent<Props> {

	constructor(props: Props) {
		super(props);
		this.props.storageKey.set(this.props.value || "");
	}

	onChange = (value: string) => {
		this.props.storageKey.set(value);
		this.forceUpdate()
	};

	private renderInput = () => {
		return (
			<TS_Input<string>
				id={this.props.id}
				key={this.props.id}
				type={"text"}
				value={this.props.storageKey.get() || ""}
				style={this.props.inputStyle}
				onChange={this.onChange}
				onAccept={this.props.onAccept}
				onCancel={this.props.onCancel}
				placeholder={this.props.placeholder}
				focus={this.props.isEditing}
			/>
		);
	};

	private renderLabel = () => <div style={this.props.labelStyle}>{this.props.value || ""}</div>;

	render() {
		return this.props.isEditing ? this.renderInput() : this.renderLabel();
	}
}