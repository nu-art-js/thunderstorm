import {
	ApiResponse,
	ExpressRequest,
	ServerApi
} from "@nu-art/thunderstorm/backend";


import {HttpMethod} from "@nu-art/thunderstorm";
import {PushPubSubModule} from "../../../modules/PushPubSubModule";
import {
	PubSubRegisterClient,
	Request_PushRegister
} from "../../../../index";

class ServerApi_PushRead
	extends ServerApi<PubSubRegisterClient> {

	constructor() {
		super(HttpMethod.POST, "register");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_PushRegister) {
		// const user = await KasperoProxy.validateSession(request);
		return await PushPubSubModule.register(body, request);
	}
}

module.exports = new ServerApi_PushRead();