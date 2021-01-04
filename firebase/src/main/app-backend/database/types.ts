/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import * as admin from "firebase-admin";
import {EventType} from "../../shared/types";

// export type FirebaseType_DB = admin.database.Database | firebase.database.Database
export type FirebaseType_DB = admin.database.Database

export interface Firebase_DB {
	ref(path: string): Firebase_Reference;
}

export interface Firebase_DataSnapshot {
	toJSON(): Object | null;

	val(): any;
}

export type FirebaseListener = (snapshot: Firebase_DataSnapshot | null) => void;

export interface Firebase_Reference {

	on(eventType: EventType, callback: FirebaseListener): any;

	off(eventType: EventType, callback: FirebaseListener): void;

	remove(): Promise<void>;

	set(value: any): Promise<void>;

	update(values: any): Promise<void>;

	once(eventType: EventType): Promise<Firebase_DataSnapshot>;
}
