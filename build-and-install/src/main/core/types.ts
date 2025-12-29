import {AsyncVoidFunction} from '@nu-art/ts-common';
import {BaseUnit} from '../units/index.js';
import {Phase} from '../phases/definitions/index.js';

export type Unit<P extends Phase<string>[]> = BaseUnit & UnitPhaseImplementor<P>;

export type UnitPhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]: AsyncVoidFunction;
}

export type WatchEventType = 'update' | 'add' | 'remove_file' | 'remove_dir' | 'ready'

export type RunningStatus = {
	phaseKey: string,
	unitsLayerIndex?: number
};


export const WatchEvent_Add: WatchEventType = 'add';
export const WatchEvent_Update: WatchEventType = 'update';
export const WatchEvent_RemoveDir: WatchEventType = 'remove_dir';
export const WatchEvent_RemoveFile: WatchEventType = 'remove_file';
export const WatchEvent_Ready: WatchEventType = 'ready';