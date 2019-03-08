import {ApiResponse, HttpMethod, ServerApi} from "@nu-art/server";

import * as express from "express";
import {ParsedUrlQuery} from "querystring";

class ServerApi_EndpointExample
	extends ServerApi<void> {

	constructor() {
		super(HttpMethod.GET, "endpoint-example2");
	}

	protected async process(request: express.Request, response: ApiResponse, queryParams: ParsedUrlQuery, body: void) {
		response.text(200, "response data2");
	}
}

module.exports = new ServerApi_EndpointExample();
