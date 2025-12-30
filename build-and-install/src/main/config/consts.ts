/**
 * Constants for file names and configuration keys used throughout the build system.
 */
import {MemKey} from '@nu-art/ts-common/mem-storage/index';
import {RuntimeProjectConfig} from './types/index.js';

/** Version file name (version-app.json) */
export const CONST_VersionApp = 'version-app.json';
/** Package.json template file name (__package.json) */
export const CONST_PackageJSONTemplate = '__package.json';
/** Package.json file name */
export const CONST_PackageJSON = 'package.json';
/** Node modules folder name */
export const CONST_NodeModules = 'node_modules';
/** BAI configuration file name (bai-config.json) */
export const CONST_BaiConfig = 'bai-config.json';
/** Firebase RC file name (.firebaserc) */
export const CONST_FirebaseRC = '.firebaserc';
/** Firebase JSON configuration file name (firebase.json) */
export const CONST_FirebaseJSON = 'firebase.json';
/** TypeScript configuration file name (tsconfig.json) */
export const CONST_TS_CONFIG = 'tsconfig.json';
/** PNPM workspace file name (pnpm-workspace.yaml) */
export const CONST_PNPM_WORKSPACE = 'pnpm-workspace.yaml';
/** PNPM lock file name (pnpm-lock.yaml) */
export const CONST_PNPM_LOCK = 'pnpm-lock.yaml';

/** Memory storage key for packages configuration */
export const MemKey_Packages = new MemKey<RuntimeProjectConfig>('bai-packages', true);
