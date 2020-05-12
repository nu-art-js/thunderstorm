/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
