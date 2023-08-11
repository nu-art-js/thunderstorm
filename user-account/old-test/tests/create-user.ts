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

import {__custom, __scenario, ContextKey} from '@nu-art/testelot';
import {DB_AccountV3, ModuleBE_Account} from '../_main';
import {cleanup} from './_core';
import {ApiException} from '@nu-art/thunderstorm/frontend/exceptions';


const userContextKey1 = new ContextKey<DB_AccountV3>('user-1');

export function createUser() {
	const scenario = __scenario('Create-User');
	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		return await ModuleBE_Account.createAccount({email: 'test-account1@gmail.com', password: 'pah', password_check: 'pah'});
	}).setWriteKey(userContextKey1));
	return scenario;
}

export function testSuccessfulLogin() {
	const scenario = __scenario('successful login');
	scenario.add(__custom(async () => {
		const responseAuth = await ModuleBE_Account.login({email: 'test-account1@gmail.com', password: 'pah'});
		await ModuleBE_Account.validateSessionId(responseAuth.sessionId);
	}).setReadKey(userContextKey1));
	return scenario;
}

export function testLoginWithWrongPass() {
	const scenario = __scenario('wrong pass');
	scenario.add(__custom(async () => {
		await ModuleBE_Account.login({email: 'test-account1@gmail.com', password: 'wrong'});
	}).setReadKey(userContextKey1).expectToFail(ApiException));
	return scenario;
}

export function testLoginWithWrongUser() {
	const scenario = __scenario('wrong user');
	scenario.add(__custom(async () => {
		await ModuleBE_Account.login({email: 'wrong@gmail.com', password: 'pah'});
	}).setReadKey(userContextKey1).expectToFail(ApiException));
	return scenario;
}

export function testBadSessionID() {
	const scenario = __scenario('bad session id');
	scenario.add(__custom(async () => {
		await ModuleBE_Account.validateSessionId('1234');
	}).setReadKey(userContextKey1).expectToFail(ApiException));
	return scenario;
}