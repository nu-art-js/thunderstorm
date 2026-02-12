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
import { generateHex, Module } from '@nu-art/ts-common';
import { ThunderDispatcher } from '@nu-art/web-client';
const dispatch_showDialog = new ThunderDispatcher('__showDialog');
const dispatch_closeDialog = new ThunderDispatcher('__closeDialog');
export const dispatch_canClose = new ThunderDispatcher('__consumeDialogCloseEvent');
export const defaultCloseCallback = () => true;
export class ModuleFE_Dialog_Class extends Module {
    constructor() {
        super();
    }
    init() {
    }
    close = (force = true, _dialogKey) => {
        const dialogKey = _dialogKey ? { dialogKey: _dialogKey } : undefined;
        if (!force && dispatch_canClose.dispatchUI(dialogKey)[0])
            return;
        dispatch_closeDialog.dispatchUI(dialogKey);
    };
    show = (model) => {
        dispatch_showDialog.dispatchUI({
            content: model.content,
            closeOverlayOnClick: model.closeOverlayOnClick ?? defaultCloseCallback,
            dialogKey: model.dialogKey ?? generateHex(8),
            overlayClass: model.overlayClass,
        });
    };
}
export const ModuleFE_Dialog = new ModuleFE_Dialog_Class();
//# sourceMappingURL=ModuleFE_Dialog.js.map