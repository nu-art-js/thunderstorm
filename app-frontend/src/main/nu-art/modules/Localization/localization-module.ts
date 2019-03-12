/**
 * Created by tacb0ss on 27/07/2018.
 */
import {Locale, LocaleDef, LocalizationConfig, StringKey} from "./localization-types";
import {Module} from "@nu-art/core";
import {format} from "util";


export class LocalizationModule
	extends Module<LocalizationConfig> {

	private activeLocale!: Locale;

	protected init() {
		const defaultLocale = this.config.defaultLocale;
		if (!defaultLocale)
			throw Error("MUST set defaultLocale in the config data");

		this.config.locales.forEach((value: LocaleDef, key: Locale) => {
			value.locale = key;
		});

		this.setLanguage(defaultLocale);
	}

	public setLanguage(locale: Locale) {
		const localeDef = this.config.locales.get(locale);
		if (!localeDef)
			throw new Error(`Unsupported language: ${locale}`);


		this.activeLocale = locale;
	}

	public getAvailableLanguages(): LocaleDef[] {
		return Array.from(this.config.locales.values());
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
		let languageData = this.config.languages.get(this.activeLocale);
		if (!languageData)
			return;

		return languageData.get(key);
	}
}
