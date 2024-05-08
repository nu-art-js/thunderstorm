import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {ProjectManager} from './logic/ProjectManager';
import {DebugFlag, LogLevel} from '@nu-art/ts-common';
import {RuntimeParams} from './core/params/params';

export const MemKey_ProjectManager = new MemKey<ProjectManager>('ProjectManager', true);
export const MemKey_AbortSignal = new MemKey<AbortSignal>('AbortSignal', true);

DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;