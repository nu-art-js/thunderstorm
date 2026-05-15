import {Module} from '@nu-art/ts-common';
import {ModuleBE_SAML} from './ModuleBE_SAML.js';
import {ModuleBE_SamlProviderDB} from './_entity/saml-provider/ModuleBE_SamlProviderDB.js';

export const ModulePackBE_SAML: Module[] = [ModuleBE_SAML, ModuleBE_SamlProviderDB];
