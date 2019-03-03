/**
 * Created by tacb0ss on 28/07/2018.
 */
import React from 'react';
import LocalizationModule from '../modules/LocalizationModule';
import ResourcesModule from '../modules/ResourcesModule';
import StorageModule from '../modules/StorageModule';
import HistoryModule from '../modules/BrowserHistoryModule';
import EventDispatcher from './EventDispatcher';

class BaseComponent
	extends React.Component {

	constructor(props) {
		super(props);
		this.tag = this.constructor.name;
		this.state = {};
	}

	setInterfaces(...interfaces) {
		this.interfaces = interfaces;
		interfaces.forEach((_interface) => {
			_interface.validate(this);
		});

		EventDispatcher.register(this);
	}

	static store(key, value) {
		StorageModule.store(key, value);
	}

	static load(key, defaultValue) {
		return StorageModule.load(key, defaultValue);
	}

	static dispatchEvent(_interface, method, ...args) {
		EventDispatcher.dispatchEvent(_interface, method, ...args);
	}

	_implements(_interface) {
		return this.interfaces.indexOf(_interface) !== -1;
	}

	componentWillUnmount() {
		EventDispatcher.unregister(this);
	}

	getImageUrl(relativePath) {
		if (!relativePath)
			return "";

		if (relativePath.indexOf(".") === -1)
			relativePath += ".png";

		return ResourcesModule.getImageUrl(relativePath);
	}

	static getQueryParameter(name) {
		return HistoryModule.getQueryParams()[name];
	}

	static getUrl() {
		return HistoryModule.getCurrent().pathname;
	}

	getString(key, ...params) {
		return LocalizationModule.getString(key, params);
	}

	logVerbose(message) {
		console.log(`${this.tag}: ${message}`);
	}

	logDebug(message) {
		console.log(`${this.tag}: ${message}`);
	}

	logInfo(message) {
		console.log(`${this.tag}: ${message}`);
	}

	logWarning(message) {
		console.log(`${this.tag}: ${message}`);
	}

	logError(message) {
		console.log(`${this.tag}: ${message}`);
	}

	toString() {
		return this.constructor.name;
	}
}

export default BaseComponent;
