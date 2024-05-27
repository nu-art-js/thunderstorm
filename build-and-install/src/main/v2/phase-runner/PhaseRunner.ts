import {
	_keys,
	asArray,
	BadImplementationException,
	BeLogged,
	exists,
	ImplementationMissingException,
	LogClient_Terminal,
	LogLevel,
	reduceToMap,
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
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import fs from 'fs';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {ProjectConfigV2} from '../project/types';
import {allTSUnits} from '../unit/thunderstorm';
import {Default_Files, MemKey_DefaultFiles} from '../../defaults/consts';
import {NVM} from '@nu-art/commando/cli/nvm';
import {Cli_Basic} from '@nu-art/commando/cli/basic';

const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
const CONST_ThunderstormDependencyKey = 'THUNDERSTORM_DEPENDENCY_VERSION';
const CONST_ProjectVersionKey = 'APP_VERSION';
const CONST_ProjectDependencyKey = 'APP_VERSION_DEPENDENCY';

export class PhaseRunner<P extends Phase<string>[]>
	extends BaseUnit
	implements UnitPhaseImplementor<[Phase_Help, Phase_PrintEnv, Phase_Debug]> {

	private readonly phases: P;
	private units: BaseUnit[];
	private projectConfig!: ProjectConfigV2;

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

		//Listen on kill signal
		process.on('SIGINT', async () => {
			this.logInfo('Kill command received, killing units!');
			await this.killRunner();
			this.logInfo('Killed');
			process.exit(0);
		});

		const runnerParams: RunnerParams = {
			rootPath: process.cwd(),
			configPath: process.cwd() + '/.config',
		};
		this.logDebug('\nSetting RunnerParams:', runnerParams);
		MemKey_RunnerParams.set(runnerParams);

		const projectParams = this.prepareProjectParams();
		MemKey_ProjectConfig.set({
			...this.projectConfig,
			units: this.units,
			params: projectParams,
		});

		this.logDebug('\nSetting Default Files', Default_Files);
		MemKey_DefaultFiles.set(Default_Files);

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
		const filteredUnits = this.units.filter(unit => !exists(unit.config.filter) || unit.config.filter());
		return filteredUnits.filter(unit => {
			return exists((unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<P>]);
		});
	}

	private async initUnits() {
		return Promise.all(this.units.map(unit => {
			// @ts-ignore
			return unit.init();
		}));
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

		this.setStatus(`Executing Phase: ${phase.name}`);
		this.logDebug(`Executing phase: ${phase.name} for ${units.length} units`);
		for (const unit of units) {
			await (unit as Unit<any>)[phase.method as keyof UnitPhaseImplementor<P>]();
		}
		return true;
	}

	//######################### Public Functions #########################

	public async execute() {
		return new MemStorage().init(async () => {
			await this.initUnits();
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
		const configs = this.units.map(unit => unit.config);
		this.logInfo(JSON.stringify(configs, null, 2));
	}
}