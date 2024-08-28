import {AsyncVoidFunction} from '@thunder-storm/common';
import {Phase} from '../phase';
import {BaseUnit} from './core';

export type Unit<P extends Phase<string>[]> = BaseUnit & UnitPhaseImplementor<P>;

export type UnitPhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]: AsyncVoidFunction;
}

export type WatchEventType = 'update' | 'add' | 'remove_file' | 'remove_dir' | 'ready'