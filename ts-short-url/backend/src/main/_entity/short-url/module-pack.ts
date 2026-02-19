import {createApisForDBModule} from '@nu-art/db-api-backend';
import {Module} from '@nu-art/ts-common';
import {Module_ShortUrlResolver} from '../../function-module/Module_ShortUrlResolver.js';
import {ModuleBE_ShortUrlDB} from './ModuleBE_ShortUrlDB.js';

export const ModulePackBE_ShortUrlDB: Module[] = [ModuleBE_ShortUrlDB, Module_ShortUrlResolver, createApisForDBModule(ModuleBE_ShortUrlDB)];