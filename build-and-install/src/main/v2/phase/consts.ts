import {Phase} from './types';
import {RuntimeParams} from '../../core/params/params';

//######################### Terminating Phases #########################

export type Phase_Help = typeof phase_Help;
export const phaseKey_Help = 'help';
export const phase_Help: Phase<'printHelp'> = {
	key: phaseKey_Help,
	name: 'Help',
	method: 'printHelp',
	filter: () => RuntimeParams.help,
	terminateAfterPhase: true,
};

export type Phase_PrintDependencyTree = typeof phase_PrintDependencyTree;
export const phaseKey_PrintDependencyTree = 'print-dependency-tree';
export const phase_PrintDependencyTree: Phase<'printDependencyTree'> = {
	key: phaseKey_PrintDependencyTree,
	name: 'Print Dependency Tree',
	method: 'printDependencyTree',
	filter: () => RuntimeParams.dependencyTree,
	terminateAfterPhase: true,
};

export type Phase_CheckCyclicImports = typeof phase_CheckCyclicImports;
export const phaseKey_CheckCyclicImports = 'check-cyclic-imports';
export const phase_CheckCyclicImports: Phase<'checkCyclicImports'> = {
	key: phaseKey_CheckCyclicImports,
	name: 'Check Cyclic Imports',
	method: 'checkCyclicImports',
	filter: () => RuntimeParams.checkCyclicImports,
	terminateAfterPhase: true,
};

export type Phase_PrintEnv = typeof phase_PrintEnv;
export const phaseKey_PrintEnv = 'print-env';
export const phase_PrintEnv: Phase<'printEnv'> = {
	key: phaseKey_PrintEnv,
	name: 'Print ENV',
	method: 'printEnv',
	terminateAfterPhase: true,
	filter: () => RuntimeParams.printEnv,
};

export type Phase_Debug = typeof phase_Debug;
export const phaseKey_Debug = 'debug';
export const phase_Debug: Phase<'printDebug'> = {
	key: phaseKey_Debug,
	name: 'Debug',
	method: 'printDebug',
	filter: () => RuntimeParams.debug,
};

export const phases_Terminating: Phase<string>[] = [
	phase_Help,
	phase_PrintDependencyTree,
	phase_CheckCyclicImports,
	phase_PrintEnv,
	phase_Debug
];

//######################### Build Phases #########################

export type Phase_Purge = typeof phase_Purge;
export const phaseKey_Purge = 'purge';
export const phase_Purge: Phase<'purge'> = {
	key: phaseKey_Purge,
	name: 'Purge',
	method: 'purge',
	filter: () => RuntimeParams.purge,
};

export type Phase_CopyPackageJSON = typeof phase_CopyPackageJSON;
export const phaseKey_CopyPackageJSON = 'copy-package-json';
export const phase_CopyPackageJSON: Phase<'copyPackageJson'> = {
	key: phaseKey_CopyPackageJSON,
	unitFilter: (unit) => 'copyPackageJson' in unit,
	name: 'Copy Package JSON',
	method: 'copyPackageJson',
};

export type Phase_Install = typeof phase_Install;
export const phaseKey_Install = 'install';
export const phase_Install: Phase<'install'> = {
	key: phaseKey_Install,
	name: 'Install',
	method: 'install',
	breakPhases: true,
	filter: () => RuntimeParams.install || RuntimeParams.installPackages || RuntimeParams.installGlobals,
};

export type Phase_ResolveConfigs = typeof phase_ResolveConfigs;
export const phaseKey_ResolveConfigs = 'resolve-configs';
export const phase_ResolveConfigs: Phase<'resolveConfigs'> = {
	key: phaseKey_ResolveConfigs,
	name: 'Resolve Configs',
	method: 'resolveConfigs',
	//TODO: Should have a filter
};

export type Phase_Lint = typeof phase_Lint;
export const phaseKey_Lint = 'lint';
export const phase_Lint: Phase<'lint'> = {
	key: phaseKey_Lint,
	name: 'Lint',
	method: 'lint',
	filter: () => RuntimeParams.lint,
};

export type Phase_PreCompile = typeof phase_PreCompile;
export const phaseKey_PreCompile = 'pre-compile';
export const phase_PreCompile: Phase<'preCompile'> = {
	key: phaseKey_PreCompile,
	name: 'Pre Compile',
	method: 'preCompile',
	filter: () => !RuntimeParams.noBuild,
	runUnitsInDependency: true,
};

export type Phase_Compile = typeof phase_Compile;
export const phaseKey_Compile = 'compile';
export const phase_Compile: Phase<'compile'> = {
	key: phaseKey_Compile,
	name: 'Compile',
	method: 'compile',
	filter: () => !RuntimeParams.noBuild,
	runUnitsInDependency: true,
	dependencyPhaseKeys: [phaseKey_CopyPackageJSON, phaseKey_PreCompile],
};

export type Phase_Watch = typeof phase_Watch;
export const phaseKey_Watch = 'watch';
export const phase_Watch: Phase<'watch'> = {
	key: phaseKey_Watch,
	name: 'Watch',
	method: 'watch',
	breakPhases: true,
	filter: () => RuntimeParams.watch,
};

export const phases_Build: Phase<string>[] = [
	phase_Purge,
	phase_CopyPackageJSON,
	phase_Install,
	phase_ResolveConfigs,
	phase_Lint,
	phase_PreCompile,
	phase_Compile,
	phase_Watch
];

//######################### Launch Phases #########################

export type Phase_Launch = typeof phase_Launch;
export const phaseKey_Launch = 'launch';
export const phase_Launch: Phase<'launch'> = {
	key: phaseKey_Launch,
	name: 'Launch',
	method: 'launch',
	filter: () => !!RuntimeParams.launch,
	dependencyPhaseKeys: [phaseKey_ResolveConfigs],
};

export const phases_Launch: Phase<string>[] = [
	phase_Launch,
];

//######################### Deploy Phases #########################

export type Phase_DeployFrontend = typeof phase_DeployFrontend;
export const phaseKey_DeployFrontend = 'deploy-frontend';
export const phase_DeployFrontend: Phase<'deployFrontend'> = {
	key: phaseKey_DeployFrontend,
	name: 'Deploy Frontend',
	method: 'deployFrontend',
	breakPhases: true,
	filter: () => !!RuntimeParams.deployFrontend,
	dependencyPhaseKeys: [phaseKey_Compile],
};

export type Phase_DeployBackend = typeof phase_DeployBackend;
export const phaseKey_DeployBackend = 'deploy-backend';
export const phase_DeployBackend: Phase<'deployBackend'> = {
	key: phaseKey_DeployBackend,
	name: 'Deploy Backend',
	method: 'deployBackend',
	filter: () => !!RuntimeParams.deployBackend,
	breakPhases: true,
	dependencyPhaseKeys: [phaseKey_Compile],
};

export const phases_Deploy: Phase<string>[] = [phase_DeployFrontend, phase_DeployBackend];