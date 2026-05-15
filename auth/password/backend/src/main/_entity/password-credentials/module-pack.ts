import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PasswordCredentialDB} from './ModuleBE_PasswordCredentialDB.js';

export const ModulePackBE_PasswordCredentialDB = [ModuleBE_PasswordCredentialDB, createApisForDBModule(ModuleBE_PasswordCredentialDB)];
