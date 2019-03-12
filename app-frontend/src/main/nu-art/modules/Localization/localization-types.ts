/**
 * Created by tacb0ss on 27/07/2018.
 */
export type StringKey = string;
export type Locale = string;

export type LocaleDef = {
	locale: Locale,
	label: StringKey,
	icon: string,
};

export type LocalizationConfig = {
	defaultLocale: Locale,
	locales: Map<Locale, LocaleDef>
	languages: Map<Locale, Map<StringKey, string>>
};
