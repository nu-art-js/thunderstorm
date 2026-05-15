import {Module} from '@nu-art/ts-common';
import {ModuleFE_SAML} from './ModuleFE_SAML.js';
import {ModuleFE_SamlProviderDB} from './_entity/saml-provider/ModuleFE_SamlProviderDB.js';

export const ModulePackFE_SAML: Module[] = [ModuleFE_SAML, ModuleFE_SamlProviderDB];
