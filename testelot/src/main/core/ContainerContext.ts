/*
 * Testelot is a typescript scenario composing framework
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

/**
 * Created by TacB0sS on 3/18/17.
 */

export class ContextKey<T> {
	public readonly key: string;
	public defaultValue?: T;

	constructor(key: string, defaultValue?: T) {
		this.key = key;
		this.defaultValue = defaultValue;
	}
}

export class TypedHashMap {

	private map: Map<string, any> = new Map<string, any>();

	delete(key: ContextKey<any>) {
		return this.map.delete(key.key);
	}

	get<ValueType>(key: ContextKey<ValueType>) {
		return this.map.get(key.key) as ValueType;
	}

	set<ValueType>(key: ContextKey<ValueType>, value: ValueType) {
		return this.map.set(key.key, value);
}

	clear() {
		return this.map.clear();
	}
}

