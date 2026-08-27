import {ResolvableContent} from '@nu-art/ts-common';
import {ReactNode} from 'react';

export enum BaseToastVariant {
	Info    = 'info',
	Error   = 'error',
	Success = 'success',
	General = 'general',
}

export type ToastProperties = {
	id?: string;
	duration?: number;
	title?: ResolvableContent<ReactNode>;
	body?: ResolvableContent<ReactNode>;
};

export type Model_Toast = {
	id: string;
	duration: number;
	key: string;
	title?: ResolvableContent<ReactNode>;
	body?: ResolvableContent<ReactNode>;
	variant: string;
}