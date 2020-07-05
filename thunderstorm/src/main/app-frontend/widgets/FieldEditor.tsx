import * as React from 'react';
import { StorageKey } from '../modules/StorageModule';
import { BaseComponent } from '../core/BaseComponent';
import { TS_Input } from '../components/TS_Input';

type State = {};

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
	extends BaseComponent<Props, State> {

	private resetStorage = () => {
		const storageValue = this.props.storageKey.get();
		if (!storageValue) {
			this.props.storageKey.set(this.props.value || "");
		}
	};

	constructor(props: Props) {
		super(props);
		this.state = {}
	}

	onChange = (value: string) => {
		this.props.storageKey.set(value);
	};

	private renderInput = () => {
		this.resetStorage();
		return (
			<TS_Input<string>
				type="text"
				onChange={this.onChange}
				value={this.props.storageKey.get()}
				style={this.props.inputStyle}
				onAccept={this.props.onAccept}
				id={this.props.id}
				placeholder={this.props.placeholder}
				focus={this.props.isEditing}
			/>
		);
	};

	private renderLabel = () => {
		return <div style={this.props.labelStyle}>{this.props.value || ""}</div>
	};

	render() {
		const renderer = this.props.isEditing ? this.renderInput : this.renderLabel;
		return renderer();
	}
}