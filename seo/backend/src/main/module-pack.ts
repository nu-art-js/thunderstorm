/*
 * @nu-art/seo-backend - Per-locale HTML shells and SEO files through the i18n translator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {I18nSeoTextsSource} from './i18n-texts-source.js';
import {ModuleBE_SEO} from './ModuleBE_SEO.js';

ModuleBE_SEO.setTextsSource(new I18nSeoTextsSource());

export const ModulePackBE_SEO = [ModuleBE_SEO];
