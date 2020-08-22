/*
 * A typescript & react boilerplate with api call example
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

import { FlatItemToRender, TreeRendererMap } from "@nu-art/thunderstorm/frontend";

export type Plague = { label: string, value: string }

export type PlagueWithTitle = {
	item: Plague
	_children: PlagueWithTitle[]
	type: string
}

export const plagues: Plague[] = [
	{label: 'Spanish Flu', value: 'spanishFlu'},
	{label: 'Smallpox', value: 'smallpox'},
	{label: 'Black Plague', value: 'blackPlague'},
	{label: 'Coronavirus', value: 'COVID-19'},
	{label: 'Internet', value: 'internet'}
];

export const plaguesWithTitles = [
	{
		item: {label: 'Phisical', value: 'title'},
		_children: [
			{
				item: {label: 'kaki', value: 'kaka'},
				type: "title"
			},
			{
				item: {label: 'zevel', value: 'pah'},
				type: "normal"
			},
		],
		type: "title"
	},
	{
		item: {label: 'Spanish Flu', value: 'spanishFlu'},
		type: "normal"
	},
	{
		item: {label: 'Smallpox', value: 'smallpox'},
		type: "normal"
	},
	{
		item: {label: 'Black Plague', value: 'blackPlague'},
		type: "normal"
	},
	{
		item: {label: 'Coronavirus', value: 'COVID-19'},
		type: "normal"
	},
	{
		item: {label: 'Virtual', value: 'title'},
		type: "title"
	},
	{
		item: {label: 'Facebook', value: 'facebook'},
		type: "normal"
	},
	{
		item: {label: 'Tik tok', value: 'tiktok'},
		type: "normal"
	},
];


export const flatPlaguesWithTitles: FlatItemToRender<TreeRendererMap>[] = [
	{
		item: {label: 'Phisical', value: 'title'},
		type: "title"
	},
	{
		item: {label: 'Spanish Flu', value: 'spanishFlu'},
		type: "normal"
	},
	{
		item: {label: 'Smallpox', value: 'smallpox'},
		type: "normal"
	},
	{
		item: {label: 'Black Plague', value: 'blackPlague'},
		type: "normal"
	},
	{
		item: {label: 'Coronavirus', value: 'COVID-19'},
		type: "normal"
	},
	{
		item: {label: 'Virtual', value: 'title'},
		type: "title"
	},
	{
		item: {label: 'Facebook', value: 'facebook'},
		type: "normal"
	},
	{
		item: {label: 'Tik tok', value: 'tiktok'},
		type: "normal"
	},
];
