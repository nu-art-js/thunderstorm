import {
    ApiResponse,
    ServerApi_Get,
} from "@nu-art/thunderstorm/backend";
import * as express from "express";
import {
    ApiGetLog
} from "./_imports";

import{
    AdminBRModule
} from "./_imports";

class ServerApi_GetReport
    extends ServerApi_Get<ApiGetLog> {

    constructor() {
        super("get-logs");
    }

    protected async process(request: express.Request, response: ApiResponse, queryParams: {}, body: void) {
        return AdminBRModule.getFilesFirebase();
    }
}

module.exports = new ServerApi_GetReport();
