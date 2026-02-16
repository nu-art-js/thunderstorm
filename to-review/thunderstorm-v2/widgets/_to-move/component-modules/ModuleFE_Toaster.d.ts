import * as React from 'react';
import { Module } from '@nu-art/ts-common';
export type Toast_Model = {
    duration: number;
    content: React.ReactNode;
};
export interface ToastListener {
    __showToast(toast?: Toast_Model): void;
}
export declare class ToastBuilder {
    private duration;
    private content;
    setContent(content: React.ReactNode): this;
    setDuration(duration: number): this;
    show(): void;
}
export declare class ModuleFE_Toaster_Class extends Module<{}> {
    constructor();
    protected init(): void;
    toastError(errorMessage: string, interval?: number): void;
    toastSuccess(successMessage: string, interval?: number): void;
    toastInfo(infoMessage: string, interval?: number): void;
    private toast;
    adjustStringMessage: (_message: string) => string;
    hideToast: (toast?: Toast_Model) => void;
    private toastImpl;
}
export declare const ModuleFE_Toaster: ModuleFE_Toaster_Class;
