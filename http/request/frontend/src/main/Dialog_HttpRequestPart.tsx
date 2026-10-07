/*
 * @nu-art/http-request-frontend — edit one part of a stored request
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleFE_Dialog, TS_Dialog, type DialogButtons, type InferState, type State_TSDialog} from '@nu-art/thunder-widgets';
import {type OutboundHttpMethod} from '@nu-art/http-request-shared';
import {Component_HttpRequestBody} from './Component_HttpRequestBody.js';
import {Component_DialogHeader} from './Component_DialogHeader.js';
import {Component_HttpRequestHeader} from './Component_HttpRequestHeader.js';
import {Component_HttpRequestMethod} from './Component_HttpRequestMethod.js';
import {Component_HttpRequestUrl} from './Component_HttpRequestUrl.js';
import './dialog__http-request.scss';

export type HttpRequestPart =
	| {kind: 'method'; method: OutboundHttpMethod}
	| {kind: 'url'; url: string}
	| {kind: 'header'; name: string; value: string; originalName?: string}
	| {kind: 'body'; body: string; method: OutboundHttpMethod};

type Props = {
	part: HttpRequestPart;
	onSave: (part: HttpRequestPart) => void;
};

type State = {
	part: HttpRequestPart;
	formError?: string;
};

const titleOf = (part: HttpRequestPart): string => {
	if (part.kind === 'method')
		return 'Method';
	if (part.kind === 'url')
		return 'URL';
	if (part.kind === 'header')
		return 'Header';
	return 'Body';
};

export class Dialog_HttpRequestPart
	extends TS_Dialog<Props, State> {

	static defaultProps = {
		dialogId: 'dialog-http-request-part',
		className: 'dialog__http-request',
	};

	static show(part: HttpRequestPart, onSave: (part: HttpRequestPart) => void) {
		ModuleFE_Dialog.show({
			content: <Dialog_HttpRequestPart part={part} onSave={onSave}/>,
		});
	}

	protected deriveStateFromProps(nextProps: Props, state: InferState<this>): InferState<this> {
		const next = state as State & State_TSDialog;
		next.part ??= nextProps.part;
		return state;
	}

	protected renderHeader = () =>
		<Component_DialogHeader title={titleOf(this.state.part)} onClose={() => this.closeDialog()}/>;

	protected renderBody = () => {
		const part = this.state.part;
		return <>
			{part.kind === 'method' && <Component_HttpRequestMethod
				method={part.method}
				onChange={method => this.setState({part: {kind: 'method', method}, formError: undefined})}/>}
			{part.kind === 'url' && <Component_HttpRequestUrl
				url={part.url}
				focus
				onChange={url => this.setState({part: {kind: 'url', url}, formError: undefined})}/>}
			{part.kind === 'header' && <Component_HttpRequestHeader
				name={part.name}
				value={part.value}
				focus
				onChange={row => this.setState({
					part: {kind: 'header', ...row, originalName: part.originalName},
					formError: undefined,
				})}/>}
			{part.kind === 'body' && <Component_HttpRequestBody
				method={part.method}
				body={part.body}
				focus
				onChange={body => this.setState({part: {kind: 'body', method: part.method, body}, formError: undefined})}/>}
			{this.state.formError ? <p className={'dialog__http-request__error'}>{this.state.formError}</p> : null}
		</>;
	};

	protected buttons = (): DialogButtons => ({
		left: [{
			content: 'Cancel',
			associatedKeys: ['escape'],
			onClick: () => this.closeDialog(),
		}],
		right: [{
			content: 'Save',
			...(this.state.part.kind === 'method' || this.state.part.kind === 'url' ? {associatedKeys: ['enter']} : {}),
			onClick: () => {
				const part = this.state.part;
				if (part.kind === 'header' && !part.name.trim()) {
					this.setState({formError: 'Header name is required'});
					return;
				}
				const saved = part.kind === 'header' ? {...part, name: part.name.trim()} : part;
				this.props.onSave(saved);
				this.closeDialog();
			},
		}],
	});
}
