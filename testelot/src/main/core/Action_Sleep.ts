/*
 * Testelot is a typescript scenario composing framework
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

/**
 * Created by TacB0sS on 3/18/17.
 */
import {Action} from "./Action";
import {timeout} from "@ir/ts-common";


export class Action_Sleep
	extends Action {
	private readonly sleepMs: number;

	protected constructor(sleepMs: number) {
		super(Action_Sleep);
		this.setLabel(`Sleeping for ${sleepMs} ms`);
		this.sleepMs = sleepMs;
	}

	protected async execute() {
		return timeout(this.sleepMs);
	}
}