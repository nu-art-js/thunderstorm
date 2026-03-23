import {HttpServer} from '@nu-art/http-server';
import {Express} from 'express';
import {ModuleBE_ExpressFunction} from './ModuleBE_ExpressFunction.js';


class ModuleBE_FirebaseApiFunction_Class
	extends ModuleBE_ExpressFunction {

	constructor() {
		super('api');
	}

	protected resolveExpress(): Express {
		return HttpServer.getDefault().getExpress();
	}
}

export const ModuleBE_FirebaseApiFunction = new ModuleBE_FirebaseApiFunction_Class();
