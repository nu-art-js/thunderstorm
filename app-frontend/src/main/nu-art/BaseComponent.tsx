/**
 * Created by tacb0ss on 28/07/2018.
 */
import {Logger, LogLevel, ModuleManager} from "@nu-art/core";
import * as React from "react";
import {LocalizationModule} from './modules/Localization/localization-module';
import {ResourcesModule} from "./modules/resources-module";
import {StorageModule} from "./modules/storage-module";
import {BrowserHistoryModule} from "./modules/history-module";

// import EventDispatcher from './EventDispatcher';

export class BaseComponent<P, S>
	extends React.Component<P, S> {

	private static readonly resources: ResourcesModule = ModuleManager.getModule(ResourcesModule);
	private static readonly storage: StorageModule = ModuleManager.getModule(StorageModule);
	private static readonly history: BrowserHistoryModule = ModuleManager.getModule(BrowserHistoryModule);
	private static readonly localization: LocalizationModule = ModuleManager.getModule(LocalizationModule);

	private logger: Logger;

	constructor(props: P) {
		super(props);
		this.logger = new Logger(this.constructor.name);
	}

	protected logVerbose(message: string, error?: Error): void {
		this.logger.logVerbose(message, error);
	}

	protected logDebug(message: string, error?: Error): void {
		this.logger.logDebug(message, error);
	}

	protected logInfo(message: string, error?: Error): void {
		this.logger.logInfo(message, error);
	}

	protected logWarning(message: string, error?: Error): void {
		this.logger.logWarning(message, error);
	}

	protected logError(message: string, error?: Error): void {
		this.logger.logError(message, error);
	}

	protected log(level: LogLevel, bold: boolean, message?: string | undefined | Error, error?: Error): void {
		this.logger.log(level, bold, message, error);
	}

	static store(key: string, value: string | object): void {
		this.storage.store(key, value);
	}

	static load(key: string, defaultValue: string | object): string | object | null {
		return this.storage.load(key, defaultValue);
	}

	static getImageUrl(relativePath: string) {
		if (!relativePath)
			return "";

		if (relativePath.indexOf(".") === -1)
			relativePath += ".png";

		return this.resources.getImageUrl(relativePath);
	}

	static getQueryParameter(name: string) {
		return this.history.getQueryParams()[name];
	}

	static getUrl() {
		return this.history.getCurrent().pathname;
	}

	static getLocalizedString(key: string, ...params: any[]) {
		return this.localization.getString(key, params);
	}

	//
	// componentWillUnmount() {
	// 	EventDispatcher.unregister(this);
	// }
	//
	//
	// static dispatchEvent(_interface, method, ...args) {
	// 	EventDispatcher.dispatchEvent(_interface, method, ...args);
	// }
	//
	// _implements(_interface) {
	// 	return this.interfaces.indexOf(_interface) !== -1;
	// }
	//
	// setInterfaces(...interfaces) {
	// 	this.interfaces = interfaces;
	// 	interfaces.forEach((_interface) => {
	// 		_interface.validate(this);
	// 	});
	//
	// 	EventDispatcher.register(this);
	// }


	toString() {
		return this.constructor.name;
	}
}

