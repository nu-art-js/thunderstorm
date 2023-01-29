import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_EditableText.scss';
import {TS_Input, TS_TextArea} from '../TS_Input';
import {TS_Button} from '../TS_Button';
import {_className} from '../../utils/tools';
import {LL_H_C} from '../Layouts';

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

class TS_EditableText_Base
	extends ComponentSync<Props, State> {

	// ######################## Life Cycle ########################

	protected deriveStateFromProps(nextProps: Props) {
		const state = {...this.state} || {} as State;
		state.original = nextProps.text;
		return state;
	}

	// ######################## Logic ########################

	protected onEnableEdit = () => {
		if (this.props.disableEdit)
			return;

		this.setState({text: this.state.original, isEditing: true});
	};

	protected onTextChange = (text: string) => {
		this.setState({text});
	};

	protected onSubmitChanges = () => {
		const text = this.state.text;
		this.setState({original: text, isEditing: false});
		this.props.onTextSaved?.(text);
	};

	protected onCancelChanges = () => {
		const original = this.state.original;
		this.setState({text: original, isEditing: false});
	};

	protected onResetChanges = () => {
		const original = this.state.original;
		this.setState({text: original});
	};

	// ######################## Render ########################

	protected renderText = () => {
		return <div
			className={'ts-editable-text__text'}
			onClick={this.onEnableEdit}
		>
			{this.state.original}
		</div>;
	};

	protected renderButton = {
		reset: () => <TS_Button className={'ts-editable-text__edit-area__buttons__reset'} onClick={this.onResetChanges}>
			{this.props.renderers?.resetButton || 'Reset'}</TS_Button>,
		cancel: () => <TS_Button className={'ts-editable-text__edit-area__buttons__cancel'} onClick={this.onCancelChanges}>
			{this.props.renderers?.cancelButton || 'Cancel'}</TS_Button>,
		accept: () => <TS_Button className={'ts-editable-text__edit-area__buttons__save'} onClick={this.onSubmitChanges}>
			{this.props.renderers?.saveButton || 'Save'}</TS_Button>
	};
}

class TS_EditableText_TextArea
	extends TS_EditableText_Base {

	private renderButtons = () => {
		return <div className={'ts-editable-text__edit-area__buttons'}>
			{this.renderButton.reset()}
			{this.renderButton.cancel()}
			{this.renderButton.accept()}
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

	render() {
		const Renderer = this.state.isEditing ? this.renderTextArea : this.renderText;
		const className = _className('ts-editable-text-text-area', this.props.className);
		return <div className={className}>
			<Renderer/>
		</div>;
	}
}

class TS_EditableText_Input
	extends TS_EditableText_Base {

	private renderInput = () => {
		return <div className={'ts-editable-text__edit-area'}>
			{this.renderButton.reset()}
			<TS_Input
				className={'ts-editable-text__edit-area__input'}
				type={'text'}
				value={this.state.text}
				onChange={this.onTextChange}
				onAccept={this.onSubmitChanges}
			/>
			<LL_H_C className={'ts-editable-text__edit-area__input__buttons'}>
				{this.renderButton.cancel()}
				{this.renderButton.accept()}
			</LL_H_C>
		</div>;
	};

	render() {
		const Renderer = this.state.isEditing ? this.renderInput : this.renderText;
		const className = _className('ts-editable-text-input', this.props.className);
		return <div className={className}>
			<Renderer/>
		</div>;
	}
}


export const TS_EditableText = {
	TextArea: TS_EditableText_TextArea,
	Input: TS_EditableText_Input,
};