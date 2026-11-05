/*
 * @nu-art/firebase-backend - Firebase wrappers and Cloud Function modules
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction.js';
import {addItemToArray} from '@nu-art/ts-common';
import express, {Express} from 'express';
import {HttpsFunction, HttpsOptions, onRequest} from 'firebase-functions/v2/https';
import {listenOnPort} from './listen-on-port.js';

export type ExpressResolver = () => Express;

export class ModuleBE_ExpressFunction_Class
	extends ModuleBE_BaseFunction<{ options: HttpsOptions }> {
	private function!: HttpsFunction;
	private expressApp!: Express;
	private readonly expressResolver: ExpressResolver;

	constructor(name: string = 'api', expressResolver?: ExpressResolver) {
		super(name);
		this.setName(name);
		this.expressResolver = expressResolver ?? (() => express());
		this.addToClassStack(ModuleBE_ExpressFunction_Class);
	}

	serve = (port: number | undefined) => {
		this.getFunction();
		return listenOnPort(this.expressApp, port);
	};

	getFunction = () => {
		if (this.function)
			return this.function;
		this.expressApp = this.expressResolver();
		const realFunction = this.createFunction(this.expressApp);
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