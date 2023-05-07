import {Module} from '@nu-art/ts-common/core/module';
import {MUSTNeverHappenException} from '@nu-art/ts-common';
import {ServerApi} from './server/server-api';

export class ApiModule_Class
	extends Module {
	private routes: ServerApi<any>[] = [];

	addRoutes = (apis: ServerApi<any>[]) => {
		apis.forEach(api => {
			if (this.routes.find(_api => _api.apiDef.path === api.apiDef.path))
				throw new MUSTNeverHappenException(`There is more than one API with the path '${api.apiDef.path}'!!!`);
			this.routes.push(api);
		});
	};

	useRoutes = () => this.routes;
}

export const ApiModule = new ApiModule_Class();

export const addRoutes: (apis: ServerApi<any>[]) => void = (apis: ServerApi<any>[]) => ApiModule.addRoutes(apis);