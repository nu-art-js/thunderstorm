import {ApiResponse, HttpMethod, ServerApi} from "@nu-art/server";

import * as express from "express";
import {ParsedUrlQuery} from "querystring";

const randomStrings: string[] = ["Hi", "How are you", "Hello World", "Backend example"];

class ServerApi_EndpointExample
	extends ServerApi<void> {

	constructor() {
		super(HttpMethod.GET, "endpoint-example");
	}

	protected async process(request: express.Request, response: ApiResponse, queryParams: ParsedUrlQuery, body: void) {
		response.text(200, randomStrings[Math.floor(Math.random() * (randomStrings.length))]);
	}
}

module.exports = new ServerApi_EndpointExample();
