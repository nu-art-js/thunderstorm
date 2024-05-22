import {ProjectManager} from './logic/ProjectManager';
import {DebugFlag, LogLevel, StaticLogger} from '@nu-art/ts-common';
import {
	Phase_CheckCyclicImports,
	Phase_Clean,
	Phase_Compile,
	Phase_CompileWatch,
	Phase_DeployBackend,
	Phase_DeployFrontend,
	Phase_InstallGlobals,
	Phase_InstallPackages,
	Phase_Launch,
	Phase_Lint,
	Phase_PackagePurge,
	Phase_PreCompile,
	Phase_PrepareCompile,
	Phase_PrepareParams,
	Phase_PrintDependencyTree,
	Phase_PrintEnv,
	Phase_PrintHelp,
	Phase_ResolveEnv,
	Phase_ResolvePackages,
	Phase_ResolveTemplate,
	Phase_SetupProject,
	Phase_SetWithThunderstorm,
} from './phases/phases';
import {RuntimeParams} from './core/params/params';


DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;
const projectManager = new ProjectManager();

projectManager.registerPhase(Phase_PrintHelp);
projectManager.registerPhase(Phase_SetWithThunderstorm);
projectManager.registerPhase(Phase_SetupProject);
projectManager.registerPhase(Phase_PrepareParams);
projectManager.registerPhase(Phase_ResolveTemplate);
projectManager.registerPhase(Phase_ResolveEnv);
projectManager.registerPhase(Phase_ResolvePackages);
projectManager.registerPhase(Phase_PrintDependencyTree);
projectManager.registerPhase(Phase_CheckCyclicImports);
projectManager.registerPhase(Phase_PrintEnv);
projectManager.registerPhase(Phase_PackagePurge);
projectManager.registerPhase(Phase_InstallGlobals);
projectManager.registerPhase(Phase_InstallPackages);
projectManager.registerPhase(Phase_Clean);
projectManager.registerPhase(Phase_Lint);
projectManager.registerPhase(Phase_PrepareCompile);
projectManager.registerPhase(Phase_PreCompile);
projectManager.registerPhase(Phase_Compile);
projectManager.registerPhase(Phase_CompileWatch);
projectManager.registerPhase(Phase_Launch);
projectManager.registerPhase(Phase_DeployFrontend);
projectManager.registerPhase(Phase_DeployBackend);

projectManager.execute()
	.then(() => {
		StaticLogger.logInfo('completed');
	})
	.catch(err => {
		StaticLogger.logError('Failed with error: ', err);
	});
