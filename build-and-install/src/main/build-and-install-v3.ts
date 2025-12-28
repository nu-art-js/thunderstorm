import {
	_keys,
	arrayToMap,
	asArray,
	BeLogged,
	Constructor,
	DebugFlag,
	filterDuplicates,
	flatArray,
	ImplementationMissingException,
	LogClient_Terminal,
	Logger,
	LogLevel,
	merge
} from '@nu-art/ts-common';
import {AllBaiParams, BaiParams} from './core/params/params.js';
import {Phase, phases_Build, phases_Deploy, phases_Launch, phases_Terminating} from './v3/phase/index.js';
import {UnitsMapper} from './v3/UnitsMapper/UnitsMapper.js';
import {UnitDependentNode, UnitsDependencyMapper} from './v3/UnitsDependencyMapper/UnitsDependencyMapper.js';
import {FilesCache} from './v3/core/FilesCache.js';
import {BAI_Config} from './core/types/index.js';
import {ProjectUnit, ProjectUnit_RuntimeContext} from './v3/units/ProjectUnit.js';
import {PhaseManager} from './v3/PhaseManager.js';
import {BaseUnit, Unit_NodeProject} from './v3/units/index.js';
import {resolve} from 'path';
import {CONST_BaiConfig, CONST_NodeModules, CONST_VersionApp} from './core/consts.js';
import {UnitMapper_FirebaseFunction, UnitMapper_FirebaseHosting, UnitMapper_NodeLib, UnitMapper_NodeProject} from './v3/UnitsMapper/resolvers/index.js';
import {CLIParamsResolver} from '@nu-art/commando/cli-params/CLIParamsResolver';
import {BaseCliParam} from '@nu-art/commando/cli-params/types';
import {RunningStatusHandler} from './v3/RunningStatusHandler.js';
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
	private allUnits: BaseUnit<any>[] = [];
	readonly nodeProjectUnit!: Unit_NodeProject;
	readonly runtimeParams: BaiParams;
	readonly projectUnits: ProjectUnit[] = [];
	private unitsDependencyMapper!: UnitsDependencyMapper;
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
		this.projectUnits.push(...projectUnits);
	}

	setPhases(phases: Phase<string>[][]) {
		this.phases = phases;
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
		this.logVerbose(`Resolving units from: ${this.pathToProject}`);
		this.allUnits = await this.unitsMapper.resolveUnits(this.pathToProject);
		Object.freeze(this.allUnits);

		this.logDebug('Units found:', this.allUnits.map(unit => `${unit.constructor?.['name']}: ${unit.config.key}`).join('\n'));
		const unitKeyToUnitMap = arrayToMap(this.allUnits, unit => unit.config.key);

		const allProjectUnits = this.allUnits.filter(unit => unit.isInstanceOf(ProjectUnit)) as ProjectUnit[];
		const nodeProjectUnit = allProjectUnits.find(unit => unit.isInstanceOf(Unit_NodeProject)) as Unit_NodeProject;

		// @ts-ignore
		this['nodeProjectUnit'] = nodeProjectUnit;

		if (!this.nodeProjectUnit)
			throw new ImplementationMissingException('NodeProject unit not found. Make sure you have a Unit_NodeProject in your project.');

		const pathToBaiConfig = resolve(this.nodeProjectUnit.config.fullPath, CONST_BaiConfig);
		this.logVerbose(`Loading BAI-Config from: ${pathToBaiConfig}`);
		const baiConfig = await FilesCache.load.json<BAI_Config>(pathToBaiConfig);
		this.logDebug('Loaded BAI-Config', baiConfig);


		this.projectUnits.push(...allProjectUnits);
		Object.freeze(this.projectUnits);

		const unitsDependencies: UnitDependentNode[] = this.projectUnits.map(unit => ({
			key: unit.config.key,
			dependsOn: _keys(unit.config.dependencies).filter(key => !!unitKeyToUnitMap[key]) as string[]
		}));

		const globalOutputFolder = resolve(this.pathToProject, '.trash/output');
		this.unitsDependencyMapper = new UnitsDependencyMapper(unitsDependencies, globalOutputFolder);

		const versionFilePath = resolve(this.pathToProject, CONST_VersionApp);
		this.logInfo('loading version from: ', versionFilePath);
		const version = await FileSystemUtils.file.read.json<{ version: string }>(versionFilePath, {version: '1.0.0'});


		if (!(await FileSystemUtils.file.exists(resolve(this.nodeProjectUnit.config.fullPath, CONST_NodeModules)))) {
			this.logInfo(`root project is missing ${CONST_NodeModules} folder. Enabling install...`);
			this.runtimeParams.install = true;
		}

		const keyToUnitMap = arrayToMap(this.projectUnits, u => u.config.key);
		let topLevelAppKeys = this.projectUnits.filter(unit => unit.config.isTopLevelApp).map(unit => unit.config.key);
		this.logWarning('this.runtimeParams.includeApps', this.runtimeParams.includeApps);
		if (this.runtimeParams.includeApps?.length) {
			const regexMatchers = this.runtimeParams.includeApps.map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			topLevelAppKeys = topLevelAppKeys.filter(unitKey => regexMatchers.some(matcher => matcher.test(unitKey)));
		}

		this.logDebug('topLevelAppKeys: ', topLevelAppKeys);
		const participatingUnitKeys = this.runtimeParams.allUnits
			? undefined
			: [...this.unitsDependencyMapper.getTransitiveDependencies(topLevelAppKeys), ...topLevelAppKeys];

		const unitDependencyTree: ProjectUnit[][] = (await this.unitsDependencyMapper.buildDependencyTree(participatingUnitKeys))
			.map(units => units.map(unitKey => keyToUnitMap[unitKey])) as ProjectUnit[][];

		const activeUnits = this.deriveActiveUnits(unitDependencyTree);

		const runtimeContext: ProjectUnit_RuntimeContext = ({
			version: version.version,
			parentUnit: this.nodeProjectUnit,
			childUnits: allProjectUnits.filter(unit => activeUnits.includes(unit.config.key)),
			baiConfig,
			runtimeParams: this.runtimeParams,
			unitsMapper: this.unitsDependencyMapper,
			unitsResolver: <UnitType>(keys: string[], className: Constructor<UnitType>): UnitType[] => {
				return keys.map(key => unitKeyToUnitMap[key]).filter(unit => unit.isInstanceOf(className)) as UnitType[];
			},
			globalOutputFolder,
		});

		this.projectUnits.forEach(unit => unit.setupRuntimeContext(runtimeContext));
		this.nodeProjectUnit.assignUnit(runtimeContext.childUnits);

		this.logDebug(`Parent unit: ${this.nodeProjectUnit.config.key}`);
		this.logDebug(`Child units: ${allProjectUnits.map(unit => unit.config.key).join(', ')}`);

		// @ts-ignore
		this["phaseManager"] = new PhaseManager(this.runningStatus, this.phases, unitDependencyTree, activeUnits);
	}

	private deriveActiveUnits(units: BaseUnit[][]) {
		const unitKeySet = new Set<string>();
		let activeUnits: string[] = [];
		const allUnits: BaseUnit[] = [];
		for (const unit of flatArray(units)) {
			if (unitKeySet.has(unit.config.key))
				throw new Error(`Multiple units with same key: ${unit.config.key}`);
			unitKeySet.add(unit.config.key);
			allUnits.push(unit);
		}

		const usePackageKeys = this.runningStatus.runtimeParams.usePackage;
		if (!usePackageKeys?.length)
			activeUnits = allUnits.map(unit => unit.config.key);
		else {
			const regexMatchers = usePackageKeys.map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			activeUnits = allUnits.filter(unit => regexMatchers.some(matcher => matcher.test(unit.config.key))).map(unit => unit.config.key);
		}

		const packagesToInclude = this.runningStatus.runtimeParams.includePackage;
		if (packagesToInclude?.length) {
			const regexMatchers = asArray(packagesToInclude).map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			activeUnits.push(...allUnits.filter(unit => regexMatchers.some(matcher => matcher.test(unit.config.key))).map(unit => unit.config.key));
			activeUnits = [...new Set(activeUnits)];
		}

		return activeUnits;
	}
}
