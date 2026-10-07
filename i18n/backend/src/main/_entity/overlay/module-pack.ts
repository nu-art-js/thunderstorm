import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_I18nOverlayDB} from './ModuleBE_I18nOverlayDB.js';

export const ModulePackBE_I18nOverlayDB = [ModuleBE_I18nOverlayDB, createApisForDBModule(ModuleBE_I18nOverlayDB)];
