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
import { Module, Second } from '@nu-art/ts-common';
import { TS_Toast } from '../components/TS_Toaster/TS_Toast.js';
import { ThunderDispatcher } from '@nu-art/thunder-core';
const Interval_DefaultToast = 6 * Second;
export class ToastBuilder {
    duration = Interval_DefaultToast;
    content = 'NO CONTENT';
    setContent(content) {
        this.content = content;
        return this;
    }
    setDuration(duration) {
        this.duration = duration;
        return this;
    }
    show() {
        const toast = {
            duration: this.duration,
            content: this.content
        };
        // @ts-ignore
        ModuleFE_Toaster.toastImpl(toast);
    }
}
const dispatch_showToast = new ThunderDispatcher('__showToast');
export class ModuleFE_Toaster_Class extends Module {
    constructor() {
        super();
    }
    init() {
    }
    toastError(errorMessage, interval = Interval_DefaultToast) {
        this.toast(TS_Toast(errorMessage, 'error'), interval);
    }
    toastSuccess(successMessage, interval = Interval_DefaultToast) {
        this.toast(TS_Toast(successMessage, 'success'), interval);
    }
    toastInfo(infoMessage, interval = Interval_DefaultToast) {
        this.toast(TS_Toast(infoMessage, 'info'), interval);
    }
    toast(_message, interval = Interval_DefaultToast) {
        let content = _message;
        if (typeof _message === 'string')
            content = ModuleFE_Toaster.adjustStringMessage(_message);
        new ToastBuilder().setContent(content).setDuration(interval).show();
    }
    adjustStringMessage = (_message) => {
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
    hideToast = (toast) => {
        // in the future we can add more than one toast and manage a stack of them!!
        dispatch_showToast.dispatchUI();
    };
    toastImpl(toast) {
        dispatch_showToast.dispatchUI(toast);
    }
}
export const ModuleFE_Toaster = new ModuleFE_Toaster_Class();
//# sourceMappingURL=ModuleFE_Toaster.js.map