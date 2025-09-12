import {PhaseRunnerDispatcher} from './PhaseRunnerDispatcher.js';
import {BaseUnit} from '../v3/units/index.js';

export interface OnWatchReady {
	__onWatchReady: () => void;
}

export const dispatcher_WatchReady = new PhaseRunnerDispatcher<OnWatchReady>('__onWatchReady');

export interface OnUnitWatchCompiled {
	__onUnitWatchCompiled: (units: BaseUnit[]) => void;
}

export const dispatcher_UnitWatchCompile = new PhaseRunnerDispatcher<OnUnitWatchCompiled>('__onUnitWatchCompiled');