import {
	ApiResponse,
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	AccountModule,
	Request_CreateAccountWithoutLogin,
	AccountApi_CreateAccountWithoutLogin
} from "./_imports";
import {HttpMethod} from "@nu-art/thunderstorm";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";

class ServerApi_Account_CreateAccountWithoutLogin
	extends ServerApi<AccountApi_CreateAccountWithoutLogin> {

	constructor() {
		super(HttpMethod.POST, "create-account-without-login");
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_CreateAccountWithoutLogin) {
		this.assertProperty(body, ["email"]);

		return AccountModule.createAccountWithoutLogin(body.email, body.password, body.password_check);
	}
}

module.exports = new ServerApi_Account_CreateAccountWithoutLogin();
