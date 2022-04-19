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
import {Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../core/thunder-dispatcher';

export type Dialog_Model = {
	content: React.ReactNode,
	closeOverlayOnClick: () => boolean,
}


export interface DialogListener {
	__showDialog(dialogModel?: Dialog_Model): void;
}

const dispatch_showDialog = new ThunderDispatcher<DialogListener, '__showDialog'>('__showDialog');

export class DialogModule_Class
	extends Module<{}> {

	constructor() {
		super();
	}

	protected init(): void {
	}

	public close = () => {
		dispatch_showDialog.dispatchUI();
	};

	public show = (content: React.ReactNode, closeOverlayOnClick = () => true) => {
		dispatch_showDialog.dispatchUI({content, closeOverlayOnClick});
	};
}


export const DialogModule = new DialogModule_Class();
