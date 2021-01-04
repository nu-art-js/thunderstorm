/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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
	addItemToArray,
	removeItemFromArray
} from "../utils/array-tools";

export class DebugFlag {

	private readonly key: string;

	private constructor(key: string) {
		this.key = key;
		DebugFlags.add(this);
	}

	rename(newKey: string) {
		DebugFlags.rename(this.key, newKey);
	}

	getKey() {
		return this.key;
	}

	enable(enable = true) {
		if (this.isEnabled() === enable)
			return;

		if (enable)
			this._enable();
		else
			this._disable();
	}

	private _enable() {
		addItemToArray(DebugFlags.instance.ActiveDebugFlags, this.key);
	}

	private _disable() {
		removeItemFromArray(DebugFlags.instance.ActiveDebugFlags, this.key);
	}

	public isEnabled() {
		return DebugFlags.instance.ActiveDebugFlags.includes(this.key);
	}
}

export class DebugFlags {

	static readonly instance: DebugFlags = new DebugFlags();

	readonly AllDebugFlags: { [k: string]: DebugFlag } = {};
	readonly ActiveDebugFlags: string[] = [];

	private constructor() {
	}

	public static createFlag(key: string) {
		// @ts-ignore
		return new DebugFlag(key);
	}

	static add(flag: DebugFlag) {
		this.instance.AllDebugFlags[flag.getKey()] = flag;
	}

	static rename(previousKey: string, newKey: string) {
		const flag = this.instance.AllDebugFlags[previousKey];
		if (!flag)
			return;

		delete this.instance.AllDebugFlags[previousKey];
		this.instance.AllDebugFlags[newKey] = flag;
	}
}
