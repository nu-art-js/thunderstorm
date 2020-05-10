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
	ApiWithBody,
	ApiWithQuery
} from "@nu-art/thunderstorm";
import {
	DB_Document,
	LiveDocHistoryReqParams,
	LiveDocReqParams,
	Request_UpdateDocument
} from "./types";

export type ApiGetLiveDoc = ApiWithQuery<'/v1/live-docs/get', DB_Document, LiveDocReqParams>
export type ApiHistoryLiveDocs = ApiWithBody<'/v1/live-docs/change-history', LiveDocHistoryReqParams, void>
export type ApiUpdateLiveDocs = ApiWithBody<'/v1/live-docs/update', Request_UpdateDocument, void>
