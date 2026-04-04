import {Module} from '@nu-art/ts-common';
import {ModuleFE_Locale} from './_entity/locale/ModuleFE_Locale.js';
import {ModuleFE_LocalizedString} from './_entity/localized-string/ModuleFE_LocalizedString.js';

export const ModulePackFE_Locale: Module[] = [
	ModuleFE_Locale,
	ModuleFE_LocalizedString,
];
