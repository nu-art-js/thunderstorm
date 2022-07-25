/*
 * User secured registration and login management system..
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

import {ExpressRequest, ExpressResponse, HttpRequestData, ServerApi_Middleware} from '@nu-art/thunderstorm/backend';
import {ModuleBE_Account} from '../modules/ModuleBE_Account';
import {HeaderKey_SessionId, UI_Account} from '../../shared/api';


export const Middleware_ValidateSession: ServerApi_Middleware<UI_Account> = async (req: ExpressRequest, res: ExpressResponse, data: HttpRequestData) => {
	const sessionId = data.headers[HeaderKey_SessionId];
	return await ModuleBE_Account.validateSessionId(sessionId);
};