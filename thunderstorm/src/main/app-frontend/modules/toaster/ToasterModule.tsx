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
import {addAllItemToArray, Module, Second} from '@nu-art/ts-common';
// noinspection TypeScriptPreferShortImport
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {Stylable, StylableBuilder} from '../../tools/Stylable';
import {Color} from '../../components/types';

export enum ToastType {
	'success',
	'error',
	'info'
}

type PositionVertical = 'bottom' | 'top';
type PositionHorizontal = 'left' | 'right' | 'center';

export type Toast_Model = Stylable & {
	duration: number;
	bgColor: Color;
	type: ToastType;
	positionVertical?: PositionVertical;
	positionHorizontal?: PositionHorizontal;

	content: React.ReactNode;
	actions: React.ReactElement[];
}

export interface ToastListener {
	__showToast(toast?: Toast_Model): void;
}

const Interval_DefaultToast = 6 * Second;

export class ToastBuilder
	extends StylableBuilder {

	private bgColor: Color = '#eeffef';
	private duration: number = Interval_DefaultToast;
	private type: ToastType = ToastType.info;
	private positionVertical: PositionVertical = 'top';
	private positionHorizontal: PositionHorizontal = 'center';
	private actions: React.ReactElement[] = [];
	private content: React.ReactNode = 'NO CONTENT';

	setType(type: ToastType) {
		this.type = type;
		return this;
	}

	setContent(content: React.ReactNode) {
		this.content = content;
		return this;
	}

	setBackground(bgColor: Color) {
		this.bgColor = bgColor;
		return this;
	}

	setDuration(duration: number) {
		this.duration = duration;
		return this;
	}

	setActions(actions: React.ReactElement[]) {
		this.actions = actions || [];
		return this;
	}

	addActions(...actions: React.ReactElement[]) {
		addAllItemToArray(this.actions, actions);
		return this;
	}

	setVerticalPosition(positionVertical: PositionVertical) {
		this.positionVertical = positionVertical;
		return this;
	}

	setHorizontalPosition(positionHorizontal: PositionHorizontal) {
		this.positionHorizontal = positionHorizontal;
		return this;
	}

	show() {
		const toast: Toast_Model = {
			duration: this.duration,
			type: this.type,
			content: this.content,
			positionVertical: this.positionVertical,
			positionHorizontal: this.positionHorizontal,
			actions: this.actions,
			bgColor: this.bgColor,
			className: this.className,
			style: this.style,
		};

		// @ts-ignore
		ToastModule.toastImpl(toast);
	}
}

const dispatch_showToast = new ThunderDispatcher<ToastListener, '__showToast'>('__showToast');

export class ToastModule_Class
	extends Module<{}> {
	private DefaultBuilder: ToastBuilder = new ToastBuilder();


	constructor() {
		super();
	}

	protected init(): void {
	}

	public toastError(errorMessage: React.ReactNode, interval: number = Interval_DefaultToast) {
		this.toast(errorMessage, ToastType.error, interval);
	}

	public toastSuccess(successMessage: React.ReactNode, interval: number = Interval_DefaultToast) {
		this.toast(successMessage, ToastType.success, interval);
	}

	public toastInfo(infoMessage: React.ReactNode, interval: number = Interval_DefaultToast) {
		this.toast(infoMessage, ToastType.info, interval);
	}

	private toast(_message: React.ReactNode, type: ToastType, interval: number = Interval_DefaultToast) {
		let color: Color;
		switch (type) {
			case ToastType.success:
				color = '#2ee06f';
				break;

			case ToastType.error:
				color = '#ff4436';
				break;

			case ToastType.info:
				color = '#49addb';
				break;

			default:
				color = '#e8e8e8';
				break;
		}

		let content = _message;
		if (typeof _message === 'string')
			content = ToastModule.adjustStringMessage(_message);

		// console.log("_message:", _message)
		this.DefaultBuilder.setContent(content).setDuration(interval).setBackground(color).setType(type).show();
	}

	adjustStringMessage = (_message: string) => {
		let message = _message;
		message = message.replace(/\n#### (.*?)\n/g, '\n<h4>$1</h4>\n');
		message = message.replace(/\n### (.*?)\n/g, '\n<h3>$1</h3>\n');
		message = message.replace(/\n## (.*?)\n/g, '\n<h2>$1</h2>\n');
		message = message.replace(/\n# (.*?)\n/g, '\n<h1>$1</h1>\n');
		message = message.replace(/(<\/?.*?>)\n/g, '$1');
		message = message.replace(/([^>]?)\n/g, '$1<br/> ');
		const ignore = message.match(/`(.*?)`/g);
		if (ignore && ignore.length > 0)
			message = ignore.reduce((input, toEscape) => {
				const replaceValue = toEscape.substring(1, toEscape.length - 1)
					.replace(/([^\\]?)_/g, '$1\\_')
					.replace(/([^\\]?)\*/g, '$1\\*');
				return input.replace(toEscape, replaceValue);
			}, message);

		message = message.replace(/([^\\]?)_(.*?)([^\\])_/g, '$1<i>$2$3</i>');
		message = message.replace(/([^\\]?)\*(.*?)([^\\])\*/g, '$1<b>$2$3</b>');
		message = message.replace(/\\_/g, '_');
		message = message.replace(/\\\*/g, '*');
		return message;
	};

	hideToast = (toast?: Toast_Model) => {
		// in the future we can add more than one toast and manage a stack of them!!
		dispatch_showToast.dispatchUI([]);
	};

	private toastImpl(toast: Toast_Model) {
		dispatch_showToast.dispatchUI([toast]);
	}
}

export const ToastModule = new ToastModule_Class();