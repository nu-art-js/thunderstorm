import {AsyncVoidFunction} from '@nu-art/ts-common';
import { Phase } from '../phase';
import {BaseUnit} from './core';

export type Unit<P extends Phase<string>[]> = BaseUnit & UnitPhaseImplementor<P>;

export type UnitPhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]:AsyncVoidFunction;
}