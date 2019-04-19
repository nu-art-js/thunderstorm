/*
 * A backend boilerplate with example apis
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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

import {main} from "./main";
import {HttpServer} from "@nu-art/server/http-server/HttpServer";
import * as functions from 'firebase-functions';
import {Environment} from "./config";
import {
	Request,
	Response
} from "express";

const _api = functions.https.onRequest(HttpServer.express);
const toBeExecuted: (() => void)[] = [];
let isReady: boolean = false;

export const api = functions.https.onRequest((req: Request, res: Response) => {
	if (!isReady) {
		toBeExecuted.push(() => {
			_api(req, res)
		});

		return;
	}

	_api(req, res)
});

main(Environment)
	.then(() => {
		for (const toExecute of toBeExecuted) {
			toExecute();
		}

		console.log("Started");
		isReady = true;
	})
	.catch(reason => console.error("Error: ", reason));



