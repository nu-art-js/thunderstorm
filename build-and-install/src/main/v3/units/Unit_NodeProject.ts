import {UnitPhaseImplementor} from '../../types/types';
import {Phase_Install, Phase_Watch} from '../../phase';
import {RuntimeParams} from '../../core/params/params';
import {AbsolutePath, StringMap} from '@nu-art/ts-common/utils/types';
import {_keys, clearArrayInstance, MUSTNeverHappenException, Promise_all_sequentially, queuedDebounce, Second} from '@nu-art/ts-common';
import {MemKey_PhaseRunner} from '../../v2/phase-runner/consts';
import * as chokidar from 'chokidar';
import {dispatcher_UnitWatchCompile, dispatcher_WatchReady} from '../../v2/unit/runner-dispatchers';
import {Unit_TypescriptLib} from './Unit_TypescriptLib';
import {Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp} from '../../v2/unit/firebase-units';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_PNPM} from '@nu-art/commando/shell/plugins/pnpm';
import {PNPM} from '@nu-art/commando/shell/services/pnpm';
import {Unit_PackageJson, Unit_PackageJson_Config} from './Unit_PackageJson';
import {resolve} from 'path';
import {FileSystemUtils} from '../core/FileSystemUtils';
import {ProjectUnit} from './ProjectUnit';


type Unit_TypescriptProject_Config = Unit_PackageJson_Config & {
	globalPackages?: StringMap;
	isRoot: true
};

type PathDeclaration = { fullPath: string, paths: string[], unit: Unit_TypescriptLib };

export class Unit_NodeProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config>
	extends Unit_PackageJson<C>
	implements UnitPhaseImplementor<[Phase_Install, Phase_Watch]> {

	private innerUnits: Unit_PackageJson[] = [];
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

	assignUnit(units: ProjectUnit[]) {
		const validUnits = units
			.filter(unit => unit.isInstanceOf(Unit_PackageJson))
			.filter(unit => unit.config.fullPath.includes(this.config.fullPath)) as Unit_PackageJson[];

		this.innerUnits.push(...validUnits);
	}

	private async installGlobals() {
		let packages: string[] = _keys(this.config.globalPackages ?? {} as StringMap);
		if ((!RuntimeParams.install && !RuntimeParams.installGlobals) || !packages.length)
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

	private async installPackages() {
		if (!RuntimeParams.install && !RuntimeParams.installPackages)
			return;

		this.setStatus('Installing packages', 'start');
		const units = this.innerUnits.filter(unit => unit.isInstanceOf(Unit_TypescriptLib)) as Unit_TypescriptLib[];
		const packages = units.map(unit => unit.config.fullPath);
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
		const projectLibs = MemKey_PhaseRunner.get()
			.getUnits()
			.filter(unit => unit.isInstanceOf(Unit_TypescriptLib) && cantBeInstanceOf.every(_instance => !unit.isInstanceOf(_instance))) as Unit_TypescriptLib[];

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

	/**
	 * Init watch events and attach default watch callback with correct params to each of them
	 * @private
	 */
	private initWatch() {
		const pathDeclarations = this.prepareWatchPaths();
		const paths = pathDeclarations.flatMap(path => path.paths);
		const watcher = chokidar.watch(paths);

		// set all events to watch and handle them
		return new Promise<void>((resolve, error) => {
			this.logInfo('Starting the watcher...');

			const units: Set<Unit_TypescriptLib> = new Set();
			const pathsToDelete: { path: string, unit: Unit_TypescriptLib }[] = [];

			const onUnitChange = (path: string) => {
				const unit = this.findUnit(pathDeclarations, path as AbsolutePath);

				// @ts-ignore - FIXME: should be a better way
				unit.setStatus('Dirty');

				//add unit to set
				units.add(unit);

				return unit;
			};

			// set the debounce event
			this.watchDebounce = queuedDebounce(async () => {
				const _pathsToDelete = [...pathsToDelete];
				const unitsToCompile = Array.from(units.values());

				// clear values in order to start collecting values for next debounce
				clearArrayInstance(pathsToDelete);
				units.clear();

				// fire all delete events
				await Promise_all_sequentially(_pathsToDelete.map(path => {
					return async () => path.unit.removeSpecificFileFromDist(path.path);
				}));

				// fire all compile events
				await Promise_all_sequentially(unitsToCompile.map(unit => {
					return async () => unit.watchCompile();
				}));

				//dispatch post debounce event to parent
				await dispatcher_UnitWatchCompile.dispatchAsync(unitsToCompile);
			}, 2 * Second, 10 * Second);

			watcher
				.on('error', (error) => {
					this.logError('Error while watching', error);
				})
				.on('ready', () => {
					this.logInfo('Watching...');
					dispatcher_WatchReady.dispatch();

					watcher
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

			const terminatable = async () => {
				await watcher.close();
				this.unregisterTerminatable(terminatable);
			};

			this.registerTerminatable(terminatable);
		});
	}

	private findUnit = (pathDeclarations: PathDeclaration[], currentPath: AbsolutePath): Unit_TypescriptLib => {
		const unitToReturn = pathDeclarations.find(declaration => currentPath.startsWith(`${declaration.fullPath}/`))?.unit;
		if (!unitToReturn)
			throw new MUSTNeverHappenException(`current path doesnt match any declared unit, current path: ${currentPath}`);

		return unitToReturn;
	};

	private async watchImpl() {
		await this.initWatch();
	}

	//######################### Phase Implementation #########################

	async install() {
		await this.installGlobals();
		await this.installPackages();
	}

	async watch() {
		await this.watchImpl();
	}

	async purge() {
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, 'pnpm-lock.yaml'));
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, 'pnpm-workspace.yaml'));
		return super.purge();
	}
}