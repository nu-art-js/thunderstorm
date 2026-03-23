import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction.js';
import {addItemToArray} from '@nu-art/ts-common';
import express, {Express} from 'express';
import {HttpsFunction, HttpsOptions, onRequest} from 'firebase-functions/v2/https';


export abstract class ModuleBE_ExpressFunction<Config = {}>
	extends ModuleBE_BaseFunction<{ options: HttpsOptions } & Config> {
	private function!: HttpsFunction;

	protected constructor(name: string = 'api') {
		super(name);
		this.addToClassStack(ModuleBE_ExpressFunction);
	}

	protected resolveExpress(): Express {
		return express();
	}

	getFunction = () => {
		if (this.function)
			return this.function;
		const _express = this.resolveExpress();
		const realFunction = this.createFunction(_express);
		return this.function = onRequest(this.config.options, (req, res) => {
			if (this.isReady) { // @ts-ignore
				return realFunction(req, res);
			}

			return new Promise((resolve) => {
				// @ts-ignore
				addItemToArray(this.toBeExecuted, () => realFunction(req, res));
				this.toBeResolved = resolve;
			});
		});
	};

	protected createFunction(_express: Express) {
		return onRequest(this.config.options, _express);
	}
}