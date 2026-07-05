import {Model_Toast} from '@nu-art/toasting';

export enum ToastItemStatus {
	Loaded,
	Visible,
	Closed,
}

export type ToastItem = {
	model: Model_Toast;
	status: ToastItemStatus;
};