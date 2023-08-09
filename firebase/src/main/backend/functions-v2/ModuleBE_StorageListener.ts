import {CloudFunction, EventContext, RuntimeOptions} from 'firebase-functions';
import {ObjectMetadata} from 'firebase-functions/lib/v1/providers/storage';
import {__stringify, dispatch_onApplicationNotification, ServerErrorSeverity} from '@nu-art/ts-common';
import {BucketConfigs} from '../functions/firebase-function';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';

const functions = require('firebase-functions');

export abstract class ModuleBE_StorageListener<ConfigType extends BucketConfigs = BucketConfigs>
	extends ModuleBE_BaseFunction<ConfigType> {

	private function!: CloudFunction<ObjectMetadata>;
	private runtimeOpts: RuntimeOptions = {};

	protected constructor(path?: string, name?: string) {
		super();
		if (path)
			this.setDefaultConfig({path: path} as Partial<ConfigType>);

		name && this.setName(name);
	}

	abstract onFinalize(object: ObjectMetadata, context: EventContext): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		this.runtimeOpts = {
			timeoutSeconds: this.config?.runtimeOpts?.timeoutSeconds || 300,
			memory: this.config?.runtimeOpts?.memory || '2GB'
		};

		return this.function = functions.runWith(this.runtimeOpts).storage.bucket(this.config.bucketName).object().onFinalize(
			async (object: ObjectMetadata, context: EventContext) => {
				try {
					return await this.handleCallback(() => this.onFinalize(object, context));
				} catch (e: any) {
					const _message = `Error handling callback to onFinalize bucket listener method on path:` + this.config.path +
						'\n' + `File changed ${object.name}` + '\n with attributes: ' + __stringify(context) + '\n' + __stringify(e);
					this.logError(_message);
					try {
						await dispatch_onApplicationNotification.dispatchModuleAsync(ServerErrorSeverity.Critical, this, {message: _message});
					} catch (_e: any) {
						this.logError('Error while handing bucket listener error', _e);
					}
					throw e;
				}
			});
	};
}