/*
 * @nu-art/seo-backend - Per-locale HTML shells and SEO files through the i18n translator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_I18n} from '@nu-art/i18n-backend';
import type {SeoTextsSource} from './texts-source.js';

/**
 * Texts from the i18n library. `ModuleBE_I18n.translator` reads overrides with a permission-aware query
 * and returns them as plain text. This source does not query locales and does not write.
 */
export class I18nSeoTextsSource
	implements SeoTextsSource {

	async translator(locale: string) {
		return (await ModuleBE_I18n.translator(locale)).t;
	}
}
