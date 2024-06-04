import {PhaseRunnerDispatcher} from '../phase-runner/PhaseRunnerDispatcher';
import {WatchEventType} from './types';
import {BaseUnit} from './core';

export interface OnWatchEvent {
	__onWatchEvent: (type: WatchEventType, path?: string) => void;
}

export const dispatcher_WatchEvent = new PhaseRunnerDispatcher<OnWatchEvent>('__onWatchEvent');

export interface OnUnitWatchCompiled {
	__onUnitWatchCompiled: (init: BaseUnit) => void;
}

export const dispatcher_UnitWatchCompile = new PhaseRunnerDispatcher<OnUnitWatchCompiled>('__onUnitWatchCompiled');