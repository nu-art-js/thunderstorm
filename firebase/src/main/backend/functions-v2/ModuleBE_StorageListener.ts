import {__stringify, dispatch_onApplicationNotification, ServerErrorSeverity} from '@nu-art/ts-common';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';
import {onObjectFinalized, StorageEvent, StorageOptions} from 'firebase-functions/v2/storage';
import {CloudFunction} from 'firebase-functions/v2';


type Created = { path: string } & StorageOptions;

export abstract class ModuleBE_StorageListener<ConfigType>
	extends ModuleBE_BaseFunction<ConfigType & Created> {

	private function!: CloudFunction<StorageEvent>;

	protected constructor(path?: string, name?: string) {
		super();
		if (path)
			this.setDefaultConfig({path: path, timeoutSeconds: 300, memory: '2GB'} as ConfigType & Created);

		name && this.setName(name);
	}

	abstract onFinalize(event: StorageEvent): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;


		const handler = async (event: StorageEvent) => {
			try {
				return await this.handleCallback(() => this.onFinalize(event));
			} catch (e: any) {
				const _message = `Error handling callback to onFinalize bucket listener method on path:` + this.config.path +
					'\n' + `File changed ${event.data.name}` + '\n with attributes: ' + __stringify(context) + '\n' + __stringify(e);
				this.logError(_message);
				try {
					await dispatch_onApplicationNotification.dispatchModuleAsync(ServerErrorSeverity.Critical, this, {message: _message});
				} catch (_e: any) {
					this.logError('Error while handing bucket listener error', _e);
				}
				throw e;
			}
		};

		return this.function = onObjectFinalized(this.config, handler);
	};
}