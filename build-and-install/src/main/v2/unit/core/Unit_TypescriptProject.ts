import {UnitPhaseImplementor} from '../types';
import {Unit_Typescript, Unit_Typescript_Config, Unit_Typescript_RuntimeConfig} from './Unit_Typescript';
import {Phase_Install, Phase_Watch} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {AbsolutePath, StringMap} from '@nu-art/ts-common/utils/types';
import {
	_keys,
	clearArrayInstance,
	MUSTNeverHappenException,
	Promise_all_sequentially,
	queuedDebounce,
	Second
} from '@nu-art/ts-common';
import {MemKey_PhaseRunner} from '../../phase-runner/consts';
import * as chokidar from 'chokidar';
import {dispatcher_UnitWatchCompile, dispatcher_WatchReady} from '../runner-dispatchers';
import {Unit_TypescriptLib} from './Unit_TypescriptLib';
import {Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp} from '../firebase-units';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_PNPM} from '@nu-art/commando/shell/plugins/pnpm';
import {PNPM} from '@nu-art/commando/shell/services/pnpm';


type Unit_TypescriptProject_Config = Unit_Typescript_Config & { globalPackages?: StringMap; };

type Unit_TypescriptProject_RuntimeConfig = Unit_Typescript_RuntimeConfig & {};

type PathDeclaration = { pathToPackage: AbsolutePath, paths: string[], unit: Unit_TypescriptLib };

export class Unit_TypescriptProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config, RTC extends Unit_TypescriptProject_RuntimeConfig = Unit_TypescriptProject_RuntimeConfig>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install, Phase_Watch]> {
	private watchDebounce!: () => void;

	private readonly suffixesToWatch: string[] = [
		'ts',
		'tsx',
		'scss',
		'json',
		'svg'
	];

	constructor(config: Unit_TypescriptProject<C>['config']) {
		super(config);
		this.addToClassStack(Unit_TypescriptProject);
	}

	//######################### Internal Logic #########################

	private async installGlobals() {
		if ((!RuntimeParams.install && !RuntimeParams.installGlobals) || !this.config.globalPackages)
			return;

		const packages = _keys(this.config.globalPackages)
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
		const runner = MemKey_PhaseRunner.get();
		const units = runner.getUnits().filter(unit => unit instanceof Unit_Typescript) as Unit_Typescript[];
		const packages = units.map(unit => unit.config.pathToPackage);
		await PNPM.createWorkspace(packages);
		await PNPM.installPackages(this.allocateCommando(Commando_NVM, Commando_PNPM));
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
			const sourceFolder = `${lib.runtime.pathTo.pkg}/src/main`;
			return {
				paths: this.suffixesToWatch.map(suffix => `${sourceFolder}/**/*.${suffix}`),
				unit: lib,
				pathToPackage: lib.runtime.pathTo.pkg
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
		const unitToReturn = pathDeclarations.find(declaration => currentPath.startsWith(`${declaration.pathToPackage}/`))?.unit;
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

}