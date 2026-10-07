/*
 * @nu-art/http-request-frontend — paste curl into a stored request
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {parseCurl, type HttpRequestDef} from '@nu-art/http-request-shared';
import {ModuleFE_Dialog, TS_Dialog, TS_PropRenderer, TS_TextArea, type DialogButtons, type InferState, type State_TSDialog} from '@nu-art/thunder-widgets';
import {Component_DialogHeader} from './Component_DialogHeader.js';
import './dialog__http-request.scss';

type Props = {
	onParsed: (request: HttpRequestDef) => void;
};

type State = {
	command: string;
	formError?: string;
};

export class Dialog_CurlImport
	extends TS_Dialog<Props, State> {

	static defaultProps = {
		dialogId: 'dialog-curl-import',
		className: 'dialog__http-request',
	};

	static show(onParsed: (request: HttpRequestDef) => void) {
		ModuleFE_Dialog.show({
			content: <Dialog_CurlImport onParsed={onParsed}/>,
		});
	}

	protected deriveStateFromProps(_nextProps: Props, state: InferState<this>): InferState<this> {
		const next = state as State & State_TSDialog;
		next.command ??= '';
		return state;
	}

	protected renderHeader = () =>
		<Component_DialogHeader title={'Import curl'} onClose={() => this.closeDialog()}/>;

	protected renderBody = () => <>
		<TS_PropRenderer.Vertical label={'Curl'} error={this.state.formError}>
			<TS_TextArea
				type={'text'}
				value={this.state.command}
				focus
				placeholder={'curl -X POST https://… -H "Authorization: Bearer …" -d "{}"'}
				onChange={command => this.setState({command, formError: undefined})}/>
		</TS_PropRenderer.Vertical>
	</>;

	protected buttons = (): DialogButtons => ({
		left: [{
			content: 'Cancel',
			associatedKeys: ['escape'],
			onClick: () => this.closeDialog(),
		}],
		right: [{
			content: 'Import',
			onClick: () => {
				try {
					this.props.onParsed(parseCurl(this.state.command));
					this.closeDialog();
				} catch (caught) {
					this.setState({formError: caught instanceof Error ? caught.message : String(caught)});
				}
			},
		}],
	});
}
