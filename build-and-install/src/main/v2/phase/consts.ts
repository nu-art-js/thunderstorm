import {Phase} from './types';
import {RuntimeParams} from '../../core/params/params';

//######################### Terminating Phases #########################

export type Phase_Help = typeof phase_Help;
export const phase_Help: Phase<'printHelp'> = {
	name: 'Help',
	method: 'printHelp',
	filter: () => RuntimeParams.help,
	terminateAfterPhase: true,
};

export type Phase_PrintDependencyTree = typeof phase_PrintDependencyTree;
export const phase_PrintDependencyTree: Phase<'printDependencyTree'> = {
	name: 'Print Dependency Tree',
	method: 'printDependencyTree',
	filter: () => RuntimeParams.dependencyTree,
	terminateAfterPhase: true,
};

export type Phase_CheckCyclicImports = typeof phase_CheckCyclicImports;
export const phase_CheckCyclicImports: Phase<'checkCyclicImports'> = {
	name: 'Check Cyclic Imports',
	method: 'checkCyclicImports',
	filter: () => RuntimeParams.checkCyclicImports,
	terminateAfterPhase: true,
};

export type Phase_PrintEnv = typeof phase_PrintEnv;
export const phase_PrintEnv: Phase<'printEnv'> = {
	name: 'Print ENV',
	method: 'printEnv',
	terminateAfterPhase: true,
	filter: () => RuntimeParams.printEnv,
};

export type Phase_Debug = typeof phase_Debug;
export const phase_Debug: Phase<'debug'> = {
	name:'Debug',
	method:'debug',
	terminateAfterPhase: true,
	filter: () => RuntimeParams.debug,
};

const terminatingPhases: Phase<string>[] = [
	phase_Help,
	phase_PrintDependencyTree,
	phase_CheckCyclicImports,
	phase_PrintEnv,
	// phase_Debug
];

//######################### Build Phases #########################

export type Phase_Purge = typeof phase_Purge;
export const phase_Purge: Phase<'purge'> = {
	name:'Purge',
	method:'purge',
	filter: () => RuntimeParams.purge,
}

export type Phase_CopyPackageJSON = typeof phase_CopyPackageJSON;
export const phase_CopyPackageJSON: Phase<'copyPackageJson'> = {
	name: 'Copy Package JSON',
	method: 'copyPackageJson',
};

export type Phase_Install = typeof phase_Install;
export const phase_Install: Phase<'install'> = {
	name: 'Install',
	method: 'install',
	filter: () => RuntimeParams.install || RuntimeParams.installPackages || RuntimeParams.installGlobals,
};

export type Phase_ResolveConfigs = typeof phase_ResolveConfigs;
export const phase_ResolveConfigs: Phase<'resolveConfigs'> = {
	name: 'Resolve Configs',
	method: 'resolveConfigs',
	//TODO: Should have a filter
};

export type Phase_Lint = typeof phase_Lint;
export const phase_Lint: Phase<'lint'> = {
	name:'Lint',
	method:'lint',
	filter: () => RuntimeParams.lint,
}

export type Phase_PreCompile = typeof phase_PreCompile;
export const phase_PreCompile: Phase<'preCompile'> = {
	name: 'Pre Compile',
	method: 'preCompile',
	filter: () => !RuntimeParams.noBuild,
};

export type Phase_Compile = typeof phase_Compile;
export const phase_Compile: Phase<'compile'> = {
	name: 'Compile',
	method: 'compile',
	filter: () => !RuntimeParams.noBuild,
};

export type Phase_Launch = typeof phase_Launch;
export const phase_Launch: Phase<'launch'> = {
	name:'Launch',
	method: 'launch',
	filter: () => !!RuntimeParams.launch,
}

const buildPhases: Phase<string>[] = [
	phase_Purge,
	phase_CopyPackageJSON,
	phase_Install,
	phase_ResolveConfigs,
	phase_Lint,
	phase_PreCompile,
	phase_Compile,
	phase_Launch
];

export const allPhases = [...terminatingPhases, ...buildPhases];