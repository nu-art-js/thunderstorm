/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import * as React from "react";
import {ObjectTS} from "@nu-art/ts-common";

export type InputField<T, K extends keyof T = keyof T> = {
	renderer: (value: Form_FieldProps<T, K>) => React.ReactNode
	type: 'text' | 'number' | 'password'
	label: string
	className?: string
	hint?: string
}

export type Form<T extends ObjectTS> = { [K in keyof T]: InputField<T, K> }

export type Form_FieldProps<T extends ObjectTS = ObjectTS, K extends keyof T = keyof T> = {
	key: K
	field: InputField<T, K>
	value: T[K]
	onChange: (value: any, id: K) => void;
	onAccept: () => void;
};
