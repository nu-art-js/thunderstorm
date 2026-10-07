import {Module} from '@nu-art/ts-common';
import {ModulePackBE_LocaleDB} from './_entity/locale/module-pack.js';
import {ModulePackBE_I18nOverlayDB} from './_entity/overlay/module-pack.js';
import {ModuleBE_I18n} from './ModuleBE_I18n.js';

export const ModulePackBE_I18n: Module[] = [
	...ModulePackBE_LocaleDB,
	...ModulePackBE_I18nOverlayDB,
	ModuleBE_I18n,
];
