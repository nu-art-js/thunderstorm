import { MemKey } from '@thunder-storm/common/mem-storage/MemStorage';
import {PhaseRunner} from './PhaseRunner';

export const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
export const CONST_ThunderstormDependencyKey = 'THUNDERSTORM_DEPENDENCY_VERSION';
export const CONST_ProjectVersionKey = 'APP_VERSION';
export const CONST_ProjectDependencyKey = 'APP_VERSION_DEPENDENCY';

export const MemKey_PhaseRunner = new MemKey<PhaseRunner>('phase-runner');