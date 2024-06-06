import {
	__stringify,
	_keys,
	AbsolutePath,
	addItemToArrayAtIndex,
	arrayIncludesAny,
	asArray,
	BadImplementationException,
	deepClone,
	exists,
	filterInstances,
	flatArray,
	ImplementationMissingException,
	LogLevel,
	merge,
	reduceToMap,
	RelativePath,
	removeItemFromArray,
	sortArray,
	StringMap,
	TypedMap
} from '@nu-art/ts-common';
import {MemKey_ProjectConfig, MemKey_RunnerParams, RunnerParams} from './RunnerParams';
import {Phase, Phase_Debug, Phase_Help, Phase_PrintEnv} from '../phase';
import {Unit, UnitPhaseImplementor} from '../unit/types';
import {BaseUnit, Unit_TypescriptProject} from '../unit/core';
import {AllBaiParams, RuntimeParams} from '../../core/params/params';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import fs, {promises as _fs} from 'fs';
import {ProjectConfigV2} from '../project/types';
import {allTSUnits} from '../unit/thunderstorm';
import {Default_Files, Default_OutputFiles, MemKey_DefaultFiles, ProjectConfig_DefaultFileRoutes, RunningStatus} from '../../defaults/consts';
import {NVM} from '@nu-art/commando/cli/nvm';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {dispatcher_PhaseChange, dispatcher_UnitChange} from './PhaseRunnerDispatcher';
import {
	convertToFullPath
} from '@nu-art/commando/shell/tools';
import {BaseCliParam} from '@nu-art/commando/cli-params/types';
import {PhaseRunnerMode, PhaseRunnerMode_Continue, PhaseRunnerMode_Normal} from './types';
import {BAIScreenManager} from '../screens/BAIScreenManager';
import {MemKey_PhaseRunner} from './consts';


const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
const CONST_ThunderstormDependencyKey = 'THUNDERSTORM_DEPENDENCY_VERSION';
const CONST_ProjectVersionKey = 'APP_VERSION';
const CONST_ProjectDependencyKey = 'APP_VERSION_DEPENDENCY';

export class PhaseRunner
	extends BaseUnit
	implements UnitPhaseImplementor<[Phase_Help, Phase_PrintEnv, Phase_Debug]> {

	//Base properties for regular run of the PhaseRunner
	private readonly phases: Phase<string>[];
	private readonly units: BaseUnit[];
	private unitDependencyTree!: BaseUnit[][];
	private readonly project: { path: AbsolutePath; config: ProjectConfigV2 };
	private killed?: boolean;

	//Properties for HOW the PhaseRunner should run
	private runningStatus!: RunningStatus;
	private phaseFilter: (phase: Phase<string>) => (boolean | Promise<boolean>);
	/**
	 * kill counter that will intercept the kill event and if the threshold will be met the main process will be killed as well
	 * @private
	 */
	private killCounter: number = 0;
	private static KILL_THRESHOLD = 5;

	constructor(projectPath: RelativePath) {
		super({label: 'Phase Runner', key: 'phase-runner'});
		this.addToClassStack(PhaseRunner);
		this.phases = [];
		this.units = [this];
		this.project = {path: convertToFullPath(projectPath), config: {} as ProjectConfigV2};
		this.phaseFilter = this.phaseFilters[PhaseRunnerMode_Normal];
		this.setMinLevel(LogLevel.Info);
		console.log('RuntimeParams.debug', RuntimeParams.debug);
		if (RuntimeParams.debug)
			this.setMinLevel(LogLevel.Debug);
		if (RuntimeParams.verbose)
			this.setMinLevel(LogLevel.Debug);
	}

	//######################### Initialization #########################

	protected async init() {
		// await super.init(false);
		//Set phase runner to MemKey, so it can be referenced in the runtime
		MemKey_PhaseRunner.set(this);

		//Init screen manager
		new BAIScreenManager();

		//Load project for use in the phase runner
		await this.loadProject();

		//Filter specific units
		this.filterUnits();

		this.logDebug('Runtime params:', RuntimeParams);

		//Set runner params
		const runnerParams: RunnerParams = {
			rootPath: process.cwd(),
			configPath: process.cwd() + '/.config',
		};
		MemKey_RunnerParams.set(runnerParams);

		//Set Project Params
		const projectParams = this.prepareProjectParams();
		MemKey_ProjectConfig.set({
			...this.project.config,
			params: projectParams,
		});

		//Set Default File Routes
		const defaultFileRoutes = this.prepareDefaultFileRouts();
		MemKey_DefaultFiles.set(defaultFileRoutes);

		//Load running status
		await this.loadRunningStatus();

		//Print init results
		this.setStatus('Initialized');

		const units = this.units.filter(unit => unit !== this);
		await Promise.all(units.map(unit => {
			// @ts-ignore
			return unit.init();
		}));
	}

	private filterUnits() {
		const useUnits = RuntimeParams.usePackage;
		if (!useUnits || !useUnits.length)
			return;

		const unitsToRemove: BaseUnit[] = [];
		for (const unit of this.units) {
			if (unit === this)
				continue;

			if (!useUnits.includes(unit.config.key))
				unitsToRemove.push(unit);
		}

		if (!unitsToRemove.length)
			return;

		unitsToRemove.forEach(unit => removeItemFromArray(this.units, unit));
		dispatcher_UnitChange.dispatch(this.units);
	}

	private async loadProject() {
		if (!fs.existsSync(this.project.path))
			throw new ImplementationMissingException(`Missing project config file, could not find in path: ${this.project.path}`);

		const projectConfigCB = require(this.project.path).default as () => Promise<ProjectConfigV2>;
		if (typeof projectConfigCB !== 'function')
			throw new BadImplementationException('Config file must be an asynchronous function returning a ProjectConfigV2 object');

		this.project.config = await projectConfigCB();
	}

	private prepareProjectParams(): StringMap {
		const params = this.project.config.params ?? {};
		params[CONST_ThunderstormVersionKey] = this.project.config.thunderstormVersion;
		params[CONST_ThunderstormDependencyKey] = this.project.config.thunderstormVersion;
		params[CONST_ProjectVersionKey] = this.project.config.projectVersion;
		params[CONST_ProjectDependencyKey] = this.project.config.projectVersion;
		return params;
	}

	private prepareDefaultFileRouts(): ProjectConfig_DefaultFileRoutes {
		const defaultFileRoutes = deepClone(Default_Files);
		const projectDefaultFileRoutes = MemKey_ProjectConfig.get().defaultFileRoutes;
		return merge(defaultFileRoutes, projectDefaultFileRoutes);
	}

	private async buildUnitDependencyTree() {
		const units = [...this.units];

		// Filter out units by their filter
		for (const unit of units) {
			if (exists(unit.config.filter) && !(await unit.config.filter())) {
				removeItemFromArray(units, unit);

				// @ts-ignore
				unit.setStatus('Will not run');
				unit.logInfo('unit will not run, did not pass unit filter');
			}
		}

		const allDependencies = units.map(unit => unit.runtime.dependencyName);
		const resolvedUnitNames: string[] = [];
		const dependencyTree: BaseUnit[][] = [];

		while (units.length) {
			if (!resolvedUnitNames.length) {
				//First run - get all units that don't have other units as dependencies
				const nonDependantUnits = units.filter(unit => {
					return !arrayIncludesAny(unit.runtime.unitDependencyNames, allDependencies);
				});
				//Remove gathered units from the list of units to resolve
				nonDependantUnits.forEach(unit => removeItemFromArray(units, unit));
				//Add resolved unit names to the array
				resolvedUnitNames.push(...nonDependantUnits.map(unit => unit.runtime.dependencyName));
				//Add resolved units as a layer in the dependency tree
				dependencyTree.push(nonDependantUnits);
				continue;
			}

			//Not first run - get all units where their dependencies are already resolved.
			const resolvingUnits = units.filter(unit => {
				const dependencyUnitPackageNames = unit.runtime.unitDependencyNames.filter(dependency => allDependencies.includes(dependency));
				return dependencyUnitPackageNames.every(dependency => resolvedUnitNames.includes(dependency));
			});

			//Remove gathered units from the list of units to resolve
			resolvingUnits.forEach(unit => removeItemFromArray(units, unit));
			//Add resolved unit names to the array
			resolvedUnitNames.push(...resolvingUnits.map(unit => unit.runtime.dependencyName));
			//Add resolved units as a layer in the dependency tree
			dependencyTree.push(resolvingUnits);
		}

		this.unitDependencyTree = dependencyTree;
		const toPrint = dependencyTree.map(row => row.map(unit => unit.config.label));
		this.logDebug('Unit Dependency Tree:', toPrint);
	}

	//######################### Internal Logic #########################

	private phaseFilters: { [K in PhaseRunnerMode]: (phase: Phase<string>) => (boolean | Promise<boolean>) } = {
		[PhaseRunnerMode_Normal]: async (phase) => {
			return !exists(phase.filter) || (await phase.filter());
		},
		[PhaseRunnerMode_Continue]: async (phase) => {
			const currentPhaseIndex = this.phases.findIndex(phase => phase.key === this.runningStatus.phaseKey);
			const phaseIndex = this.phases.indexOf(phase);

			//True if the phase index is larger equals the index of the first phase that will run in continue
			if (phaseIndex >= currentPhaseIndex)
				return true;

			//Check if phase should run as a dependency
			const allPhasesThatWillRun: Phase<string>[] = [];
			for (const phase of this.phases) {
				const index = this.phases.indexOf(phase);
				if (index >= currentPhaseIndex && await this.phaseFilters[PhaseRunnerMode_Normal](phase))
					allPhasesThatWillRun.push(phase);
			}
			const dependencyKeys = flatArray(allPhasesThatWillRun.map(phase => phase.dependencyPhaseKeys ?? []));
			return dependencyKeys.includes(phase.key);
		}
	};

	private async executeImpl() {
		for (const phase of this.phases) {
			const phaseDidRun = await this.executePhase(phase);

			//If phase is terminating
			if (phaseDidRun && phase.terminateAfterPhase)
				break;
		}
		this.killed = false;
	}

	//######################### Unit Logic #########################

	public registerUnits(units: BaseUnit | BaseUnit[]) {
		this.units.push(...asArray(units));
		sortArray(this.units, unit => {
			//Phase runner is first
			if (unit === this)
				return 0;

			//Second priority for project units
			if (unit instanceof Unit_TypescriptProject)
				return 1;

			//TS units after project units, but before the rest
			return allTSUnits.includes(unit) ? 2 : 3;
		});
		dispatcher_UnitChange.dispatch(this.units);
	}

	private async getUnitsForPhase<P extends Phase<string>>(phase: P) {
		return filterInstances(await Promise.all(this.unitDependencyTree.map(async row => {
			const filteredRow = await Promise.all(row.map(async unit => {
				// Unit filter did not pass
				if (exists(unit.config.filter) && !unit.config.filter())
					return null;

				// Unit doesn't implement the phase method
				if (!exists((unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<[P]>]))
					return null;

				// If phase implements unit filter and unit doesn't pass
				if (exists(phase.unitFilter) && !(await phase.unitFilter(unit)))
					return null;

				return unit;
			}));
			return filterInstances(filteredRow);
		})).then(rows => rows.filter(row => row.length)));
	}

	public getUnits() {
		return this.units;
	}

	//######################### Phase Logic #########################

	/**
	 * Determines whether to run the phase.</br>
	 * returns true if phase ran, false otherwise
	 * @param phase
	 * @private
	 */
	private async executePhase<P extends Phase<string>>(phase: P): Promise<boolean> {
		const willExecutePhase = await this.phaseFilter(phase);
		if (!willExecutePhase) {
			this.logDebug(`Will not execute phase: ${phase.name}, did not pass filter`);
			return false;
		}

		const units = await this.getUnitsForPhase(phase);
		if (!units.length) {
			this.logDebug(`Will not execute phase: ${phase.name}, no units to execute`);
			return false;
		}

		this.logDebug(`Executing phase: ${phase.name}`);
		dispatcher_PhaseChange.dispatch(phase);

		const phaseIndex = this.phases.indexOf(phase);
		let runningPhaseIndex = this.phases.findIndex(phase => phase.key === this.runningStatus.phaseKey);
		const inContinueMode = this.phaseFilter === this.phaseFilters[PhaseRunnerMode_Continue];

		//Run all units at the same time
		if (!phase.runUnitsInDependency) {
			//The current phase is (or is after) the running status phase
			if (phaseIndex >= runningPhaseIndex) {
				this.runningStatus = {phaseKey: phase.key, packageDependencyIndex: 0};
				await this.setRunningStatus();
				//Return to normal mode, if in continue
				if (inContinueMode)
					this.phaseFilter = this.phaseFilters[PhaseRunnerMode_Normal];
			}
			const unitsToRun = flatArray(units);
			await Promise.all(unitsToRun.map(unit => (unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<[P]>]()));
			if (this.killed)
				return true;

			return true;
		}

		//Run units according to dependency tree
		for (const row of units) {
			if (this.killed)
				break;

			const index = units.indexOf(row);
			const runningStatusRowIndex = this.runningStatus.packageDependencyIndex ?? 0;

			//Skip running status holds a larger index for the same phase
			if ((phaseIndex === runningPhaseIndex) && index < runningStatusRowIndex)
				continue;

			// this.logDebug(`Phase Index ${phaseIndex}, Row Index ${index}`);
			// this.logDebug(`RunningStatus Phase Index: ${runningPhaseIndex}, RunningStatus Row Index: ${runningStatusRowIndex}`);

			if (phaseIndex > runningPhaseIndex) {
				//Index of the current phase is larger, update the running status
				this.runningStatus = {phaseKey: phase.key, packageDependencyIndex: 0};
				runningPhaseIndex = phaseIndex;
				await this.setRunningStatus();
				//Return to normal mode, if in continue
				if (inContinueMode)
					this.phaseFilter = this.phaseFilters[PhaseRunnerMode_Normal];
			} else if (phaseIndex === runningPhaseIndex && index >= runningStatusRowIndex) {
				//Index of the row is larger for the same phase, update running status
				this.runningStatus = {phaseKey: phase.key, packageDependencyIndex: index};
				await this.setRunningStatus();
				//Return to normal mode, if in continue
				if (inContinueMode)
					this.phaseFilter = this.phaseFilters[PhaseRunnerMode_Normal];
			}
			await Promise.all(row.map(unit => (unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<[P]>]()));
		}

		return true;
	}

	/**
	 * Will add a phase to the start of the phase array.
	 * @param phase
	 */
	public prependPhase(phase: Phase<string>): void;
	/**
	 * Will add a phase before a specified phase.
	 * If the specified phase is not in the phase array, will add to the start of the array.
	 * @param phase
	 * @param beforePhase
	 */
	public prependPhase(phase: Phase<string>, beforePhase: Phase<string>): void;
	public prependPhase(phase: Phase<string>, beforePhase?: Phase<string>) {
		if (!beforePhase) {
			this.phases.unshift(phase);
			return;
		}

		const index = this.phases.indexOf(beforePhase);
		//If the beforePhase isn't in this.phases or is the first item
		if (index === -1 || index === 0)
			return this.prependPhase(phase);

		addItemToArrayAtIndex(this.phases, phase, index - 1);
	}

	/**
	 * Will add a phase to the end of the phase array.
	 * @param phase
	 */
	public appendPhase(phase: Phase<string>): void;
	/**
	 * Will add a phase after a specified phase.
	 * If the specified phase is not in the phase array, will add to the end of the array.
	 * @param phase
	 * @param afterPhase
	 */
	public appendPhase(phase: Phase<string>, afterPhase: Phase<string>): void;
	public appendPhase(phase: Phase<string>, afterPhase?: Phase<string>) {
		if (!afterPhase) {
			this.phases.push(phase);
			return;
		}

		const index = this.phases.indexOf(afterPhase);
		//If the afterPhase isn't in this.phases or is the last item
		if (index === -1 || index === this.phases.length - 1)
			return this.appendPhase(phase);

		addItemToArrayAtIndex(this.phases, phase, index + 1);
	}

	public getPhases = () => [...this.phases];

	//######################### Running Status #########################

	private async setRunningStatus() {
		this.logVerbose('Setting Running Status', this.runningStatus);
		if (!fs.existsSync(Default_OutputFiles.output))
			await _fs.mkdir(Default_OutputFiles.output, {recursive: true});
		await _fs.writeFile(Default_OutputFiles.runningStatus, __stringify(this.runningStatus, true));
	}

	private async loadRunningStatus() {

		const setDefaultRunningStatus = () => {
			this.runningStatus = {
				phaseKey: this.phases[0].key,
				packageDependencyIndex: 0,
			};
			this.phaseFilter = this.phaseFilters[PhaseRunnerMode_Normal];
		};

		if (!RuntimeParams.continue) {
			setDefaultRunningStatus();
			return;
		}

		//If the dir exists, try to read the file
		if (fs.existsSync(Default_OutputFiles.output)) {
			try {
				this.runningStatus = JSON.parse(await _fs.readFile(Default_OutputFiles.runningStatus, {encoding: 'utf-8'}));
				this.phaseFilter = this.phaseFilters[PhaseRunnerMode_Continue];
			} catch (e) {
				this.logError('Failed reading running status');
				setDefaultRunningStatus();
				return;
			}
		} else
			setDefaultRunningStatus();
	}

	//######################### Public Functions #########################

	public async execute() {
		return new MemStorage().init(async () => {
			process.on('SIGINT', () => {
				this.killRunner();
			});

			await this.init();
			await this.buildUnitDependencyTree();
			await this.executeImpl();
		});
	}

	public async killRunner() {
		this.killCounter++;
		if (this.killCounter === PhaseRunner.KILL_THRESHOLD)
			process.exit(1);

		if (this.killed)
			process.exit(1);

		await this.setRunningStatus();
		this.logDebug('Killing units');
		await Promise.all(this.units.map(async unit => {
			try {
				await unit.kill();
			} catch (e: any) {
				unit.logError(`Error killing unit`, e);
			}
		}));
		this.logDebug('Units killed');
		this.killed = true;

		if (RuntimeParams.closeOnExit)
			process.exit(1);
	}

	//######################### Phase Implementation #########################

	async printHelp() {
		this.logInfo('Build and install parameters:');
		const noGroupConst = 'No Group';

		//Resolve all params by group
		const paramsByGroup: TypedMap<BaseCliParam<string, any>[]> = reduceToMap(AllBaiParams, param => param.group ?? noGroupConst, (item, index, mapper) => {
			mapper[item.group ?? noGroupConst] = [...mapper[item.group ?? noGroupConst] ?? [], item];
			return mapper[item.group ?? noGroupConst];
		});

		_keys(paramsByGroup).map(paramGroup => {
			this.logWarningBold(`${paramGroup}: \n`);
			// commando.append(`echo "${paramGroup}:" \n`);

			paramsByGroup[paramGroup].map(param => {
				const paramKeys = param.keys.join(' | ');
				const paramDescription = param.description.trim().split('\n').join('\n\t\t');
				this.logInfo(`${paramKeys} \n\t\t ${paramDescription} \n`);
				// commando.append(`echo "\n	${param.keys.join(' | ')} \n \t\t${param.description.trim().split('\n').join('\n\t\t')} \n"`);
			});
		});
	}

	async printEnv() {
		await NVM.createCommando(Cli_Basic)
			.append('npm -g list typescript eslint firebase-tools sort-package-json --depth=0')
			.append('echo "npm version:"; npm -v')
			.append('echo "node version:"; node -v')
			.append('echo "base version:"; bash --version')
			.execute();
	}

	async printDebug() {
		this.logDebug('Runner Params:', MemKey_RunnerParams.get());
		this.logDebug('Project Config:', MemKey_ProjectConfig.get());
		this.logDebug('Default File Routes:', MemKey_DefaultFiles.get());

		const dependencyTree = this.unitDependencyTree.map(row => row.map(unit => unit.config.label));
		this.logInfo('Unit Dependencies Tree:', dependencyTree);
	}
}