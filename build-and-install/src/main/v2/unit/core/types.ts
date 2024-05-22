import {AsyncVoidFunction} from '@nu-art/ts-common';
import { Phase } from '../../phase-runner/types';
import { RuntimeParams } from '../../../core/params/params';

export type UnitPhaseImplementor<P extends Phase<string>[]> = {
	[K in P[number]['method']]:AsyncVoidFunction;
}

export type Phase_Install = typeof phase_Install;
export const phase_Install: Phase<'install'> = {
	name:'Install',
	method:'install',
	filter: () => RuntimeParams.install,
}

export type Phase_CopyPackageJSON = typeof phase_CopyPackageJSON;
export const phase_CopyPackageJSON: Phase<'copyPackageJson'> = {
	name: 'Copy Package JSON',
	method:'copyPackageJson',
}

export type Phase_PreCompile = typeof phase_PreCompile;
export const phase_PreCompile: Phase<'preCompile'> = {
	name:'Pre Compile',
	method: 'preCompile',
	filter: () => !RuntimeParams.noBuild,
}

export type Phase_Compile = typeof phase_Compile;
export const phase_Compile: Phase<'compile'> = {
	name:'Compile',
	method: 'compile',
	filter: () => !RuntimeParams.noBuild,
}