import {Phase} from './types.js';

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

export type Phase_ToESM = typeof phase_ToESM;
export const phaseKey_ToESM = 'convertToESM';
export const phase_ToESM: Phase<'convertToESM'> = {
	key: phaseKey_ToESM,
	name: 'ToESM',
	method: 'convertToESM',
	filter: (baiParams) => !baiParams.toESM,
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

export type Phase_Prepare = typeof phase_Prepare;
export const phaseKey_Prepare = 'prepare';
export const phase_Prepare: Phase<'prepare'> = {
	key: phaseKey_Prepare,
	name: 'Prepare',
	method: 'prepare',
	filter: (baiParams) => baiParams.prepare,
};

export type Phase_Install = typeof phase_Install;
export const phaseKey_Install = 'install';
export const phase_Install: Phase<'install'> = {
	key: phaseKey_Install,
	name: 'Install',
	method: 'install',
	filter: (baiParams) => baiParams.install,
	dependencyPhase: [phase_Prepare]
};

export type Phase_Lint = typeof phase_Lint;
export const phaseKey_Lint = 'lint';
export const phase_Lint: Phase<'lint'> = {
	key: phaseKey_Lint,
	name: 'Lint',
	method: 'lint',
	filter: (baiParams) => baiParams.lint,
};

export type Phase_PreCompile = typeof phase_PreCompile;
export const phaseKey_PreCompile = 'preCompile';
export const phase_PreCompile: Phase<'preCompile'> = {
	key: phaseKey_PreCompile,
	name: 'PreCompile',
	method: 'preCompile',
	filter: (baiParams) => !baiParams.noBuild,
};

export type Phase_Compile = typeof phase_Compile;
export const phaseKey_Compile = 'compile';
export const phase_Compile: Phase<'compile'> = {
	key: phaseKey_Compile,
	name: 'Compile',
	method: 'compile',
	filter: (baiParams) => !baiParams.noBuild,
	dependencyPhase: [phase_PreCompile],
};

export type Phase_CompileWatch = typeof phase_CompileWatch;
export const phaseKey_CompileWatch = 'watchCompile';
export const phase_CompileWatch: Phase<'watchCompile'> = {
	key: phaseKey_CompileWatch,
	name: 'CompileWatch',
	method: 'watchCompile',
	filter: (baiParams) => !baiParams.noBuild,
};


export type Phase_Test = typeof phase_Test;
export const phaseKey_Test = 'runTests';
export const phase_Test: Phase<'runTests'> = {
	key: phaseKey_Test,
	name: 'Test',
	method: 'runTests',
	filter: (baiParams) => baiParams.test,
};

export type Phase_Watch = typeof phase_Watch;
export const phaseKey_Watch = 'watch';
export const phase_Watch: Phase<'watch'> = {
	key: phaseKey_Watch,
	name: 'Watch',
	method: 'watch',
	filter: (baiParams) => baiParams.watch,
};

export const phases_Build: Phase<string>[][] = [
	[phase_Purge, phase_Prepare],
	[phase_ToESM],
	[phase_Install],
	[phase_Lint, phase_PreCompile, phase_Compile, phase_Test,],
	[phase_Watch]
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

export const phases_Launch: Phase<string>[][] = [[
	phase_Launch,
]];

//######################### Publish and Deploy Phases #########################
export type Phase_Publish = typeof phase_Publish;
export const phaseKey_Publish = 'publish';
export const phase_Publish: Phase<'publish'> = {
	key: phaseKey_Publish,
	name: 'Publish',
	method: 'publish',
	filter: (baiParams) => !!baiParams.publish,
};

export type Phase_PostPublish = typeof phase_PostPublish;
export const phaseKey_PostPublish = 'postPublish';
export const phase_PostPublish: Phase<'postPublish'> = {
	key: phaseKey_PostPublish,
	name: 'PostPublish',
	method: 'postPublish',
	filter: (baiParams) => !!baiParams.publish,
};


export type Phase_Deploy = typeof phase_Deploy;
export const phaseKey_Deploy = 'deploy';
export const phase_Deploy: Phase<'deploy'> = {
	key: phaseKey_Deploy,
	name: 'Deploy',
	method: 'deploy',
	filter: (baiParams) => !!baiParams.deploy,
};

export const phases_Deploy: Phase<string>[][] = [[phase_Publish, phase_Deploy], [phase_PostPublish]];