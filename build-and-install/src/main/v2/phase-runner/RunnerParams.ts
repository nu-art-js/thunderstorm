import { StringMap } from '@nu-art/ts-common';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';

export const MemKey_PackageJSONParams = new MemKey<StringMap>('package-json-params');

export type RunnerParamKey = typeof RunnerParamKeys[number];
export type RunnerParams = {[K in RunnerParamKey]?:string};

export const MemKey_RunnerParams = new MemKey<RunnerParams>('runner-params');

export const RunnerParamKey_RootPath = 'rootPath' as const;
export const RunnerParamKey_ConfigPath = 'configPath' as const;
const RunnerParamKeys = [RunnerParamKey_RootPath,RunnerParamKey_ConfigPath] as const;