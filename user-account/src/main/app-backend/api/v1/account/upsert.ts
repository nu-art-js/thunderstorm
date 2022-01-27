import {
	ApiResponse,
	RemoteProxy,
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	AccountModule,
	AccountApi_Upsert,
	Request_UpsertAccount
} from "./_imports";
import {HttpMethod} from "@nu-art/thunderstorm";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";
import { validateExists } from "@nu-art/ts-common";

class ServerApi_Account_Upsert
	extends ServerApi<AccountApi_Upsert> {

	constructor() {
		super(HttpMethod.POST, "upsert");
		this.setMiddlewares(RemoteProxy.Middleware);
		this.setBodyValidator({password: validateExists(), email: validateExists(), password_check: undefined});
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UpsertAccount) {
		return AccountModule.upsert(body);
	}
}

module.exports = new ServerApi_Account_Upsert();
