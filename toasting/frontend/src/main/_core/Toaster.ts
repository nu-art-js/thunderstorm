import {generateHex, Logger, Second} from '@nu-art/ts-common';
import {BaseToastVariant, Model_Toast, ToastProperties} from './types.js';
import {ModuleFE_Toasting} from './ModuleFE_Toasting.js';

export class Toaster<CustomVariant extends string>
	extends Logger {

	private readonly fallbackToastDuration: number = 4 * Second;

	constructor(defaultDuration?: number) {
		super('Toaster');
		if (defaultDuration)
			this.fallbackToastDuration = defaultDuration;
	}

	private toast(variant: BaseToastVariant | CustomVariant, properties: ToastProperties) {
		const model: Model_Toast = {
			id: properties.id ?? generateHex(8),
			duration: properties.duration ?? this.fallbackToastDuration,
			variant: variant,
			title: properties.title,
			body: properties.body,
		};
		ModuleFE_Toasting.toast.open(model);
	}

	public toastGeneral(properties: ToastProperties) {
		this.toast(BaseToastVariant.General, properties);
	}

	public toastInfo(properties: ToastProperties) {
		this.toast(BaseToastVariant.Info, properties);
	}

	public toastError(properties: ToastProperties) {
		this.toast(BaseToastVariant.Error, properties);
	}
}