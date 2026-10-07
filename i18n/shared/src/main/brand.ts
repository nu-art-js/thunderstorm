import {BadImplementationException} from '@nu-art/ts-common';

declare const I18N_BrandSymbol: unique symbol;

export type I18N_Brand = string & { readonly [I18N_BrandSymbol]: true };

const KeyPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export const i18nBrand = (key: string): I18N_Brand => {
	if (!KeyPattern.test(key))
		throw new BadImplementationException(`Invalid i18n key '${key}'. Use dotted/kebab lowercase ids.`);
	return key as I18N_Brand;
};

export const asI18nKey = (brand: I18N_Brand): string => brand;
