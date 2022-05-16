import {ApiResponse, ExpressRequest, RemoteProxy, ServerApi} from '@nu-art/thunderstorm/backend';
import {AccountApi_Upsert, AccountModuleBE, Request_UpsertAccount} from './_imports';
import {HttpMethod} from '@nu-art/thunderstorm';
import {tsValidateExists} from '@nu-art/ts-common';

class ServerApi_Account_Upsert
	extends ServerApi<AccountApi_Upsert> {

	constructor() {
		super(HttpMethod.POST, 'upsert');
		this.setMiddlewares(RemoteProxy.Middleware);
		this.setBodyValidator({password: tsValidateExists(), email: tsValidateExists(), password_check: undefined});
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UpsertAccount) {
		return AccountModuleBE.upsert(body);
	}
}

module.exports = new ServerApi_Account_Upsert();
