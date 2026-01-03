import {Module} from '@nu-art/ts-common';
import {ModuleFE_Utils} from './modules/ModuleFE_Utils/ModuleFE_Utils.js';
import {ModuleFE_Locale} from './modules/ModuleFE_Locale.js';
import {ModuleFE_Thunderstorm} from '@nu-art/web-client//ModuleFE_Thunderstorm.js';

export const ModulePackFE_Utils: Module[] = [
	ModuleFE_Utils,
	ModuleFE_Locale,
	ModuleFE_Thunderstorm,
];
