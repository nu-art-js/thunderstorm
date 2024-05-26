import {Phase} from './types';
import {RuntimeParams} from '../../core/params/params';

export type Phase_Help = typeof phase_Help;
export const phase_Help: Phase<'printHelp'> = {
	name:'Help',
	method:'printHelp',
	filter: () => RuntimeParams.help,
	terminateAfterPhase: true,
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

export type Phase_ResolveConfigs = typeof phase_ResolveConfigs;
export const phase_ResolveConfigs: Phase<'resolveConfigs'> = {
	name:'Resolve Configs',
	method:'resolveConfigs',
	//TODO: Should have a filter
}

export const allPhases = [phase_Help,phase_Install,phase_CopyPackageJSON,phase_PreCompile,phase_Compile,phase_ResolveConfigs];