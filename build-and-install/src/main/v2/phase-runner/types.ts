import {AsyncVoidFunction} from '@nu-art/ts-common';
import {Phase} from '../phase/types';

export type PhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]: AsyncVoidFunction;
}

export type PhasesImplementor<Phases extends Phase<string>[]> = {
	[K in Phases[number]['method']]?: AsyncVoidFunction
}

export const PhaseRunnerMode_Normal = 'normal';
export const PhaseRunnerMode_Continue = 'continue';
const PhaseRunnerModes = [PhaseRunnerMode_Normal, PhaseRunnerMode_Continue] as const;
export type PhaseRunnerMode = typeof PhaseRunnerModes[number];