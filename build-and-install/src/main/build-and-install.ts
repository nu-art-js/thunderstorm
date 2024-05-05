import {ProjectManager} from './logic/ProjectManager';
import {StaticLogger} from '@nu-art/ts-common';
import {
	Phase_CheckCyclicImports,
	Phase_Clean,
	Phase_Compile, Phase_CompileWatch,
	Phase_DeployBackend,
	Phase_DeployFrontend,
	Phase_InstallGlobals,
	Phase_InstallNvm,
	Phase_InstallPackages,
	Phase_InstallPnpm,
	Phase_Launch,
	Phase_Lint,
	Phase_PackagePurge,
	Phase_PrintDependencyTree,
	Phase_PrintEnv,
	Phase_PrintHelp,
	Phase_ResolveEnv,
	Phase_ResolvePackages,
	Phase_ResolveTemplate,
	Phase_SetupProject,
	Phase_SetWithThunderstorm,
	projectPackages
} from './phases/phases';


const projectManager = new ProjectManager(projectPackages);

projectManager.registerPhase(Phase_PrintHelp);
projectManager.registerPhase(Phase_SetWithThunderstorm);
projectManager.registerPhase(Phase_SetupProject);
projectManager.registerPhase(Phase_ResolveTemplate);
projectManager.registerPhase(Phase_ResolveEnv);
projectManager.registerPhase(Phase_ResolvePackages);
projectManager.registerPhase(Phase_InstallNvm);
projectManager.registerPhase(Phase_PrintDependencyTree);
projectManager.registerPhase(Phase_CheckCyclicImports);
projectManager.registerPhase(Phase_PrintEnv);
projectManager.registerPhase(Phase_PackagePurge);
projectManager.registerPhase(Phase_InstallGlobals);
projectManager.registerPhase(Phase_InstallPnpm);
projectManager.registerPhase(Phase_InstallPackages);
projectManager.registerPhase(Phase_Clean);
projectManager.registerPhase(Phase_Lint);
projectManager.registerPhase(Phase_Compile);
projectManager.registerPhase(Phase_CompileWatch);
projectManager.registerPhase(Phase_Launch);
projectManager.registerPhase(Phase_DeployFrontend);
projectManager.registerPhase(Phase_DeployBackend);
// projectManager.registerPhase(Phase_Debug);

(async () => {
	return projectManager.execute();
	// await projectManager.runPhaseByKey('with-ts-home');
	// await projectManager.runPhaseByKey('setup-project');
	// await projectManager.runPhaseByKey('resolve-template');
	// await projectManager.runPhaseByKey('debug');
	// await projectManager.runPhaseByKey('resolve-env');
	// await projectManager.runPhaseByKey('firebase-function-test');
	// await projectManager.runPhaseByKey('install');
	// return projectManager.runPhaseByKey('launch');
	// return projectManager.runPhaseByKey('print-dependency-tree');
})()
	.then(() => StaticLogger.logInfo('completed'))
	.catch(err => StaticLogger.logError('Failed with error: ', err));
