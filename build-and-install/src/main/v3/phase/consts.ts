import {Phase} from './types';

//######################### Terminating Phases #########################


export type Phase_PrintDependencyTree = typeof phase_PrintDependencyTree;
export const phaseKey_PrintDependencyTree = 'print-dependency-tree';
export const phase_PrintDependencyTree: Phase<'printDependencyTree'> = {
	key: phaseKey_PrintDependencyTree,
	name: 'Print Dependency Tree',
	method: 'printDependencyTree',
	filter: (baiParams) => baiParams.dependencyTree,
	terminateAfterPhase: true,
};

export type Phase_CheckCyclicImports = typeof phase_CheckCyclicImports;
export const phaseKey_CheckCyclicImports = 'check-cyclic-imports';
export const phase_CheckCyclicImports: Phase<'checkCyclicImports'> = {
	key: phaseKey_CheckCyclicImports,
	name: 'Check Cyclic Imports',
	method: 'checkCyclicImports',
	filter: (baiParams) => baiParams.checkCyclicImports,
	terminateAfterPhase: true,
};

// export const phases_Terminating: Phase<string>[] = [
// 	phase_PrintDependencyTree,
// 	phase_CheckCyclicImports,
// ];

//######################### Build Phases #########################

export type Phase_Purge = typeof phase_Purge;
export const phaseKey_Purge = 'purge';
export const phase_Purge: Phase<'purge'> = {
	key: phaseKey_Purge,
	name: 'Purge',
	method: 'purge',
	filter: (baiParams) => baiParams.purge,
};

// export type Phase_CopyPackageJSON = typeof phase_CopyPackageJSON;
// export const phaseKey_CopyPackageJSON = 'copy-package-json';
// export const phase_CopyPackageJSON: Phase<'copyPackageJson'> = {
// 	key: phaseKey_CopyPackageJSON,
// 	unitFilter: (unit) => 'copyPackageJson' in unit,
// 	name: 'Copy Package JSON',
// 	method: 'copyPackageJson',
// };

export type Phase_Install = typeof phase_Install;
export const phaseKey_Install = 'install';
export const phase_Install: Phase<'install'> = {
	key: phaseKey_Install,
	name: 'Install',
	method: 'install',
	breakPhases: true,
	filter: (baiParams) => baiParams.install || baiParams.installPackages || baiParams.installGlobals,
};

export type Phase_Lint = typeof phase_Lint;
export const phaseKey_Lint = 'lint';
export const phase_Lint: Phase<'lint'> = {
	key: phaseKey_Lint,
	name: 'Lint',
	method: 'lint',
	filter: (baiParams) => baiParams.lint,
};

export type Phase_Compile = typeof phase_Compile;
export const phaseKey_Compile = 'compile';
export const phase_Compile: Phase<'compile'> = {
	key: phaseKey_Compile,
	name: 'Compile',
	method: 'compile',
	filter: (baiParams) => !baiParams.noBuild,
};

export type Phase_PreCompile = typeof phase_PreCompile;
export const phaseKey_PreCompile = 'preCompile';
export const phase_PreCompile: Phase<'preCompile'> = {
	key: phaseKey_PreCompile,
	name: 'PreCompile',
	method: 'preCompile',
	filter: (baiParams) => !baiParams.noBuild,
};

export type Phase_Test = typeof phase_Test;
export const phaseKey_Test = 'runTests';
export const phase_Test: Phase<'runTests'> = {
	key: phaseKey_Test,
	name: 'Test',
	method: 'runTests',
	filter: (baiParams) => baiParams.test,
	runUnitsInDependency: true,
	dependencyPhaseKeys: [phaseKey_Compile],
};

export type Phase_Watch = typeof phase_Watch;
export const phaseKey_Watch = 'watch';
export const phase_Watch: Phase<'watch'> = {
	key: phaseKey_Watch,
	name: 'Watch',
	method: 'watch',
	breakPhases: true,
	filter: (baiParams) => baiParams.watch,
};

export const phases_Build: Phase<string>[] = [
	phase_Purge,
	phase_Install,
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
	filter: (baiParams) => !!baiParams.launch,
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
	filter: (baiParams) => !!baiParams.deployFrontend,
};

export type Phase_DeployBackend = typeof phase_DeployBackend;
export const phaseKey_DeployBackend = 'deploy-backend';
export const phase_DeployBackend: Phase<'deployBackend'> = {
	key: phaseKey_DeployBackend,
	name: 'Deploy Backend',
	method: 'deployBackend',
	filter: (baiParams) => !!baiParams.deployBackend,
	breakPhases: true,
};

export const phases_Deploy: Phase<string>[] = [phase_DeployFrontend, phase_DeployBackend];