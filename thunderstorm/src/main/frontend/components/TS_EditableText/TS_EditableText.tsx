import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_EditableText.scss';
import {TS_Input, TS_TextArea} from '../TS_Input';
import {TS_Button} from '../TS_Button';
import {_className, stopPropagation} from '../../utils/tools';

type Props = {
	text: string;
	className?: string;

	editMode?: boolean; //External control for edit mode
	disableEdit?: boolean; //Blocks edit mode completely

	onTextSaved?: (text: string) => void; //Called when save is clicked
	onCancel?: () => void; //Called when cancel is clicked or on blur

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
	parentRef: React.RefObject<HTMLDivElement>;
};

class TS_EditableText_Base
	extends ComponentSync<Props, State> {

	// ######################## Life Cycle ########################

	protected deriveStateFromProps(nextProps: Props) {
		const state = {...this.state} || {} as State;
		state.original = nextProps.text;
		state.text ||= nextProps.text;
		state.isEditing = nextProps.editMode ?? false;
		state.parentRef ||= React.createRef();
		return state;
	}

	// ######################## Logic ########################

	protected onEnableEdit = () => {
		if (this.props.disableEdit || this.props.editMode !== undefined)
			return;

		this.setState({text: this.state.original, isEditing: true});
	};

	protected onTextChange = (text: string) => {
		this.setState({text});
	};

	protected onSubmitChanges = (e: React.MouseEvent | React.KeyboardEvent) => {
		stopPropagation(e);
		const text = this.state.text;
		if (!this.props.onTextSaved)
			this.setState({original: text, isEditing: false});

		this.setState({original: text});
		this.props.onTextSaved?.(text);
	};

	protected onCancelChanges = (e?: React.MouseEvent) => {
		if (e)
			stopPropagation(e);
		const original = this.state.original;
		if (!this.props.onCancel)
			this.setState({text: original, isEditing: false});

		this.setState({text: original});
		this.props.onCancel?.();
	};

	protected onResetChanges = (e: React.MouseEvent) => {
		stopPropagation(e);
		const original = this.state.original;
		this.setState({text: original});
	};

	protected onGeneralClick = (e: React.MouseEvent) => {
		if (this.state.isEditing)
			stopPropagation(e);
	};

	protected handleBlur = (e: React.FocusEvent) => {
		e.persist();
		//e.relatedTarget can be null if lost focus due to Enter
		if (e.relatedTarget === null || this.state.parentRef.current === e.relatedTarget || this.state.parentRef.current!.contains(e.relatedTarget))
			return;

		this.onCancelChanges();
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
		reset: () => <TS_Button className={'ts-editable-text__buttons__reset'} onClick={this.onResetChanges}>
			{this.props.renderers?.resetButton || 'Reset'}</TS_Button>,
		cancel: () => <TS_Button className={'ts-editable-text__buttons__cancel'} onClick={this.onCancelChanges}>
			{this.props.renderers?.cancelButton || 'Cancel'}</TS_Button>,
		accept: () => <TS_Button className={'ts-editable-text__buttons__save'} onClick={this.onSubmitChanges}>
			{this.props.renderers?.saveButton || 'Save'}</TS_Button>
	};
}

class TS_EditableText_TextArea
	extends TS_EditableText_Base {

	private renderButtons = () => {
		return <div className={'ts-editable-text-area__buttons'}>
			{this.renderButton.reset()}
			{this.renderButton.cancel()}
			{this.renderButton.accept()}
		</div>;
	};

	private renderTextArea = () => {
		return <div className={'ts-editable-text-area__edit'}>
			<TS_TextArea
				className={'ts-editable-text-area__text-area'}
				type={'text'}
				focus={true}
				value={this.state.text}
				onChange={this.onTextChange}
				onAccept={(val, e) => this.onSubmitChanges(e)}
			/>
			{this.renderButtons()}
		</div>;
	};

	render() {
		const Renderer = this.state.isEditing ? this.renderTextArea : this.renderText;
		const className = _className('ts-editable-text-area', this.props.className);
		return <div className={className} onBlur={this.handleBlur} tabIndex={1} onClick={this.onGeneralClick} ref={this.state.parentRef}>
			<Renderer/>
		</div>;
	}
}

class TS_EditableText_Input
	extends TS_EditableText_Base {

	private renderInput = () => {
		return <div className={'ts-editable-text-input__edit'}>
			{this.renderButton.reset()}
			<TS_Input
				className={'ts-editable-text-input__input'}
				type={'text'}
				focus={true}
				value={this.state.text}
				onChange={this.onTextChange}
				onAccept={(val, e) => this.onSubmitChanges(e)}
			/>
			<div className={'ts-editable-text-input__buttons'}>
				{this.renderButton.cancel()}
				{this.renderButton.accept()}
			</div>
		</div>;
	};

	render() {
		const Renderer = this.state.isEditing ? this.renderInput : this.renderText;
		const className = _className('ts-editable-text-input', this.props.className);
		return <div
			className={className}
			tabIndex={1}
			onBlur={this.handleBlur}
			onClick={this.onGeneralClick}
			ref={this.state.parentRef}>
			<Renderer/>
		</div>;
	}
}


export const TS_EditableText = {
	TextArea: TS_EditableText_TextArea,
	Input: TS_EditableText_Input,
};