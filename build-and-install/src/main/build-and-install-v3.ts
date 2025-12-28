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
	private scannedUnits: BaseUnit<any>[] = [];
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
		this.logDebug(`Resolving units from: ${this.pathToProject}`);
		this.scannedUnits = await this.unitsMapper.resolveUnits(this.pathToProject);
		Object.freeze(this.scannedUnits);

		const unitKeyToUnitMap = arrayToMap(this.scannedUnits, unit => unit.config.key);

		const allProjectUnits = this.scannedUnits.filter(unit => unit.isInstanceOf(ProjectUnit)) as ProjectUnit[];
		const nodeProjectUnit = allProjectUnits.find(unit => unit.isInstanceOf(Unit_NodeProject)) as Unit_NodeProject;
		this.projectUnits.push(...allProjectUnits);
		Object.freeze(this.projectUnits);

		this.logVerbose('Units Scanned:\n', this.scannedUnits.map(unit => {
			const projectUnit = this.projectUnits.includes(unit as ProjectUnit) ? '*' : ' ';
			const rootUnit = nodeProjectUnit === unit ? '*' : ' ';
			return `${projectUnit}${rootUnit} ${unit.constructor?.['name']}: ${unit.config.key}`;
		}).join('\n'));


		// @ts-ignore
		this['nodeProjectUnit'] = nodeProjectUnit;
		if (!this.nodeProjectUnit)
			throw new ImplementationMissingException('NodeProject unit not found. Make sure you have a Unit_NodeProject in your project.');

		const pathToBaiConfig = resolve(this.nodeProjectUnit.config.fullPath, CONST_BaiConfig);
		this.logDebug(`Loading BAI-Config from: ${pathToBaiConfig}`);
		const baiConfig = await FilesCache.load.json<BAI_Config>(pathToBaiConfig);
		this.logVerbose('Loaded BAI-Config', baiConfig);


		const unitsDependencies: UnitDependentNode[] = this.projectUnits.map(unit => ({
			key: unit.config.key,
			dependsOn: _keys(unit.config.dependencies).filter(key => !!unitKeyToUnitMap[key]) as string[]
		}));

		const globalOutputFolder = resolve(this.pathToProject, '.trash/output');
		this.unitsDependencyMapper = new UnitsDependencyMapper(unitsDependencies, globalOutputFolder);
		let version = await this.loadVersion();

		if (!(await FileSystemUtils.file.exists(resolve(this.nodeProjectUnit.config.fullPath, CONST_NodeModules)))) {
			this.logInfo(`root project is missing ${CONST_NodeModules} folder. Enabling install...`);
			this.runtimeParams.install = true;
		}

		const units = this.deriveUnits(this.scannedUnits);
		this.nodeProjectUnit.assignUnit(allProjectUnits.filter(unit => units.projectUnits.includes(unit.config.key)));

		this.logDebug(`Parent unit: ${this.nodeProjectUnit.config.key}`);
		this.logDebug(`Active units: ${units.activeUnits.join(', ')}`);
		this.logDebug(`Project units: ${units.projectUnits.join(', ')}`);


		const runtimeContext: ProjectUnit_RuntimeContext = ({
			version: version.version,
			parentUnit: this.nodeProjectUnit,
			childUnits: allProjectUnits.filter(unit => units.projectUnits.includes(unit.config.key)),
			baiConfig,
			runtimeParams: this.runtimeParams,
			unitsMapper: this.unitsDependencyMapper,
			unitsResolver: <UnitType>(keys: string[], className: Constructor<UnitType>): UnitType[] => {
				return keys.map(key => unitKeyToUnitMap[key]).filter(unit => unit.isInstanceOf(className)) as UnitType[];
			},
			globalOutputFolder,
		});

		this.projectUnits.forEach(unit => unit.setupRuntimeContext(runtimeContext));

		const unitDependencyTree: ProjectUnit[][] = (await this.unitsDependencyMapper.buildDependencyTree(units.projectUnits))
			.map(units => units.map(unitKey => unitKeyToUnitMap[unitKey])) as ProjectUnit[][];

		const manager = new PhaseManager(this.runningStatus, this.phases, unitDependencyTree, units.projectUnits);
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

	private deriveUnits(units: BaseUnit[]) {
		const unitKeySet = new Set<string>();
		const allUnits: BaseUnit[] = [];

		for (const unit of flatArray(units)) {
			if (unitKeySet.has(unit.config.key))
				throw new Error(`Multiple units with same key: ${unit.config.key}`);
			unitKeySet.add(unit.config.key);
			allUnits.push(unit);
		}

		let activeUnits: string[] = [];
		let projectUnits: string[] = [];

		// 1. Handle usePackage: adds to both active and project
		const usePackageKeys = this.runtimeParams.usePackage;
		if (usePackageKeys?.length) {
			const regexMatchers = usePackageKeys.map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			const matched = allUnits.filter(unit => regexMatchers.some(matcher => matcher.test(unit.config.key))).map(unit => unit.config.key);
			activeUnits.push(...matched);
			projectUnits.push(...matched);
		}

		// 2. Handle includePackage: adds as active and its transitive to project
		const packagesToInclude = this.runtimeParams.includePackage;
		if (packagesToInclude?.length) {
			const regexMatchers = asArray(packagesToInclude).map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			const matched = allUnits.filter(unit => regexMatchers.some(matcher => matcher.test(unit.config.key))).map(unit => unit.config.key);
			activeUnits.push(...matched);
			projectUnits.push(...matched, ...this.unitsDependencyMapper.getTransitiveDependencies(matched));
		}

		// 3. Handle includeApps: adds apps and transitive to both active and project
		let topLevelAppKeys = this.projectUnits.filter(unit => unit.config.isTopLevelApp).map(unit => unit.config.key);
		if (this.runtimeParams.includeApps?.length) {
			const regexMatchers = this.runtimeParams.includeApps.map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			const matchedApps = topLevelAppKeys.filter(unitKey => regexMatchers.some(matcher => matcher.test(unitKey)));
			const transitive = this.unitsDependencyMapper.getTransitiveDependencies(matchedApps);

			activeUnits.push(...matchedApps, ...transitive);
			projectUnits.push(...matchedApps, ...transitive);
		}

		// If no filters applied and not allUnits, default to all units
		if (!usePackageKeys?.length && !packagesToInclude?.length && !this.runtimeParams.includeApps?.length) {
			const allKeys = allUnits.map(unit => unit.config.key);
			activeUnits = allKeys;
			projectUnits = allKeys;
		}

		return {
			activeUnits: [...new Set(activeUnits)],
			projectUnits: [...new Set(projectUnits)]
		};
	}
}
