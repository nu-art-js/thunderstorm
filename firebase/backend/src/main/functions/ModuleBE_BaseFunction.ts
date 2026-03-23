import {addItemToArray, dispatch_onApplicationNotification, Module, ServerErrorSeverity, TS_Object} from '@nu-art/ts-common';

export interface FirebaseFunctionInterface {
	getFunction(): any;

	onFunctionReady(): Promise<void>;
}

export abstract class ModuleBE_BaseFunction<Config extends TS_Object = any>
	extends Module<Config>
	implements FirebaseFunctionInterface {

	protected isReady: boolean = false;
	protected toBeExecuted: (() => Promise<any>)[] = [];
	protected toBeResolved!: (value?: (PromiseLike<any>)) => void;

	protected constructor(tag?: string) {
		super(tag);
		this.addToClassStack(ModuleBE_BaseFunction);
		this.onFunctionReady = this.onFunctionReady.bind(this);
	}

	abstract getFunction(): any

	protected async handleCallback(callback: () => Promise<any>) {
		if (this.isReady)
			return await callback();

		return new Promise((resolve) => {
			addItemToArray(this.toBeExecuted, async () => await callback());

			this.toBeResolved = resolve;
		});
	}

	onFunctionReady = async () => {
		this.isReady = true;
		const toBeExecuted = this.toBeExecuted;
		this.toBeExecuted = [];
		for (const toExecute of toBeExecuted) {
			try {
				await toExecute();
			} catch (e: any) {
				await dispatch_onApplicationNotification.dispatchModuleAsync(ServerErrorSeverity.Critical, this, e.message);
			}
		}

		this.toBeResolved && this.toBeResolved();
	};
}