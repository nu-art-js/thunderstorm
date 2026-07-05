import * as React from 'react';
import {Module, Second} from '@nu-art/ts-common';
import {BaseToastVariant, Toaster} from '@nu-art/toasting';
import {TOAST_KEY_GLOBAL} from './consts.js';

export type Toast_Model = {
	duration: number;
	content: React.ReactNode;
};

const Interval_DefaultToast = 6 * Second;
const globalToaster = new Toaster(TOAST_KEY_GLOBAL);

export class ToastBuilder {

	private duration: number = Interval_DefaultToast;
	private content: React.ReactNode = 'NO CONTENT';

	setContent(content: React.ReactNode) {
		this.content = content;
		return this;
	}

	setDuration(duration: number) {
		this.duration = duration;
		return this;
	}

	show() {
		ModuleFE_Toaster.showContent(this.content, this.duration);
	}
}

export class ModuleFE_Toaster_Class
	extends Module<{}> {

	toastError(errorMessage: string, interval: number = Interval_DefaultToast) {
		this.toast(errorMessage, BaseToastVariant.Error, interval);
	}

	toastSuccess(successMessage: string, interval: number = Interval_DefaultToast) {
		this.toast(successMessage, BaseToastVariant.Success, interval);
	}

	toastInfo(infoMessage: string, interval: number = Interval_DefaultToast) {
		this.toast(infoMessage, BaseToastVariant.Info, interval);
	}

	showContent(content: React.ReactNode, interval: number = Interval_DefaultToast) {
		globalToaster.toast(BaseToastVariant.General, {
			duration: interval,
			body: typeof content === 'string' ? this.adjustStringMessage(content) : content,
		});
	}

	private toast(message: string, variant: BaseToastVariant, interval: number = Interval_DefaultToast) {
		globalToaster.toast(variant, {
			duration: interval,
			body: this.adjustStringMessage(message),
		});
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

	/** @deprecated Global toasts auto-dismiss via the portal queue. */
	hideToast = (_toast?: Toast_Model) => {
	};
}

export const ModuleFE_Toaster = new ModuleFE_Toaster_Class();
