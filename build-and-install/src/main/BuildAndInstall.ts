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
import {AllBaiParams, BaiParams} from './params/params.js';
import {Phase, phases_Build, phases_Deploy, phases_Launch, phases_Terminating} from './phases/definitions/index.js';
import {UnitsMapper} from './units/discovery/UnitsMapper.js';
import {FilesCache} from './core/FilesCache.js';
import {BAI_Config} from './config/types/index.js';
import {ProjectUnit, ProjectUnit_RuntimeContext} from './units/base/ProjectUnit.js';
import {PhaseManager} from './phases/PhaseManager.js';
import {BaseUnit, Unit_NodeProject} from './units/index.js';
import {Workspace} from './workspace/Workspace.js';
import {resolve} from 'path';
import {CONST_BaiConfig, CONST_NodeModules, CONST_VersionApp} from './config/consts.js';
import {UnitMapper_FirebaseFunction, UnitMapper_FirebaseHosting, UnitMapper_NodeLib, UnitMapper_NodeProject} from './units/discovery/resolvers/index.js';
import {CLIParamsResolver} from '@nu-art/commando/cli-params/CLIParamsResolver';
import {BaseCliParam} from '@nu-art/commando/cli-params/types';
import {RunningStatusHandler} from './runtime/RunningStatusHandler.js';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';


export const DefaultPhases = [
	...phases_Build,
	...phases_Terminating,
	...phases_Launch,
	...phases_Deploy,
];

type BAI_Options = { pathToProject: string, runtimeParams: BaseCliParam<string, any>[] };

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

	prepareUnitsMapper(unitsMapper: UnitsMapper) {
		unitsMapper
			.addRules(UnitMapper_NodeLib)
			.addRules(UnitMapper_NodeProject)
			.addRules(UnitMapper_FirebaseHosting)
			.addRules(UnitMapper_FirebaseFunction)
			.setRuntimeParams(this.runtimeParams);
	}

	setApplicativeUnits(projectUnits: ProjectUnit[]) {
		this.workspace.addProjectUnits(projectUnits);
	}

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
