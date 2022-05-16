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

export class LocaleModule_Class<O extends TypedMap<string | undefined> = TypedMap<string | undefined>, T extends { [K in keyof O]-?: O[K] } = { [K in keyof O]-?: O[K] }>
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

export const LocaleModule = new LocaleModule_Class();