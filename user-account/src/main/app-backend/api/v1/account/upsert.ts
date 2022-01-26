import {
	ApiResponse,
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	AccountModule,
	AccountApi_Upsert,
	Request_UpsertAccount
} from "./_imports";
import {HttpMethod} from "@nu-art/thunderstorm";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";

class ServerApi_Account_Upsert
	extends ServerApi<AccountApi_Upsert> {

	constructor() {
		super(HttpMethod.POST, "upsert");
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UpsertAccount) {
		this.assertProperty(body, ["password", "email"]);

		return AccountModule.upsert(body);
	}
}

module.exports = new ServerApi_Account_Upsert();
