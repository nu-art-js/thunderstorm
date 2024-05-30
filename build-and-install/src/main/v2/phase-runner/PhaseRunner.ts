import {
	_keys,
	addItemToArrayAtIndex,
	arrayIncludesAny,
	asArray,
	AsyncVoidFunction,
	BadImplementationException,
	BeLogged,
	deepClone,
	exists,
	filterInstances,
	flatArray,
	ImplementationMissingException,
	LogClient_Terminal,
	LogLevel,
	merge,
	reduceToMap,
	removeItemFromArray,
	sortArray,
	StringMap,
	TypedMap
} from '@nu-art/ts-common';
import {MemKey_ProjectConfig, MemKey_RunnerParams, RunnerParams} from './RunnerParams';
import {Phase, Phase_Debug, Phase_Help, Phase_PrintEnv} from '../phase';
import {Unit, UnitPhaseImplementor} from '../unit/types';
import {BaseUnit, Unit_TypescriptProject} from '../unit/core';
import {BaseCliParam} from '@nu-art/commando/cli/cli-params';
import {AllBaiParams, RuntimeParams} from '../../core/params/params';
import {MemKey, MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import fs from 'fs';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {ProjectConfigV2} from '../project/types';
import {allTSUnits} from '../unit/thunderstorm';
import {Default_Files, MemKey_DefaultFiles, ProjectConfig_DefaultFileRoutes} from '../../defaults/consts';
import {NVM} from '@nu-art/commando/cli/nvm';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {dispatcher_PhaseChange} from './PhaseRunnerDispatcher';

const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
const CONST_ThunderstormDependencyKey = 'THUNDERSTORM_DEPENDENCY_VERSION';
const CONST_ProjectVersionKey = 'APP_VERSION';
const CONST_ProjectDependencyKey = 'APP_VERSION_DEPENDENCY';

export const MemKey_PhaseRunner = new MemKey<PhaseRunner<any>>('phase-runner');

export class PhaseRunner<P extends Phase<string>[]>
	extends BaseUnit
	implements UnitPhaseImplementor<[Phase_Help, Phase_PrintEnv, Phase_Debug]> {

	private readonly phases: P;
	private units: BaseUnit[];
	private projectConfig!: ProjectConfigV2;
	// @ts-ignore
	private unitDependencyTree!: BaseUnit[][];

	constructor(phases: P) {
		super({label: 'Phase Runner', key: 'phase-runner'});
		this.phases = phases;
		this.units = [this, ...allTSUnits];
		this.showAllLogs();
		this.setMinLevel(LogLevel.Verbose);
		this.logDebug('Runtime params:', RuntimeParams);
	}

	protected async init() {
		if (!this.config)
			throw new BadImplementationException('Trying to run PhaseRunner with no project config, did you forget to call .registerProject() ?');

		MemKey_PhaseRunner.set(this);

		//Listen on kill signal
		process.on('SIGINT', async () => {
			this.logInfo('Kill command received, killing units!');
			await this.killRunner();
			this.logInfo('Killed');
			process.exit(0);
		});

		//Set runner params
		const runnerParams: RunnerParams = {
			rootPath: process.cwd(),
			configPath: process.cwd() + '/.config',
		};
		this.logDebug('\nSetting RunnerParams:', runnerParams);
		MemKey_RunnerParams.set(runnerParams);

		//Set Project Params
		const projectParams = this.prepareProjectParams();
		MemKey_ProjectConfig.set({
			...this.projectConfig,
			units: this.units,
			params: projectParams,
		});

		//Set Default File Routes
		const defaultFileRoutes = this.prepareDefaultFileRouts();
		this.logDebug('\nSetting Default File Routes:', defaultFileRoutes);
		MemKey_DefaultFiles.set(defaultFileRoutes);

		this.logInfoBold('\nInit Done! Unit order:', this.units.map(unit => unit.config.label));
	}

	//######################### Internal Logic #########################

	private showAllLogs() {
		// this.clearLogger();

		// this.projectScreen?.dispose();
		BeLogged.addClient(LogClient_Terminal);
	}

	private async executeImpl() {
		for (const phase of this.phases) {
			const phaseDidRun = await this.executePhase(phase);

			//If phase is terminating
			if (phaseDidRun && phase.terminateAfterPhase)
				break;
		}
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

	private buildUnitDependencyTree() {
		const units = [...this.units];
		const allDependencies = units.map(unit => unit.runtime.dependencyName);
		this.logDebug(allDependencies);
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

		this.logDebug('Setting Dependency Tree', dependencyTree.map(row => row.map(unit => unit.config.label)));
		this.unitDependencyTree = dependencyTree;
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
	}

	private getUnitsForPhase(phase: P[number]) {
		return filterInstances(this.unitDependencyTree.map(row => {
			const filteredRow = row.filter(unit => {
				if (exists(unit.config.filter) && !unit.config.filter())
					return false;

				return exists((unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<P>]);
			});
			return filteredRow.length ? filteredRow : undefined;
		}));
	}

	private async initUnits() {
		return Promise.all(this.units.map(unit => {
			// @ts-ignore
			return unit.init();
		}));
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
	private async executePhase(phase: P[number]): Promise<boolean> {
		const willExecutePhase = !exists(phase.filter) || phase.filter();
		if (!willExecutePhase) {
			this.logDebug(`Will not execute phase: ${phase.name}, did not pass filter`);
			return false;
		}

		const units = this.getUnitsForPhase(phase);
		if (!units.length) {
			this.logDebug(`Will not execute phase: ${phase.name}, no units to execute`);
			return false;
		}

		this.logDebug(`Executing phase: ${phase.name}`);
		dispatcher_PhaseChange.dispatch(phase);

		//Run all units at the same time
		if (!phase.runUnitsInDependency) {
			const unitsToRun = flatArray(units);
			await Promise.all(unitsToRun.map(unit => (unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<P>]()));
			return true;
		}

		//Run units according to dependency tree
		for (const row of units) {
			await Promise.all(row.map(unit => (unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<P>]()));
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

	//######################### Public Functions #########################

	public async execute(cb?: AsyncVoidFunction) {
		return new MemStorage().init(async () => {
			await this.initUnits();
			await cb?.();
			this.buildUnitDependencyTree();
			await this.executeImpl();
		});
	}

	public registerProject(pathToConfig: string) {
		const fullPathToConfig = convertToFullPath(pathToConfig);

		if (!fs.existsSync(fullPathToConfig))
			throw new ImplementationMissingException(`Missing project config file, could not find in path: ${fullPathToConfig}`);

		this.projectConfig = require(fullPathToConfig).default as ProjectConfigV2;
		this.registerUnits(this.projectConfig.units);
		return this;
	}

	public async killRunner() {
		await Promise.all(this.units.map(unit => unit.kill()));
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

	async debug() {
		// const configs = this.units.map(unit => unit.config);
		// this.logInfo(JSON.stringify(configs, null, 2));
		const dependencyTree = this.unitDependencyTree.map(row => row.map(unit => unit.config.label));
		this.logInfo(dependencyTree);
	}
}