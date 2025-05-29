import {_keys, arrayToMap, BeLogged, Constructor, DebugFlag, LogClient_Terminal, Logger, LogLevel} from '@nu-art/ts-common';
import {AllBaiParams, BaiParams} from './core/params/params';
import {Phase, phases_Build, phases_Deploy, phases_Launch} from './v3/phase';
import {UnitsMapper} from './v3/UnitsMapper/UnitsMapper';
import {UnitDependentNode, UnitsDependencyMapper} from './v3/UnitsDependencyMapper/UnitsDependencyMapper';
import {FilesCache} from './v3/core/FilesCache';
import {BAI_Config} from './core/types';
import {ProjectUnit, ProjectUnit_RuntimeContext} from './v3/units/ProjectUnit';
import {PhaseManager} from './v3/PhaseManager';
import {BaseUnit, Unit_NodeProject} from './v3/units';
import {resolve} from 'path';
import {CONST_BaiConfig, CONST_NodeModules} from './core/consts';
import {FileSystemUtils} from './v3/core/FileSystemUtils';
import {CLIParamsResolver} from '@nu-art/commando/cli-params/CLIParamsResolver';
import {UnitMapper_FirebaseFunction, UnitMapper_FirebaseHosting, UnitMapper_NodeLib, UnitMapper_NodeProject} from './v3/UnitsMapper/resolvers';


const DefaultPhases = [
	...phases_Build,
	...phases_Launch,
	...phases_Deploy,
];

export class BuildAndInstall
	extends Logger {

	private phases: Phase<string>[] = DefaultPhases;
	private pathToProject: string;
	private allUnits: BaseUnit<any>[] = [];
	readonly nodeProjectUnit!: Unit_NodeProject;
	readonly runtimeParams: BaiParams = CLIParamsResolver.create(...AllBaiParams).resolveParamValue();
	readonly projectUnits: ProjectUnit[] = [];
	private unitsDependencyMapper!: UnitsDependencyMapper;

	constructor(pathToProject: string = process.env.INIT_CWD ?? process.cwd()) {
		super();
		BeLogged.addClient(LogClient_Terminal);


		if (this.runtimeParams.debug)
			DebugFlag.DefaultLogLevel = LogLevel.Debug;

		if (this.runtimeParams.verbose)
			DebugFlag.DefaultLogLevel = LogLevel.Verbose;

		this.setMinLevel(DebugFlag.DefaultLogLevel);
		this.logDebug('Runtime params:', this.runtimeParams);
		this.pathToProject = pathToProject;
	}

	setPhases(phases: Phase<string>[]) {
		this.phases = phases;
	}

	async build() {
		this.projectUnits.push(...(await this.resolveUnits()));
		Object.freeze(this.projectUnits);
	}

	async run() {
		const keyToUnitMap = arrayToMap(this.projectUnits, u => u.config.key);
		const unitDependencyTree: ProjectUnit[][] = this.unitsDependencyMapper.buildDependencyTree()
			.map(units => units.map(unitKey => keyToUnitMap[unitKey])) as ProjectUnit[][];

		this.logDebug('Unit Dependency Graph:', unitDependencyTree.map(units => units.map(unit => unit.config.key)));

		const phaseManager = new PhaseManager(this.pathToProject, this.phases, unitDependencyTree, this.runtimeParams);
		const executionPlan = await phaseManager.calculateExecutionSteps();
		process.on('SIGINT', async () => {
			this.logWarning('\n\n\n---------------------------------- Process Interrupted ----------------------------------\n\n\n');
			await phaseManager.break();
		});

		await phaseManager.execute(executionPlan);

		this.logInfo('Completed successfully');
		this.logInfo('---------------------------------- Process Completed successfully ----------------------------------');
	}

	private async resolveUnits() {
		this.logVerbose(`Resolving units from: ${this.pathToProject}`);
		const unitsMapper = new UnitsMapper();
		this.allUnits = await unitsMapper
			.addRules(UnitMapper_NodeLib)
			.addRules(UnitMapper_NodeProject)
			.addRules(UnitMapper_FirebaseHosting)
			.addRules(UnitMapper_FirebaseFunction)
			.setRuntimeParams(this.runtimeParams)
			.resolveUnits(this.pathToProject);

		Object.freeze(this.allUnits);

		this.logDebug('Units found:', this.allUnits.map(unit => `${unit.constructor?.['name']}: ${unit.config.key}`).join('\n'));
		const unitKeyToUnitMap = arrayToMap(this.allUnits, unit => unit.config.key);

		const allProjectUnits = this.allUnits.filter(unit => unit.isInstanceOf(ProjectUnit)) as ProjectUnit[];
		const nodeProjectUnit = allProjectUnits.find(unit => unit.isInstanceOf(Unit_NodeProject)) as Unit_NodeProject;

		// @ts-ignore
		this['nodeProjectUnit'] = nodeProjectUnit;

		this.nodeProjectUnit.assignUnit(allProjectUnits);
		this.logDebug(`Parent unit: ${this.nodeProjectUnit.config.key}`);
		this.logDebug(`Child units: ${allProjectUnits.map(unit => unit.config.key).join(', ')}`);

		const pathToBaiConfig = resolve(this.nodeProjectUnit.config.fullPath, CONST_BaiConfig);
		this.logVerbose(`Loading BAI-Config from: ${pathToBaiConfig}`);
		const baiConfig = await FilesCache.load.json<BAI_Config>(pathToBaiConfig);
		this.logDebug('Loaded BAI-Config', baiConfig);

		const unitsDependencies: UnitDependentNode[] = allProjectUnits.map(unit => ({
			key: unit.config.key,
			dependsOn: _keys(unit.config.dependencies).filter(key => !!unitKeyToUnitMap[key]) as string[]
		}));

		this.unitsDependencyMapper = new UnitsDependencyMapper(unitsDependencies);
		const runtimeContext: ProjectUnit_RuntimeContext = ({
			parentUnit: this.nodeProjectUnit,
			childUnits: allProjectUnits,
			baiConfig,
			runtimeParams: this.runtimeParams,
			unitsMapper: this.unitsDependencyMapper,
			unitsResolver: <UnitType>(keys: string[], className: Constructor<UnitType>): UnitType[] => {
				return keys.map(key => unitKeyToUnitMap[key]).filter(unit => unit.isInstanceOf(className)) as UnitType[];
			},
		});

		allProjectUnits.forEach(unit => unit.setupRuntimeContext(runtimeContext));

		if (!(await FileSystemUtils.file.exists(resolve(this.nodeProjectUnit.config.fullPath, CONST_NodeModules)))) {
			this.logInfo(`root project is missing ${CONST_NodeModules} folder. Enabling install...`);
			this.runtimeParams.install = true;
			this.runtimeParams.installGlobals = true;
			this.runtimeParams.installPackages = true;
		}

		return allProjectUnits;
	}
}
