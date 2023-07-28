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

import {ServerApi_Middleware} from '@nu-art/thunderstorm/backend';
import {Header_SessionId, ModuleBE_Account, ModuleBE_Account_Class} from '../modules/ModuleBE_Account';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {UI_Account} from '../../shared/api';
import {TS_Object} from '@nu-art/ts-common';


export const MemKey_AccountEmail = new MemKey<string>('accounts--email', true);
export const MemKey_AccountId = new MemKey<string>('accounts--id', true);
export const MemKey_SessionData = new MemKey<TS_Object>('session-data', true);

export const Middleware_ValidateSession: ServerApi_Middleware = async () => {
	const sessionId = Header_SessionId.get();
	const uiAccount = await ModuleBE_Account.validateSessionId(sessionId);

	Middleware_ValidateSession_UpdateMemKeys(uiAccount, sessionId);
};

export function Middleware_ValidateSession_UpdateMemKeys(uiAccount: UI_Account, sessionId?: string) {
	if (sessionId && !MemKey_SessionData.get())
		MemKey_SessionData.set(ModuleBE_Account_Class.decodeSessionData(sessionId));

	if (!MemKey_AccountEmail.get())
		MemKey_AccountEmail.set(uiAccount.email);

	if (!MemKey_AccountId.get())
		MemKey_AccountId.set(uiAccount._id);
}
