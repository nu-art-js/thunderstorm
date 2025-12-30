import {
	BeLogged,
	Constructor,
	DebugFlag,
	filterDuplicates,
	ImplementationMissingException,
	LogClient_Terminal,
	Logger,
	LogLevel,
	merge
} from '@nu-art/ts-common';
import {AllBaiParams, BaiParams} from './core/params/params.js';
import {Phase, phases_Build, phases_Deploy, phases_Launch, phases_Terminating} from './v3/phase/index.js';
import {UnitsMapper} from './v3/UnitsMapper/UnitsMapper.js';
import {FilesCache} from './v3/core/FilesCache.js';
import {BAI_Config} from './core/types/index.js';
import {ProjectUnit, ProjectUnit_RuntimeContext} from './v3/units/ProjectUnit.js';
import {PhaseManager} from './v3/PhaseManager.js';
import {BaseUnit, Unit_NodeProject} from './v3/units/index.js';
import {Workspace} from './v3/Workspace.js';
import {resolve} from 'path';
import {CONST_BaiConfig, CONST_NodeModules, CONST_VersionApp} from './core/consts.js';
import {UnitMapper_FirebaseFunction, UnitMapper_FirebaseHosting, UnitMapper_NodeLib, UnitMapper_NodeProject} from './v3/UnitsMapper/resolvers/index.js';
import {CLIParamsResolver} from '@nu-art/commando/cli-params/CLIParamsResolver';
import {BaseCliParam} from '@nu-art/commando/cli-params/types';
import {RunningStatusHandler} from './v3/RunningStatusHandler.js';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';


/**
 * Default phase groups executed in order: Build, Terminating, Launch, Deploy.
 */
export const DefaultPhases = [
	...phases_Build,
	...phases_Terminating,
	...phases_Launch,
	...phases_Deploy,
];

type BAI_Options = { pathToProject: string, runtimeParams: BaseCliParam<string, any>[] };

/**
 * Main orchestrator for build-and-install system.
 * 
 * Manages the complete lifecycle of building, testing, and deploying units in a workspace:
 * 1. **Initialization**: Sets up logging, CLI params, workspace, and unit mappers
 * 2. **Discovery**: Scans workspace for units (packages/projects) using UnitsMapper
 * 3. **Dependency Resolution**: Builds dependency tree and determines execution order
 * 4. **Phase Execution**: Executes phases (prepare, compile, test, deploy, etc.) on units
 * 
 * **Key Concepts**:
 * - **Units**: Discovered packages/projects in the workspace (NodeLib, NodeProject, Firebase, etc.)
 * - **Phases**: Execution steps (prepare, compile, test, lint, deploy, etc.)
 * - **Active Units**: Units selected for execution (via --use-package or all units)
 * - **Project Units**: Active units + their transitive dependencies
 * - **Dependency Tree**: Layers of units ordered from dependencies to dependents
 * 
 * **Workflow**:
 * 1. `init()` - Initialize logging and unit mappers
 * 2. `build()` - Scan workspace, resolve dependencies, build execution plan
 * 3. `run()` - Execute phases on units according to dependency order
 * 
 * **Runtime Parameters**: Controlled via CLI flags (see `AllBaiParams`):
 * - `--use-package`: Work on specific units only
 * - `--build-tree`: Include transitive dependencies in active units
 * - `--continue`: Resume from last completed step
 * - `--dry-run`: Log without executing
 * - `--install`, `--clean`, `--purge`: Package management flags
 */
export class BuildAndInstall
	extends Logger {

	private unitsMapper!: UnitsMapper;
	private phases: Phase<string>[][] = DefaultPhases;
	private pathToProject: string;
	readonly workspace: Workspace;
	readonly nodeProjectUnit!: Unit_NodeProject;
	readonly runtimeParams: BaiParams;
	readonly runningStatus: RunningStatusHandler;
	readonly phaseManager!: PhaseManager;

	/**
	 * Creates a new BuildAndInstall instance.
	 * 
	 * **Initialization**:
	 * - Resolves project path (INIT_CWD or cwd)
	 * - Merges CLI params with defaults
	 * - Sets up logging (Terminal client)
	 * - Creates Workspace and RunningStatusHandler
	 * 
	 * @param config - Optional configuration (pathToProject, runtimeParams)
	 */
	constructor(config: Partial<BAI_Options> = {}) {
		super();
		const defaultConfig: BAI_Options = merge({
			pathToProject: process.env.INIT_CWD ?? process.cwd(),
		}, config);

		defaultConfig.runtimeParams = filterDuplicates([...(config.runtimeParams ?? []), ...AllBaiParams], param => param.keyName);
		this.runtimeParams = CLIParamsResolver.create(...defaultConfig.runtimeParams).resolveParamValue() as BaiParams;
		BeLogged.addClient(LogClient_Terminal);
		this.pathToProject = defaultConfig.pathToProject;
		this.runningStatus = new RunningStatusHandler(this.pathToProject, this.runtimeParams);
		this.workspace = new Workspace();
		this.workspace.setMinLevel(DebugFlag.DefaultLogLevel);
	}

	/**
	 * Initializes the build system.
	 * 
	 * **Actions**:
	 * - Initializes running status (loads resume state if --continue)
	 * - Sets log level based on --debug/--verbose flags
	 * - Creates and configures UnitsMapper with default rules
	 * 
	 * Must be called before `build()`.
	 */
	async init() {
		await this.runningStatus.init();

		if (this.runtimeParams.debug)
			DebugFlag.DefaultLogLevel = LogLevel.Debug;

		if (this.runtimeParams.verbose)
			DebugFlag.DefaultLogLevel = LogLevel.Verbose;

		this.setMinLevel(DebugFlag.DefaultLogLevel);
		this.logDebug('Runtime params:', this.runtimeParams);
		this.unitsMapper = new UnitsMapper();
		this.prepareUnitsMapper(this.unitsMapper);
	}

	/**
	 * Configures the UnitsMapper with default unit resolution rules.
	 * 
	 * Adds rules for:
	 * - NodeLib (TypeScript libraries)
	 * - NodeProject (Root project)
	 * - FirebaseHosting (Firebase hosting apps)
	 * - FirebaseFunction (Firebase functions)
	 * 
	 * Can be overridden by calling `setApplicativeUnits()` or customizing the mapper.
	 * 
	 * @param unitsMapper - The mapper to configure
	 */
	prepareUnitsMapper(unitsMapper: UnitsMapper) {
		unitsMapper
			.addRules(UnitMapper_NodeLib)
			.addRules(UnitMapper_NodeProject)
			.addRules(UnitMapper_FirebaseHosting)
			.addRules(UnitMapper_FirebaseFunction)
			.setRuntimeParams(this.runtimeParams);
	}

	/**
	 * Adds additional project units from applicative configuration.
	 * 
	 * Useful for adding units that aren't discovered via file system scan
	 * (e.g., dynamically generated units, external units).
	 * 
	 * @param projectUnits - Additional project units to include
	 */
	setApplicativeUnits(projectUnits: ProjectUnit[]) {
		this.workspace.addProjectUnits(projectUnits);
	}

	/**
	 * Overrides the default phase groups.
	 * 
	 * By default uses: Build, Terminating, Launch, Deploy phases.
	 * 
	 * @param phases - Array of phase groups (each group runs in parallel)
	 */
	setPhases(phases: Phase<string>[][]) {
		this.phases = phases;
	}

	/**
	 * @deprecated Use workspace.projectUnits instead
	 * Backward compatibility getter for existing tests
	 */
	get projectUnits(): ReadonlyArray<ProjectUnit> {
		return this.workspace.projectUnits;
	}

	/**
	 * @deprecated Use workspace.scannedUnits instead
	 * Backward compatibility getter for existing tests
	 */
	get scannedUnits(): ReadonlyArray<BaseUnit<any>> {
		return this.workspace.scannedUnits;
	}

	/**
	 * Executes all phases on units according to the execution plan.
	 * 
	 * **Process**:
	 * 1. Calculates execution steps (which phases run on which units)
	 * 2. Sets up SIGINT handler for graceful shutdown (up to 5 interrupts)
	 * 3. Executes phases in dependency order (dependencies first)
	 * 4. Handles errors and aggregates phase exceptions
	 * 
	 * **Resume Support**: If `--continue` flag is set, skips already completed steps.
	 * 
	 * **Error Handling**: Throws `PhaseAggregatedException` if any phase fails,
	 * containing all unit/phase errors.
	 * 
	 * Must be called after `build()`.
	 */
	async run() {
		const executionPlan = await this.phaseManager.calculateExecutionSteps();
		let killCounter = 0;
		process.on('SIGINT', async () => {
			this.logWarning('\n\n\n---------------------------------- Process Interrupted ----------------------------------\n\n\n');
			await this.phaseManager.break();
			killCounter++;
			if (killCounter > 5)
				process.exit(1);
		});

		try {
			await this.phaseManager.execute(executionPlan);

			this.logInfo('Completed successfully');
			this.logInfo('---------------------------------- Process Completed successfully ----------------------------------');
		} catch (e) {
			this.logInfo('Process Failed');
			this.logInfo('---------------------------------- Process Failed ----------------------------------');
			throw e;
		}
	}

	/**
	 * Builds the workspace and prepares for execution.
	 * 
	 * **Complete Build Process**:
	 * 1. **Initialize**: Calls `init()` to set up mappers and logging
	 * 2. **Scan**: Discovers all units in the workspace using UnitsMapper
	 * 3. **Root Unit**: Finds and validates the root NodeProject unit
	 * 4. **Config**: Loads BAI config (bai-config.json) from root unit
	 * 5. **Dependencies**: Initializes dependency mapper and builds dependency tree
	 * 6. **Version**: Loads version from version-app.json (defaults to '1.0.0')
	 * 7. **Auto-install**: Enables install if node_modules is missing
	 * 8. **Unit Selection**: Derives active/project units based on runtime params
	 * 9. **Context**: Sets up runtime context for all project units
	 * 10. **Execution Plan**: Creates PhaseManager with dependency-ordered unit layers
	 * 
	 * **Side Effects**:
	 * - Sets `this.nodeProjectUnit` (via @ts-ignore due to readonly)
	 * - Sets `this.phaseManager` (via @ts-ignore due to readonly)
	 * - May enable `install` flag if node_modules missing
	 * 
	 * **Throws**: `ImplementationMissingException` if no NodeProject unit found.
	 */
	async build() {
		await this.init();
		
		// Scan units from workspace
		await this.workspace.scanUnits(this.pathToProject, this.unitsMapper);

		const nodeProjectUnit = this.workspace.getNodeProjectUnit();
		if (!nodeProjectUnit)
			throw new ImplementationMissingException('NodeProject unit not found. Make sure you have a Unit_NodeProject in your project.');

		// @ts-ignore
		this['nodeProjectUnit'] = nodeProjectUnit;

		const pathToBaiConfig = resolve(nodeProjectUnit.config.fullPath, CONST_BaiConfig);
		this.logDebug(`Loading BAI-Config from: ${pathToBaiConfig}`);
		const baiConfig = await FilesCache.load.json<BAI_Config>(pathToBaiConfig);
		this.logVerbose('Loaded BAI-Config', baiConfig);

		const globalOutputFolder = resolve(this.pathToProject, '.trash/output');
		this.workspace.initializeDependencyMapper(globalOutputFolder);

		let version = await this.loadVersion();

		if (!(await FileSystemUtils.file.exists(resolve(nodeProjectUnit.config.fullPath, CONST_NodeModules)))) {
			this.logInfo(`root project is missing ${CONST_NodeModules} folder. Enabling install...`);
			this.runtimeParams.install = true;
		}

		// Derive active and project units based on runtime params
		const units = this.workspace.deriveActiveAndProjectUnits(this.runtimeParams);
		
		const childProjectUnits = this.workspace.getUnitsByKeys<ProjectUnit>(units.projectUnits);
		nodeProjectUnit.assignUnit(childProjectUnits);

		this.logDebug(`Parent unit: ${nodeProjectUnit.config.key}`);

		const runtimeContext: ProjectUnit_RuntimeContext = ({
			version: version.version,
			parentUnit: nodeProjectUnit,
			childUnits: childProjectUnits,
			baiConfig,
			runtimeParams: this.runtimeParams,
			unitsMapper: this.workspace.getDependencyMapper(),
			unitsResolver: <Class extends BaseUnit>(keys: string[], className: Constructor<Class>): Class[] => {
				return this.workspace.getUnitsByKeys<Class>(keys, className);
			},
			globalOutputFolder,
			workspace: this.workspace,
		});

		this.workspace.projectUnits.forEach(unit => unit.setupRuntimeContext(runtimeContext));

		const unitDependencyTree = await this.workspace.buildDependencyTree(units.projectUnits);

		const manager = new PhaseManager(this.runningStatus, this.phases, unitDependencyTree, units.activeUnits, units.projectUnits);
		// @ts-ignore
		this['phaseManager'] = manager;
	}

	/**
	 * Loads version from version-app.json file.
	 * 
	 * **Behavior**:
	 * - Looks for `version-app.json` in project root
	 * - Returns version from file if exists
	 * - Defaults to '1.0.0' if file not found (logs warning)
	 * 
	 * @returns Promise resolving to version object
	 */
	private async loadVersion() {
		const versionFilePath = resolve(this.pathToProject, CONST_VersionApp);
		if (await FileSystemUtils.file.exists(versionFilePath)) {
			this.logDebug('Loading version from: ', versionFilePath);
			return await FileSystemUtils.file.read.json<{ version: string }>(versionFilePath, {version: '1.0.0'});
		} else {
			this.logWarning(`No version file found at '${versionFilePath}', using default version: '1.0.0'`);
			return {version: '1.0.0'};
		}
	}
}
