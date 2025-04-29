import {_keys, _values, arrayToMap, BeLogged, DebugFlag, ImplementationMissingException, LogClient_Terminal, Logger, LogLevel} from '@nu-art/ts-common';
import {RuntimeParams} from './core/params/params';
import {Phase} from './phase';
import {phases_Build, phases_Deploy, phases_Launch, phases_Terminating} from './v3/phase';
import fs from 'fs';
import {UnitsMapper} from './v3/UnitsMapper/UnitsMapper';
import {UnitsDependencyMapper} from './v3/UnitsDependencyMapper/UnitsDependencyMapper';
import {FilesCache} from './v3/core/FilesCache';
import {BAI_Config} from './core/types';
import {Config_ProjectUnit, ProjectUnit} from './v3/units/ProjectUnit';
import {PhaseManager} from './v3/PhaseManager';


DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;


const DefaultPhases = [
	...phases_Terminating,
	...phases_Build,
	...phases_Launch,
	...phases_Deploy,
];

export class BuildAndInstallV3
	extends Logger {

	private phases: Phase<string>[] = DefaultPhases;
	private pathToProject: string;

	constructor(pathToProject: string = process.env.INIT_CWD ?? process.cwd()) {
		super();
		BeLogged.addClient(LogClient_Terminal);
		this.logDebug('Runtime params:', RuntimeParams);

		this.setMinLevel(LogLevel.Info);
		if (RuntimeParams.debug)
			this.setMinLevel(LogLevel.Debug);
		if (RuntimeParams.verbose)
			this.setMinLevel(LogLevel.Verbose);

		if (!fs.existsSync(pathToProject))
			throw new ImplementationMissingException(`Missing project config file, could not find in path: ${pathToProject}`);

		this.pathToProject = pathToProject;
	}

	setPhases(phases: Phase<string>[]) {
		this.phases = phases;
	}

	run() {
		(async () => {
			const baiConfig = await this.loadProjectConfig();
			const keyToUnitMap = await this.resolveUnits(baiConfig);
			const projectUnits: ProjectUnit[] = _values(keyToUnitMap).filter(unit => unit.isInstanceOf(ProjectUnit));

			const unitDependencyTree: ProjectUnit[][] = new UnitsDependencyMapper(projectUnits.map(unit => {
				const config: Readonly<Config_ProjectUnit> = unit.config;
				return ({
					key: config.key,
					dependsOn: _keys(config.dependencies)
				});
			}))
				.buildDependencyTree()
				.map(units => units.map(unitKey => keyToUnitMap[unitKey]));

			const phaseManager = new PhaseManager(this.pathToProject, this.phases, unitDependencyTree);
			const executionPlan = await phaseManager.calculateExecutionSteps();
			process.on('SIGINT', async () => {
				await phaseManager.break();
			});

			await phaseManager.execute(executionPlan);

			this.logInfo('Completed successfully');
			this.logInfo('---------------------------------- Process Completed successfully ----------------------------------');
			if (RuntimeParams.closeOnExit)
				process.exit(0);

		})()
			.then(() => {
				process.on('SIGINT', () => {
					console.log('completed');
					return process.exit(0);
				});
			})
			.catch(err => {
				process.on('SIGINT', () => {
					console.log('Failed with error: ', err);
					return process.exit(1);
				});
			});
	}

	private async loadProjectConfig() {
		const baiConfig = await FilesCache.load.json<BAI_Config>(`${this.pathToProject}/bai-config.json`);
		if (!baiConfig)
			throw new ImplementationMissingException('Missing project bai config file');

		baiConfig.pathToProject = this.pathToProject;
		return baiConfig;
	}

	private async resolveUnits(baiConfig: BAI_Config) {
		const unitsMapper = new UnitsMapper();
		const units = await unitsMapper.resolveUnits(this.pathToProject);
		units.forEach(unit => {
			unit.setProjectConfig(baiConfig);
			this.logDebug(`unit (${unit.constructor.name}): ${unit.config.key}`);
			this.logVerbose(unit.config);
		});
		return arrayToMap(units, unit => unit.config.key);
	}
}

