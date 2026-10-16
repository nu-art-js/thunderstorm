/*
 * @nu-art/seo-backend - Per-locale HTML shells and SEO files through the i18n translator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {SeoTranslate} from '@nu-art/seo-shared';

/**
 * Where shells get their texts. Enabled locales come from the site config (the i18n locale enum),
 * not from a database query. The default source is the i18n library (see i18n-texts-source.ts).
 */
export interface SeoTextsSource {
	/** The single resolution path, bound to a locale. */
	translator(locale: string): Promise<SeoTranslate>;
}
