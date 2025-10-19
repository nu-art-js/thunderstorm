import {MemKey} from '@nu-art/ts-common/mem-storage/index';
import {RuntimeProjectConfig} from './types/index.js';


export const CONST_PackageJSONTemplate = '__package.json';
export const CONST_PackageJSON = 'package.json';
export const CONST_NodeModules = 'node_modules';
export const CONST_BaiConfig = 'bai-config.json';
export const CONST_FirebaseRC = '.firebaserc';
export const CONST_FirebaseJSON = 'firebase.json';
export const CONST_TS_CONFIG = 'tsconfig.json';

export const MemKey_Packages = new MemKey<RuntimeProjectConfig>('bai-packages', true);
