import {Model_Toast} from '../_core/types.js';

export enum ToastItemStatus {
	Loaded,
	Visible,
	Closed,
}

export type ToastItem = {
	model: Model_Toast;
	status: ToastItemStatus;
};