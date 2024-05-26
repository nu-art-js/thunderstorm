import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {ProjectConfigV2} from '../project/types';

export const MemKey_ProjectConfig = new MemKey<ProjectConfigV2>('project-config');

export type RunnerParamKey = typeof RunnerParamKeys[number];
export type RunnerParams = { [K in RunnerParamKey]?: string };

export const MemKey_RunnerParams = new MemKey<RunnerParams>('runner-params');

export const RunnerParamKey_RootPath = 'rootPath' as const;
export const RunnerParamKey_ConfigPath = 'configPath' as const;
const RunnerParamKeys = [RunnerParamKey_RootPath, RunnerParamKey_ConfigPath] as const;