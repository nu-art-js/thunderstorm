export enum BaseToastVariant {
	Info    = 'info',
	Error   = 'error',
	Success = 'success',
	General = 'general',
}

export type ToastProperties = {
	id?: string;
	duration?: number;
	title?: string;
	body?: string;
};

export type Model_Toast = {
	id: string;
	duration: number;
	key: string;
	title?: string;
	body?: string;
	variant: string;
}