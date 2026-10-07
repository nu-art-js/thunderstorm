import {Module} from '@nu-art/ts-common';
import {ModuleFE_Locale} from './_entity/locale/ModuleFE_Locale.js';
import {ModuleFE_I18nOverlay} from './_entity/overlay/ModuleFE_I18nOverlay.js';
import {ModuleFE_I18n} from './ModuleFE_I18n.js';

export const ModulePackFE_I18n: Module[] = [
	ModuleFE_Locale,
	ModuleFE_I18nOverlay,
	ModuleFE_I18n,
];
