import {generateHex, Logger, Second} from '@nu-art/ts-common';
import {BaseToastVariant, Model_Toast, ToastProperties} from './types.js';
import {ModuleFE_Toasting} from './ModuleFE_Toasting.js';

export class Toaster<CustomVariant extends string>
	extends Logger {

	private readonly toastingKey: string;
	private readonly fallbackToastDuration: number = 4 * Second;
	private muted: boolean = false;

	constructor(key: string, defaultDuration?: number) {
		super('Toaster');
		if (defaultDuration)
			this.fallbackToastDuration = defaultDuration;

		this.toastingKey = key;
	}

	//######################### Mute Logic #########################

	public setMute(mute: boolean) {
		this.muted = mute;
	}

	//######################### Toast Logic #########################

	public toast(variant: BaseToastVariant | CustomVariant, properties: ToastProperties) {
		if (this.muted)
			return;

		const model: Model_Toast = {
			id: properties.id ?? generateHex(8),
			key: this.toastingKey,
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

	public toastSuccess(properties: ToastProperties) {
		this.toast(BaseToastVariant.Success, properties);
	}

	public getQueueLength(): number {
		const models = ModuleFE_Toasting.getModels()
			.filter(model => model.key === this.toastingKey);
		return models.length;
	}
}