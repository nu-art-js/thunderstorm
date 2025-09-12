import {ModuleBE_ShortUrlDB} from './ModuleBE_ShortUrlDB.js';
import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend/index';
import {Module_ShortUrlResolver} from '../../../backend/function-module/Module_ShortUrlResolver.js';
import {Module} from '@nu-art/ts-common';


export const ModulePackBE_ShortUrlDB:Module[] = [ModuleBE_ShortUrlDB, Module_ShortUrlResolver, createApisForDBModuleV3(ModuleBE_ShortUrlDB)];