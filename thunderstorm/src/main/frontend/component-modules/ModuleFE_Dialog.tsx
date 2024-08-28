/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import {generateHex, Module} from '@thunder-storm/common';
import {ThunderDispatcher} from '../core/thunder-dispatcher';


export type Dialog_Model = DialogKey & {
	content: React.ReactNode,
	closeOverlayOnClick: () => boolean,
}

export type DialogKey = { dialogKey: string };

export interface DialogListener {
	__showDialog(dialogModel?: Dialog_Model): void;

	__closeDialog(dialogModel?: DialogKey,): void;
}

export interface DialogCloseListener {
	__consumeDialogCloseEvent(dialogModel?: DialogKey): boolean;
}

const dispatch_showDialog = new ThunderDispatcher<DialogListener, '__showDialog'>('__showDialog');
const dispatch_closeDialog = new ThunderDispatcher<DialogListener, '__closeDialog'>('__closeDialog');
export const dispatch_canClose = new ThunderDispatcher<DialogCloseListener, '__consumeDialogCloseEvent'>('__consumeDialogCloseEvent');

export const defaultCloseCallback = () => true;

export class ModuleFE_Dialog_Class
	extends Module<{}> {

	constructor() {
		super();
	}

	protected init(): void {
	}

	public close = (force: boolean = true, _dialogKey?: string) => {
		const dialogKey = _dialogKey ? {dialogKey: _dialogKey} : undefined;
		if (!force && dispatch_canClose.dispatchUI(dialogKey)[0])
			return;

		dispatch_closeDialog.dispatchUI(dialogKey);
	};

	public show = (content: React.ReactNode, closeOverlayOnClick = defaultCloseCallback, dialogKey = generateHex(8)) => {
		dispatch_showDialog.dispatchUI({dialogKey, content, closeOverlayOnClick});
	};
}

export const ModuleFE_Dialog = new ModuleFE_Dialog_Class();
