import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PasswordResetTokenDB} from './ModuleBE_PasswordResetTokenDB.js';

export const ModulePackBE_PasswordResetTokenDB = [ModuleBE_PasswordResetTokenDB, createApisForDBModule(ModuleBE_PasswordResetTokenDB)];
