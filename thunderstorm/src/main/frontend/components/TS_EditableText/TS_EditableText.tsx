import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_EditableText.scss';
import {TS_TextArea} from '../TS_Input';
import {TS_Button} from '../TS_Button';
import {_className} from '../../utils/tools';

type Props = {
	text: string;
	onTextSaved?: (text: string) => void;
	className?: string;
	disableEdit?: boolean;
	renderers?: {
		cancelButton?: React.ReactNode;
		saveButton?: React.ReactNode;
		resetButton?: React.ReactNode;
	}
};

type State = {
	original: string;
	text: string;
	isEditing: boolean;
};

export class TS_EditableText
	extends ComponentSync<Props, State> {

	// ######################## Life Cycle ########################

	protected deriveStateFromProps(nextProps: Props) {
		const state = {...this.state} || {} as State;
		state.original ||= nextProps.text;
		return state;
	}

	// ######################## Logic ########################

	private onEnableEdit = () => {
		if (this.props.disableEdit)
			return;

		this.setState({text: this.state.original, isEditing: true});
	};

	private onTextChange = (text: string) => {
		this.setState({text});
	};

	private onSubmitChanges = () => {
		const text = this.state.text;
		this.setState({original: text, isEditing: false});
		this.props.onTextSaved?.(text);
	};

	private onCancelChanges = () => {
		const original = this.state.original;
		this.setState({text: original, isEditing: false});
	};

	private onResetChanges = () => {
		const original = this.state.original;
		this.setState({text: original});
	};

	// ######################## Render ########################

	private renderText = () => {
		return <div
			className={'ts-editable-text__text'}
			onClick={this.onEnableEdit}
		>
			{this.state.original}
		</div>;
	};

	private renderTextArea = () => {
		return <div className={'ts-editable-text__edit-area'}>
			<TS_TextArea
				className={'ts-editable-text__edit-area__text-area'}
				type={'text'}
				value={this.state.text}
				onChange={this.onTextChange}
				onAccept={this.onSubmitChanges}
			/>
			{this.renderButtons()}
		</div>;
	};

	private renderButtons = () => {
		return <div className={'ts-editable-text__edit-area__buttons'}>
			<TS_Button className={'ts-editable-text__edit-area__buttons__reset'} onClick={this.onResetChanges}>
				{this.props.renderers?.resetButton || 'Reset'}</TS_Button>
			<TS_Button className={'ts-editable-text__edit-area__buttons__cancel'} onClick={this.onCancelChanges}>
				{this.props.renderers?.cancelButton || 'Cancel'}</TS_Button>
			<TS_Button className={'ts-editable-text__edit-area__buttons__save'} onClick={this.onSubmitChanges}>
				{this.props.renderers?.saveButton || 'Save'}</TS_Button>
		</div>;
	};

	render() {
		const Renderer = this.state.isEditing ? this.renderTextArea : this.renderText;
		const className = _className('ts-editable-text', this.props.className);
		return <div className={className}>
			<Renderer/>
		</div>;
	}
}
