import {UnitPhaseImplementor} from '../types';
import {Unit_Typescript, Unit_Typescript_Config, Unit_Typescript_RuntimeConfig} from './Unit_Typescript';
import {Phase_Install, Phase_Watch} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {StringMap} from '@nu-art/ts-common/utils/types';
import {_keys} from '@nu-art/ts-common';
import {NVM} from '@nu-art/commando/cli/nvm';
import {PNPM} from '@nu-art/commando/cli/pnpm';
import {MemKey_PhaseRunner} from '../../phase-runner/consts';
import * as chokidar from 'chokidar';
import {dispatcher_WatchEvent} from '../runner-dispatchers';
import {
	WatchEvent_Add,
	WatchEvent_Ready,
	WatchEvent_RemoveDir,
	WatchEvent_RemoveFile,
	WatchEvent_Update
} from '../consts';
import {Unit_TypescriptLib} from './Unit_TypescriptLib';
import {Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp} from '../firebase-units';

type Unit_TypescriptProject_Config = Unit_Typescript_Config & { globalPackages?: StringMap; };

type Unit_TypescriptProject_RuntimeConfig = Unit_Typescript_RuntimeConfig & {};

type PathDeclaration = { paths: string[], unit: Unit_TypescriptLib };

export class Unit_TypescriptProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config, RTC extends Unit_TypescriptProject_RuntimeConfig = Unit_TypescriptProject_RuntimeConfig>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install, Phase_Watch]> {

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
		await NVM.createCommando().append(`npm i -g ${packages.join(' ')}`).execute();
	}

	private async installPackages() {
		if (!RuntimeParams.install && !RuntimeParams.installPackages)
			return;

		const runner = MemKey_PhaseRunner.get();
		const units = runner.getUnits().filter(unit => unit instanceof Unit_Typescript) as Unit_Typescript[];
		const packages = units.map(unit => unit.config.pathToPackage);
		await PNPM.createWorkspace(packages);
		await PNPM.installPackages(NVM.createCommando());
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
			.getUnits().filter(unit => unit.isInstanceOf(Unit_TypescriptLib) && cantBeInstanceOf.every(_instance => !unit.isInstanceOf(_instance))) as Unit_TypescriptLib[];

		//return all paths to watch
		return projectLibs.map(lib => {
			const sourceFolder = `${lib.config.pathToPackage}/src/main`;
			return {paths: this.suffixesToWatch.map(suffix => `${sourceFolder}/**/*.${suffix}`), unit: lib};
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

			watcher
				.on('error', (error) => {
					this.logError('Error while watching', error);
				})
				.on('ready', () => {
					this.logInfo('Watching...');
					dispatcher_WatchEvent.dispatch(WatchEvent_Ready);

					watcher
						.on('add', (path) => {
							dispatcher_WatchEvent.dispatch(WatchEvent_Add, path);
						})
						.on('change', (path) => {
							dispatcher_WatchEvent.dispatch(WatchEvent_Update, path);
						})
						.on('unlinkDir', (path) => {
							dispatcher_WatchEvent.dispatch(WatchEvent_RemoveDir, path);
						})
						.on('unlink', (path) => {
							dispatcher_WatchEvent.dispatch(WatchEvent_RemoveFile, path);
						});
				});

			process.on('SIGINT', async (status) => {
				await watcher.close();
				process.exit(0);
				resolve();
			});
		});
	}

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