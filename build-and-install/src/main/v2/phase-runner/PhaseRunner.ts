import {
	__stringify, _keys, AbsolutePath, addItemToArrayAtIndex, arrayIncludesAny, asArray, BadImplementationException, deepClone, exists, flatArray,
	ImplementationMissingException, LogLevel, merge, MUSTNeverHappenException, Promise_all_sequentially, reduceToMap, RelativePath, removeItemFromArray,
	sortArray, StaticLogger, StringMap, TypedMap
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
import {dispatcher_UnitChange} from './PhaseRunnerDispatcher';
import {convertToFullPath} from '@nu-art/commando/shell/tools';
import {BaseCliParam} from '@nu-art/commando/cli-params/types';
import {PhaseRunnerMode, PhaseRunnerMode_Continue, PhaseRunnerMode_Normal} from './types';
import {BAIScreenManager, MemKey_BAIScreenManager} from '../screens/BAIScreenManager';
import {MemKey_PhaseRunner} from './consts';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';


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
	private readonly projectPath: AbsolutePath;
	private projectConfig!: ProjectConfigV2;

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
	public static instance: PhaseRunner;
	private readonly screenManager: BAIScreenManager;
	private defaultFileRoutes!: ProjectConfig_DefaultFileRoutes;

	constructor(projectPath: RelativePath) {
		super({label: 'Phase Runner', key: 'phase-runner'});
		if (exists(PhaseRunner.instance))
			throw new MUSTNeverHappenException('phase runner instance must be unique');
		Error.stackTraceLimit = 50;

		this.addToClassStack(PhaseRunner);
		this.screenManager = new BAIScreenManager();
		this.phases = [];
		this.units = [this];
		this.projectPath = convertToFullPath(projectPath);
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
		MemKey_PhaseRunner.set(this);
		MemKey_BAIScreenManager.set(this.screenManager);
		const runnerParams: RunnerParams = {
			rootPath: process.cwd(),
			configPath: process.cwd() + '/.config',
		};
		MemKey_RunnerParams.set(runnerParams);

		if (this.projectConfig) {
			const projectParams = this.prepareProjectParams();
			MemKey_ProjectConfig.set({
				                         ...this.projectConfig,
				                         params: projectParams,
			                         });
		}

		if (this.defaultFileRoutes)
			MemKey_DefaultFiles.set(this.defaultFileRoutes);

		if (PhaseRunner.instance) {
			return;
		}

		PhaseRunner.instance = this;

		//Load project for use in the phase runner
		this.projectConfig ??= await this.loadProject();

		//Filter specific units
		this.filterUnits();

		this.logDebug('Runtime params:', RuntimeParams);

		//Set runner params

		//Set Project Params
		const projectParams = this.prepareProjectParams();
		MemKey_ProjectConfig.set({
			                         ...this.projectConfig,
			                         params: projectParams,
		                         });

		//Set Default File Routes
		this.defaultFileRoutes = this.prepareDefaultFileRouts();
		MemKey_DefaultFiles.set(this.defaultFileRoutes);

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
		if (!fs.existsSync(this.projectPath))
			throw new ImplementationMissingException(`Missing project config file, could not find in path: ${this.projectPath}`);

		const projectConfigCB = require(this.projectPath).default as () => Promise<ProjectConfigV2>;
		if (typeof projectConfigCB !== 'function')
			throw new BadImplementationException('Config file must be an asynchronous function returning a ProjectConfigV2 object');

		return projectConfigCB();
	}

	private prepareProjectParams(): StringMap {
		const params = this.projectConfig.params ?? {};
		params[CONST_ThunderstormVersionKey] = this.projectConfig.thunderstormVersion;
		params[CONST_ThunderstormDependencyKey] = this.projectConfig.thunderstormVersion;
		params[CONST_ProjectVersionKey] = this.projectConfig.projectVersion;
		params[CONST_ProjectDependencyKey] = this.projectConfig.projectVersion;
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
	}

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
		const phasesBlocks: Phase<string>[][] = [];
		let phasesBlock: Phase<string>[] = [];
		let lastPhase;

		const reversedPhases = [...this.phases].reverse();
		for (const phase of this.phases) {
			if (lastPhase?.terminateAfterPhase)
				continue;

			try {
				let willExecutePhase = await this.phaseFilter(phase);
				for (const _phase of reversedPhases) {
					if (await this.phaseFilter(_phase) && _phase.dependencyPhaseKeys?.includes(phase.key)) {
						willExecutePhase = true;
					}
				}

				if (!willExecutePhase) {
					this.logDebug(`Will not execute phase: ${phase.name}, did not pass filter`);
					lastPhase = undefined;
					continue;
				}

				lastPhase = phase;
				this.logInfo(`Will execute phase: ${phase.name}`);
				if (phase.breakPhases) {
					phasesBlocks.push(phasesBlock);
					phasesBlocks.push([phase]);
					phasesBlock = [];
					continue;
				}

				phasesBlock.push(phase);

				// await this.executePhase(phase);
			} catch (e: any) {
				this.logError(`Error running phase: ${phase.name}`, e);
			}
		}

		if (phasesBlock.length)
			phasesBlocks.push(phasesBlock);

		if (RuntimeParams.debug)
			this.logDebug('phasesBlock: ', phasesBlock);
		const executionQueue = phasesBlocks.map((_phasesBlock, index) => {
			return async () => {
				return Promise_all_sequentially(this.unitDependencyTree.map(unitGroup => () => {
					return Promise.all(unitGroup.map(unit => Promise_all_sequentially(_phasesBlock.map(phase => () => this.executePhaseTest(phase, unit, index)))));
				}));
			};
		});

		await Promise_all_sequentially(executionQueue);
		this.killed = false;
	}

	async executePhaseTest<P extends Phase<string>>(phase: P, unit: BaseUnit, index: number) {
		if (!RuntimeParams.dryRun)
			return (unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<[P]>]?.();

		if (!(await this.willUnitRunForPhase(phase, unit)))
			unit.logWarning(`will NOT run phase #${index}: ${phase.name}`);
		else
			unit.logWarning(`running phase #${index}: ${phase.name}`);
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

	private willUnitRunForPhase = async <P extends Phase<string>>(phase: P, unit: BaseUnit) => {
		// Unit filter did not pass
		if (exists(unit.config.filter) && !unit.config.filter())
			return false;

		// Unit doesn't implement the phase method
		if (!exists((unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<[P]>]))
			return false;

		// If phase implements unit filter and unit doesn't pass
		if (exists(phase.unitFilter) && !(await phase.unitFilter(unit)))
			return false;

		return true;
	};

	// private async getUnitsForPhase<P extends Phase<string>>(phase: P) {
	// 	return filterInstances(await Promise.all(this.unitDependencyTree.map(async row => {
	// 		const filteredRow = await Promise.all(row.filter((unit) => this.willUnitRunForPhase(phase, unit)));
	// 		return filterInstances(filteredRow);
	// 	})).then(rows => rows.filter(row => row.length)));
	// }

	public getUnits() {
		return this.units;
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

			try {
				try {
					await this.init();
				} catch (e: any) {
					this.logError('Error initializing Runner', e);
					throw e;
				}

				try {
					await this.buildUnitDependencyTree();
				} catch (e: any) {
					this.logError('Error building execution Tree', e);
					throw e;
				}

				await this.executeImpl();
				this.killed = true;

				this.logInfo('Completed successfully');
				StaticLogger.logInfo('-----------', '---------------------------------- Process Completed successfully ----------------------------------');
				if (RuntimeParams.closeOnExit)
					process.exit(0);
			} catch (e) {
				if (RuntimeParams.closeOnExit)
					process.exit(1);
			}
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
		await this.allocateCommando(Commando_Basic)
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
		this.logDebug('Filtered Units:', this.units.map(unit => unit.config.label));

		const dependencyTree = this.unitDependencyTree.map(row => row.map(unit => unit.config.label));
		this.logInfo('Unit Dependencies Tree:', dependencyTree);
		this.logInfo('Phases:', this.phases.map(phase => phase.name));
		if (RuntimeParams.debugLifecycle)
			process.exit(0);
	}
}