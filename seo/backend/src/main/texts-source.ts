import type {SeoTranslate} from '@nu-art/seo-shared';

/** Where shells get their locales and texts. The default is the i18n library (see i18n-texts-source.ts). */
export interface SeoTextsSource {
	/** Enabled locale codes, read with permission-aware queries. */
	enabledLocales(): Promise<string[]>;
	/** The single resolution path, bound to a locale. */
	translator(locale: string): Promise<SeoTranslate>;
}
