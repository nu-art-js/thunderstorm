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
import {
	Locale,
	LocaleDef,
	LocalizationConfig,
	StringKey
} from "./localization-types";
import {Module} from "@nu-art/ts-common";
import {format} from "util";


export class LocalizationModule_Class
	extends Module<LocalizationConfig> {

	private activeLocale!: Locale;

	protected init() {
		const defaultLocale = this.config.defaultLocale;
		if (!defaultLocale)
			throw Error("MUST set defaultLocale in the config data");

		for (const key in this.config.locales) {
			this.config.locales[key].locale = key;
		}

		this.setLanguage(defaultLocale);
	}

	public setLanguage(locale: Locale) {
		const localeDef = this.config.locales[locale];
		if (!localeDef)
			throw new Error(`Unsupported language: ${locale}`);

		this.activeLocale = locale;
	}

	public getAvailableLanguages(): LocaleDef[] {
		const ret = [];
		for (const key in this.config.locales) {
			ret.push(this.config.locales[key]);
		}
		return ret;
	}

	public getActiveLocale(): Locale {
		return this.activeLocale;
	}

	public getString(key: StringKey, ...params: any[]) {
		let text = this.getStringFromLocale(this.activeLocale, key);

		if (!text)
			text = this.getStringFromLocale(this.config.defaultLocale, key);

		if (!text)
			return key;

		return format(text, params);
	}

	public getStringFromLocale(locale: Locale, key: StringKey): string | undefined {
		const languageData = this.config.languages.get(this.activeLocale);
		if (!languageData)
			return;

		return languageData.get(key);
	}
}

export const LocalizationModule = new LocalizationModule_Class();