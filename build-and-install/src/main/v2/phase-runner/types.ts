import {AsyncVoidFunction} from '@nu-art/ts-common';
import { Phase } from '../phase/types';

export type PhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]:AsyncVoidFunction;
}

export type PhasesImplementor<Phases extends Phase<string>[]> = {
	[K in Phases[number]['method']]?: AsyncVoidFunction
}