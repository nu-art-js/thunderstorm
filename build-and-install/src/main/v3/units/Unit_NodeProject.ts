import {UnitPhaseImplementor} from '../core/types';
import {AbsolutePath, StringMap} from '@nu-art/ts-common/utils/types';
import {_keys, BadImplementationException, MUSTNeverHappenException, Promise_all_sequentially, queuedDebounce, Second} from '@nu-art/ts-common';
import * as chokidar from 'chokidar';
import {FSWatcher} from 'chokidar';
import {Unit_TypescriptLib} from './Unit_TypescriptLib';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_PNPM} from '@nu-art/commando/shell/plugins/pnpm';
import {PNPM} from '@nu-art/commando/shell/services/pnpm';
import {Unit_PackageJson, Unit_PackageJson_Config} from './Unit_PackageJson';
import {resolve} from 'path';
import {FileSystemUtils} from '../core/FileSystemUtils';
import {ProjectUnit} from './ProjectUnit';
import {Unit_FirebaseHostingApp} from './firebase/Unit_FirebaseHostingApp';
import {Unit_FirebaseFunctionsApp} from './firebase/Unit_FirebaseFunctionsApp';
import {PhaseManager} from '../PhaseManager';
import {phase_Compile, Phase_Install, Phase_Watch} from '../phase';


type Unit_TypescriptProject_Config = Unit_PackageJson_Config & {
	globalPackages?: StringMap;
	isRoot: true
};

type PathDeclaration = { fullPath: string, paths: string[], unit: Unit_TypescriptLib };

export class Unit_NodeProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config>
	extends Unit_PackageJson<C>
	implements UnitPhaseImplementor<[Phase_Install, Phase_Watch]> {

	private watcher?: FSWatcher;
	readonly innerUnits: Unit_PackageJson[] = [];
	private watchDebounce!: () => void;

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
			.filter(unit => unit.config.fullPath.includes(this.config.fullPath)) as Unit_PackageJson[];

		this.innerUnits.push(...validUnits);
		Object.freeze(this.innerUnits);
	}

	private async installGlobals() {
		let packages: string[] = _keys(this.config.globalPackages ?? {} as StringMap);
		if ((!this.runtimeContext.runtimeParams.install && !this.runtimeContext.runtimeParams.installGlobals) || !packages.length)
			return;

		packages = packages
			.reduce((acc, pkg) => {
				acc.push(`${pkg as string}@${this.config.globalPackages![pkg as string]}`);
				return acc;
			}, [] as string[]);

		this.logInfo(`Installing Global Packages: ${packages.join(' ')}`);
		await this.allocateCommando(Commando_NVM)
			.append(`npm i -g ${packages.join(' ')}`)
			.execute();
	}

	async installPackages() {
		if (!this.runtimeContext.runtimeParams.install && !this.runtimeContext.runtimeParams.installPackages)
			return;

		this.setStatus('Installing packages', 'start');
		const units = this.innerUnits.filter(unit => unit.isInstanceOf(Unit_TypescriptLib)) as Unit_TypescriptLib[];
		const packages = units.map(unit => unit.config.relativePath);
		await PNPM.createWorkspace(packages, this.config.fullPath);
		const commando = this.allocateCommando(Commando_NVM, Commando_PNPM);
		commando.cd(this.config.fullPath);
		await PNPM.installPackages(commando);
		this.setStatus('Installed packages', 'end');
	}

	/**
	 * Resolve all paths to watch in all project libs
	 * @private
	 * @returns string[]
	 */
	private prepareWatchPaths(): PathDeclaration[] {
		// Using phase runner instance to resolve all project libs to watch
		const cantBeInstanceOf = [Unit_FirebaseHostingApp, Unit_FirebaseFunctionsApp];
		const projectLibs = this.innerUnits.filter(unit => unit.isInstanceOf(Unit_TypescriptLib) && cantBeInstanceOf.every(_instance => !unit.isInstanceOf(_instance))) as Unit_TypescriptLib[];

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
		await this.installGlobals();
		await this.installPackages();
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
				unit.logDebug(`intercepted change on path: ${path}`);

				// @ts-ignore - FIXME: should be a better way
				unit.setStatus('Dirty');

				//add unit to set
				units.add(unit);

				return unit;
			};

			// const keyToInnerUnitMap = arrayToMap(this.innerUnits, u => u.config.key);
			// const unitsMapper = new UnitsDependencyMapper(this.innerUnits.map(unit => {
			// 	const config: Readonly<Config_ProjectUnit> = unit.config;
			// 	return ({
			// 		key: config.key,
			// 		dependsOn: _keys(unit.config.dependencies).filter(key => !!keyToInnerUnitMap[key]) as string[]
			// 	});
			// }));

			// set the debounce event
			this.watchDebounce = queuedDebounce(async () => {
				const _pathsToDelete = [...pathsToDelete];
				const unitsToCompile = Array.from(units.values());

				// clear values in order to start collecting values for next debounce
				pathsToDelete.length = 0;
				units.clear();

				// fire all delete events
				await Promise_all_sequentially(_pathsToDelete.map(path => {
					return async () => path.unit.removeSpecificFileFromDist(path.path);
				}));

				// const changedKeys = unitsToCompile.map(u => u.config.key);
				// const libsToCompile = unitsMapper.getReverseDependencies(changedKeys);
				// this.logDebug(`Change in libs (${changedKeys.join(' ,')}) => libs to compile (${libsToCompile.join(' ,')})`);
				// const unitDependencyTree = unitsMapper.buildDependencyTree(libsToCompile)
				// 	.map(units => units.map(unitKey => keyToInnerUnitMap[unitKey]));
				// this.logDebug(`Change in libs (${changedKeys.join(' ,')}) => libs to compile (${libsToCompile.join(' ,')})`);

				const phaseManager = new PhaseManager(this.config.fullPath, [phase_Compile], [unitsToCompile], {
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

				this.logInfo('Completed successfully');
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

							//trigger debounce
							this.watchDebounce();
						})
						.on('change', (path) => {
							onUnitChange(path);

							//trigger debounce
							this.watchDebounce();
						})
						.on('unlinkDir', (path) => {
							const unit = onUnitChange(path);

							//update paths to delete
							pathsToDelete.push({path, unit});

							//trigger debounce
							this.watchDebounce();
						})
						.on('unlink', (path) => {
							const unit = onUnitChange(path);

							//update paths to delete
							pathsToDelete.push({path, unit});

							//trigger debounce
							this.watchDebounce();
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
}
