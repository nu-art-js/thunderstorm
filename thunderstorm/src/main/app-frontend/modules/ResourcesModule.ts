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

/**
 * Created by tacb0ss on 27/07/2018.
 */
import {Module} from "@ir/ts-common";

export type ResourceId = string;

export class ResourcesModule_Class
	extends Module {

	private readonly relativePath: string;
	private readonly relativePathImages: string;

	constructor() {
		super();
		this.relativePath = "../../res/";
		this.relativePathImages = `${this.relativePath}images/`;
	}

	init() {
	}

	public getImageUrl(relativePath: ResourceId): string {
		return `${this.relativePathImages}${relativePath}`
	}
}

export const ResourcesModule = new ResourcesModule_Class();
