import {Module} from '@nu-art/ts-common';
import {ModuleFE_Account} from './ModuleFE_Account';
import {ModuleFE_Session} from '../../session/frontend/ModuleFE_Session';

export const ModulePackFE_AccountDB: Module[] = [ModuleFE_Account, ModuleFE_Session];