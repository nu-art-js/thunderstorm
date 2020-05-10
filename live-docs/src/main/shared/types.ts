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

import {Auditable} from "@nu-art/ts-common";

export type LiveDocReqParams = {
	key: string
}

export type LiveDocHistoryReqParams = LiveDocReqParams & {
	change: "undo" | "redo"
}


type Document = {
	document: string
}

export type DB_DocumentHistory = Auditable & {
	docs: DB_Document[]
	key: string
	index: number
}

export type DB_Document = Auditable & Document & {}

export type Request_UpdateDocument = Document & {
	key: string
}
