import {Module} from '@nu-art/ts-common';
import {ModulePackBE_LocaleDB} from './_entity/locale/module-pack.js';
import {ModulePackBE_LocalizedStringDB} from './_entity/localized-string/module-pack.js';

export const ModulePackBE_Locale: Module[] = [
	...ModulePackBE_LocaleDB,
	...ModulePackBE_LocalizedStringDB,
];
