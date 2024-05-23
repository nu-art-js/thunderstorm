import {AsyncVoidFunction} from '@nu-art/ts-common';

export type Phase<PhaseMethod extends string> = {
	name: string
	method: PhaseMethod
	filter?: () => (Promise<boolean> | boolean);
}

export type PhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]:AsyncVoidFunction;
}

export type PhasesImplementor<Phases extends Phase<string>[]> = {
	[K in Phases[number]['method']]?: AsyncVoidFunction
}

export type RunnerParamKeys = 'rootPath' | 'configPath';

export type RunnerParams = {[K in RunnerParamKeys]:string};