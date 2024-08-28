import {MemKey} from '@thunder-storm/common/mem-storage/MemStorage';
import {RuntimeProjectConfig} from './types';


export const CONST_PackageJSONTemplate = '__package.json';
export const CONST_PackageJSON = 'package.json';
export const CONST_FirebaseRC = '.firebaserc';
export const CONST_FirebaseJSON = 'firebase.json';

export const MemKey_Packages = new MemKey<RuntimeProjectConfig>('bai-packages', true);
