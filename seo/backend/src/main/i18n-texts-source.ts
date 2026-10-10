import {ModuleBE_I18n, ModuleBE_LocaleDB} from '@nu-art/i18n-backend';
import {currentTimeMillis, Minute} from '@nu-art/ts-common';
import type {SeoTextsSource} from './texts-source.js';

/**
 * Texts from the i18n library: ModuleBE_I18n.translator (cached defaults + overrides, single resolution
 * path). Enabled locales come from a normal (permission-aware) locale query, cached for a minute.
 */
export class I18nSeoTextsSource
	implements SeoTextsSource {

	private locales?: { codes: Promise<string[]>; at: number };

	constructor(private readonly ttlMs = Minute) {
	}

	enabledLocales(): Promise<string[]> {
		if (this.locales && currentTimeMillis() - this.locales.at < this.ttlMs)
			return this.locales.codes;

		const codes = ModuleBE_LocaleDB.query.custom({where: {enabled: true}}).then(locales => locales.map(locale => locale.code));
		const entry = {codes, at: currentTimeMillis()};
		this.locales = entry;
		codes.catch(() => this.locales === entry && (this.locales = undefined));
		return codes;
	}

	async translator(locale: string) {
		return (await ModuleBE_I18n.translator(locale)).t;
	}
}
