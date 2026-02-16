import * as React from 'react';
import { Module, ResolvableContent } from '@nu-art/ts-common';
import { ThunderDispatcher } from '@nu-art/thunder-core';
export type Dialog_Model = DialogKey & {
    content: ResolvableContent<React.ReactNode, [VoidFunction]>;
    closeOverlayOnClick?: () => boolean;
    overlayClass?: string;
};
export type DialogKey = {
    dialogKey?: string;
};
export interface DialogListener {
    __showDialog(dialogModel?: Dialog_Model): void;
    __closeDialog(dialogModel?: DialogKey): void;
}
export interface DialogCloseListener {
    __consumeDialogCloseEvent(dialogModel?: DialogKey): boolean;
}
export declare const dispatch_canClose: ThunderDispatcher<DialogCloseListener, "__consumeDialogCloseEvent", [dialogModel?: DialogKey | undefined], boolean>;
export declare const defaultCloseCallback: () => boolean;
export declare class ModuleFE_Dialog_Class extends Module<{}> {
    constructor();
    protected init(): void;
    close: (force?: boolean, _dialogKey?: string) => void;
    show: (model: Dialog_Model) => void;
}
export declare const ModuleFE_Dialog: ModuleFE_Dialog_Class;
