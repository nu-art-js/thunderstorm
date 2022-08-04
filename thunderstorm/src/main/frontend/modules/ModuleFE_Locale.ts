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

import {_keys, Module, TypedMap} from '@nu-art/ts-common';


export  type Language = {
	longName?: string
	shortName: string
	shortLocale: string
	longLocale?: string
	rtl?: boolean
}
type Config<O extends TypedMap<string | undefined> = TypedMap<string | undefined>, T extends { [K in keyof O]-?: O[K] } = { [K in keyof O]-?: O[K] }> = {
	languages: {
		[k: string]: {
			language: Language
			texts: T
		}
	}
	defaultLocal: string
}

export class ModuleFE_Locale_Class<O extends TypedMap<string | undefined> = TypedMap<string | undefined>, T extends { [K in keyof O]-?: O[K] } = { [K in keyof O]-?: O[K] }>
	extends Module<Config<O, T>> {

	private defaultLocale!: T;
	private activeLocaleTexts!: T;
	private activeLocale!: string;

	constructor() {
		super();
	}

	protected init() {
		this.defaultLocale = this.config.languages[this.config.defaultLocal].texts;
		this.activeLocaleTexts = this.defaultLocale;
		this.setActiveLocale(this.config.defaultLocal);
	}

	setActiveLocale(locale: string) {
		const localeTexts = this.config.languages[locale].texts;
		if (!localeTexts)
			return;

		this.activeLocale = locale;
		this.setActiveLocaleImpl(localeTexts);
	}

	getActiveLocale() {
		return this.activeLocale;
	}

	private setActiveLocaleImpl(localeStrings: T) {
		this.activeLocaleTexts = localeStrings;

	}

	public stringify(key: keyof T, previousKeys: (keyof T)[] = []) {
		return (...params: (string | number)[]) => {
			let text = this.activeLocaleTexts[key];

			if (!text)
				text = this.defaultLocale[key];

			if (!text)
				return key;

			return params.reduce((_toRet: string, param, index) => {
				let toRet = _toRet;
				const refs = toRet.match(/@\{(.*?)\}/g);
				if (refs) {
					toRet = refs.reduce((previousValue: string, stringKeyRef: string) => {
						const stringKey = stringKeyRef.match(/@\{(.*?)\}/)?.[1];
						const nested = this.stringify(stringKey as keyof T, [...previousKeys, key])();
						return previousValue.replace(stringKeyRef, nested as string);
					}, _toRet);
				}
				return toRet.replace(`\${${index}}`, `${param}`);
			}, text as string);
		};
	}

	getLanguage(locale: string): (Language | undefined) {
		return this.config.languages[locale]?.language;

	}

	getActiveLanguage() {
		return this.config.languages[this.activeLocale]?.language;
	}

	getAllLanguages() {
		return _keys(this.config.languages)
			.filter(key => Object.keys(this.config.languages[key].texts).length > 0)
			.map(key => this.config.languages[key].language);
	}

	convertNumber(param: any, locale: string) {
		return undefined;
	}
}

export const ModuleFE_Locale = new ModuleFE_Locale_Class();