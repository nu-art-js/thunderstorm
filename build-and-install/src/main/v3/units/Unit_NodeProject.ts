import {UnitPhaseImplementor} from '../core/types.js';
import {AbsolutePath, StringMap} from '@nu-art/ts-common/utils/types';
import {
	_keys,
	arrayToMap,
	BadImplementationException,
	flatArray,
	lastElement,
	MUSTNeverHappenException,
	Promise_all_sequentially,
	queuedDebounce,
	Second
} from '@nu-art/ts-common';
import * as chokidar from 'chokidar';
import {FSWatcher} from 'chokidar';
import {Unit_TypescriptLib} from './Unit_TypescriptLib.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_PNPM} from '@nu-art/commando/shell/plugins/pnpm';
import {PNPM} from '@nu-art/commando/shell/services/pnpm';
import {Unit_PackageJson, Unit_PackageJson_Config} from './Unit_PackageJson.js';
import {resolve} from 'path';
import {FileSystemUtils} from '../core/FileSystemUtils.js';
import {Config_ProjectUnit, ProjectUnit} from './ProjectUnit.js';
import {PhaseManager} from '../PhaseManager.js';
import {phase_CompileWatch, Phase_Install, Phase_PostPublish, Phase_Watch} from '../phase/index.js';
import {UnitsDependencyMapper} from '../UnitsDependencyMapper/UnitsDependencyMapper.js';
import {BaseUnit} from './BaseUnit.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';


type Unit_TypescriptProject_Config = Unit_PackageJson_Config & {
	globalPackages?: StringMap;
	isRoot: true
};

type PathDeclaration = { fullPath: string, paths: string[], unit: Unit_TypescriptLib };

export class Unit_NodeProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config>
	extends Unit_PackageJson<C>
	implements UnitPhaseImplementor<[Phase_Install, Phase_Watch, Phase_PostPublish]> {

	private watcher?: FSWatcher;
	readonly innerUnits: Unit_PackageJson[] = [];

	private readonly suffixesToWatch: string[] = [
		'ts',
		'tsx',
		'scss',
		'json',
		'svg'
	];


	constructor(config: Unit_NodeProject<C>['config']) {
		super(config);
		this.addToClassStack(Unit_NodeProject);
	}

	protected deriveDistDependencies() {
		return this.innerUnits.reduce((dependencies, unit) => {
			dependencies[unit.config.key] = this.runtimeContext.baiConfig.thunderstormVersion;
			return dependencies;
		}, super.deriveDistDependencies());
	}

	assignUnit(units: ProjectUnit[]) {
		const validUnits = units
			.filter(unit => unit.isInstanceOf(Unit_PackageJson))
			.filter(unit => unit !== this && unit.config.fullPath.includes(this.config.fullPath)) as Unit_PackageJson[];

		this.innerUnits.push(...validUnits);
		Object.freeze(this.innerUnits);
	}

	/**
	 * Resolve all paths to watch in all project libs
	 * @private
	 * @returns string[]
	 */
	private prepareWatchPaths(): PathDeclaration[] {
		// Using phase runner instance to resolve all project libs to watch
		const projectLibs = this.innerUnits.filter(unit => unit.isInstanceOf(Unit_TypescriptLib) && !(unit as Unit_TypescriptLib).config.hasSelfHotReload) as Unit_TypescriptLib[];

		//return all paths to watch
		return projectLibs.map(lib => {
			const sourceFolder = `${lib.config.fullPath}/src/main`;
			return {
				paths: this.suffixesToWatch.map(suffix => `${sourceFolder}/**/*.${suffix}`),
				unit: lib,
				fullPath: lib.config.fullPath
			};
		});
	}

	async stopWatch() {
		return this.watcher?.close();
	}

	private findUnit = (pathDeclarations: PathDeclaration[], currentPath: AbsolutePath): Unit_TypescriptLib => {
		const unitToReturn = pathDeclarations.find(declaration => currentPath.startsWith(`${declaration.fullPath}/`))?.unit;
		if (!unitToReturn)
			throw new MUSTNeverHappenException(`current path doesnt match any declared unit, current path: ${currentPath}`);

		return unitToReturn;
	};

	//######################### Phase Implementation #########################

	async install() {
		if (!this.runtimeContext.runtimeParams.install)
			return;

		const units = this.innerUnits.filter(unit => unit.isInstanceOf(Unit_TypescriptLib)) as Unit_TypescriptLib[];
		const packages = units.map(unit => unit.config.relativePath);
		await PNPM.createWorkspace(packages, this.config.fullPath);
		const commando = this.allocateCommando(Commando_NVM, Commando_PNPM)
			.cd(this.config.fullPath)
			.append(`pnpm store prune`);

		await this.executeAsyncCommando(commando, `pnpm install -f --no-frozen-lockfile --prefer-offline false`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new CommandoException(`Error installing packages`, stdout, stderr, exitCode);
		});
	}

	async watch(timeout = 2 * Second, maxTimeout = 10 * Second) {
		if (this.watcher)
			throw new BadImplementationException('Watcher already initialized, MUST call stopWatch() before calling watch()');

		const pathDeclarations = this.prepareWatchPaths();
		pathDeclarations.forEach(declaration => {
			this.logVerbose('listening unit:', declaration.unit.config.key);
			declaration.unit.logVerbose('listening paths:', declaration.paths.join('\n'));
		});
		const paths = pathDeclarations.flatMap(path => path.paths);
		this.watcher = chokidar.watch(paths);
		// set all events to watch and handle them
		return new Promise<void>((resolve, error) => {
			this.logInfo('Starting the watcher...');

			const units: Set<Unit_TypescriptLib> = new Set();
			const pathsToDelete: { path: string, unit: Unit_TypescriptLib }[] = [];

			const onUnitChange = (path: string) => {
				const unit = this.findUnit(pathDeclarations, path as AbsolutePath);
				const filesToIgnore = unit.ignoreWatchFiles();
				if (path.match(new RegExp(filesToIgnore.join('|'))))
					return;

				// @ts-ignore - FIXME: should be a better way
				unit.setStatus('Dirty');

				//add unit to set
				units.add(unit);

				return unit;
			};

			const keyToInnerUnitMap = arrayToMap(this.innerUnits, u => u.config.key);
			const unitsMapper = new UnitsDependencyMapper(this.innerUnits.map(unit => {
				const config: Readonly<Config_ProjectUnit> = unit.config;
				return ({
					key: config.key,
					dependsOn: _keys(unit.config.dependencies).filter(key => !!keyToInnerUnitMap[key]) as string[]
				});
			}), this.runtimeContext.globalOutputFolder);

			let watchCompileRunning = false;
			// set the debounce event
			const watchDebounce = () => {
				if (watchCompileRunning)
					return;

				return watchDebounceImpl();
			};
			const watchDebounceImpl = queuedDebounce(async () => {
				watchCompileRunning = true;

				const _pathsToDelete = [...pathsToDelete];
				const unitsToCompile = Array.from(units.values());
				let unitDependencyTree: BaseUnit[][] = [unitsToCompile];
				// clear values in order to start collecting values for next debounce
				pathsToDelete.length = 0;
				units.clear();

				// fire all delete events
				await Promise_all_sequentially(_pathsToDelete.map(path => {
					return async () => path.unit.removeSpecificFileFromDist(path.path);
				}));

				const changedKeys = unitsToCompile.map(u => u.config.key);
				const libsToCompile = unitsMapper.getReverseDependencies(changedKeys);
				const fullDependencyTree: BaseUnit[][] = (await unitsMapper.buildDependencyTree(libsToCompile))
					.map(units => units.map(unitKey => keyToInnerUnitMap[unitKey]));
				if (this.runtimeContext.runtimeParams.watchBuildTree) {
					unitDependencyTree = fullDependencyTree;
				} else {
					const units = flatArray(unitDependencyTree);
					const topApps = lastElement(fullDependencyTree);
					if (topApps?.length) {
						const items = topApps.filter(unit => {
							return unit.isInstanceOf(Unit_TypescriptLib)
								&& !unit.isInstanceType(Unit_TypescriptLib)
								&& !(unit as Unit_TypescriptLib).config.hasSelfHotReload
								&& !units.find(u => u.config.key === unit.config.key);
						});
						if (items.length)
							unitDependencyTree.push(items);
					}
				}

				const phaseManager = new PhaseManager(this.config.fullPath, [[phase_CompileWatch]], unitDependencyTree, {
					...this.runtimeContext.runtimeParams,
					noBuild: false
				});
				// @ts-ignore
				phaseManager.setTag('PhaseManager-Watcher');
				const executionPlan = await phaseManager.calculateExecutionSteps();
				const stopWatchCompileAction = async () => {
					await phaseManager.break();
				};

				process.on('SIGINT', stopWatchCompileAction);
				try {
					this.unregisterTerminatable(stopWatchAction);
					await phaseManager.execute(executionPlan);
				} catch (e: any) {
					this.logError('Error while compiling', e);
				} finally {
					this.registerTerminatable(stopWatchAction);
				}
				process.off('SIGINT', stopWatchCompileAction);

				this.logInfo('Watch Compile Completed successfully');
				watchCompileRunning = false;
				if (units.size > 0)
					watchDebounce();
			}, timeout, maxTimeout);

			this.watcher!
				.on('error', (error) => {
					this.logError('Error while watching', error);
				})
				.on('ready', () => {
					this.logInfo('Watching...');
					for (const unit of this.innerUnits)
						// @ts-ignore
						unit.setStatus('Watching...');

					this.watcher!
						.on('add', (path) => {
							onUnitChange(path);

							if (!watchCompileRunning)
								//trigger debounce
								watchDebounce();
						})
						.on('change', (path) => {
							onUnitChange(path);

							//trigger debounce
							watchDebounce();
						})
						.on('unlinkDir', (path) => {
							const unit = onUnitChange(path);
							if (!unit)
								return;

							//update paths to delete
							pathsToDelete.push({path, unit});

							//trigger debounce
							watchDebounce();
						})
						.on('unlink', (path) => {
							const unit = onUnitChange(path);
							if (!unit)
								return;

							//update paths to delete
							pathsToDelete.push({path, unit});

							//trigger debounce
							watchDebounce();
						});
				});

			const stopWatchAction = async () => {
				await this.watcher?.close();
				resolve();
			};

			this.registerTerminatable(stopWatchAction);
		});
	}

	async purge() {
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, 'pnpm-lock.yaml'));
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, 'pnpm-workspace.yaml'));
		return super.purge();
	}

	async postPublish() {

	}
}
