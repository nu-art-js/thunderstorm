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
	__scenario,
	ContextKey,
    __custom
} from "@nu-art/testelot";
import {
	AccountModule,
	DB_Account
} from "../_main";
import {cleanup} from "./_core";
import {isErrorOfType} from "@nu-art/ts-common";
import {ApiException} from "@nu-art/thunderstorm/app-backend/exceptions";

const userContextKey1 = new ContextKey<DB_Account>("user-1");

export function createUser() {
	const scenario = __scenario("Create-User");
	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		return await AccountModule.createAccount({email: "test-account1@gmail.com", password: "pah", password_check: "pah"});
	}).setWriteKey(userContextKey1));
	return scenario;
}

export function testSuccessfulLogin() {
	const scenario = __scenario("successful login");
	scenario.add(__custom(async () => {
		const responseAuth = await AccountModule.login({email: "test-account1@gmail.com", password: "pah"});
		await AccountModule.validateSessionId(responseAuth.sessionId);
	}).setReadKey(userContextKey1));
	return scenario;
}

export function testLoginWithWrongPass() {
	const scenario = __scenario("wrong pass");
	scenario.add(__custom(async () => {
		await AccountModule.login({email: "test-account1@gmail.com", password: "wrong"});
	}).setReadKey(userContextKey1).expectToFail(ApiException));
	return scenario;
}

export function testLoginWithWrongUser() {
	const scenario = __scenario("wrong user");
	scenario.add(__custom(async () => {
		await AccountModule.login({email: "wrong@gmail.com", password: "pah"});
	}).setReadKey(userContextKey1).expectToFail(ApiException));
	return scenario;
}

export function testBadSessionID() {
	const scenario = __scenario("bad session id");
	scenario.add(__custom(async () => {
		await AccountModule.validateSessionId("1234");
	}).setReadKey(userContextKey1).expectToFail(ApiException));
	return scenario;
}