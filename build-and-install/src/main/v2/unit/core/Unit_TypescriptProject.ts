import {UnitPhaseImplementor} from '../types';
import {Unit_Typescript, Unit_Typescript_Config, Unit_Typescript_RuntimeConfig} from './Unit_Typescript';
import {Phase_GenerateDocs, Phase_Install, Phase_Watch} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {AbsolutePath, StringMap, TypedMap} from '@nu-art/ts-common/utils/types';
import {
	__stringify,
	_keys, BadImplementationException,
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
import {glob} from 'glob';
import {extractApiPaths, OpenAPIPaths} from '../tools/generate-docs';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {MemKey_DefaultFiles} from '../../../defaults/consts';


type Unit_TypescriptProject_Config = Unit_Typescript_Config & { globalPackages?: StringMap; };

type Unit_TypescriptProject_RuntimeConfig = Unit_Typescript_RuntimeConfig & {};

type PathDeclaration = { pathToPackage: AbsolutePath, paths: string[], unit: Unit_TypescriptLib };

type APIDefinitions = {
	openapi: string
	components: TypedMap<any>
	info: { title: string, version: string }
	paths: OpenAPIPaths,
	tags: { name: string, description?: string }[],
	'x-tagGroups': { name: string, tags: string[] }[]
};

export class Unit_TypescriptProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config, RTC extends Unit_TypescriptProject_RuntimeConfig = Unit_TypescriptProject_RuntimeConfig>
	extends Unit_Typescript<C, RTC>
	implements UnitPhaseImplementor<[Phase_Install, Phase_Watch, Phase_GenerateDocs]> {
	private watchDebounce!: VoidFunction;

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

	private async resolveDocsTemplate() {
		const destinationPath = `${this.runtime.pathTo.pkg}/.api_docs`;
		const defaultFiles = MemKey_DefaultFiles.get();

		if (!defaultFiles.apiDocs) throw new BadImplementationException('cannot resolve templates for api docs if not defined');

		// if exists fail fast
		if (fs.existsSync(destinationPath))
			return;

		await _fs.mkdir(destinationPath, {recursive: true});
		await this.allocateCommando()
			.append(`cp -r ${defaultFiles.apiDocs.all} ${destinationPath}`)
			.execute();
	}

	private async generateApiDocs(): Promise<APIDefinitions> {
		const projectLibs = MemKey_PhaseRunner.get()
			.getUnits()
			.filter(unit => unit.isInstanceOf(Unit_TypescriptLib)) as Unit_TypescriptLib[];

		return projectLibs.reduce((apiMapper, lib) => {
				const packageName = lib.config.label;
				const allApiDefs = glob.sync([
					`${lib.runtime.pathTo.pkg}/src/main/_entity/**/api-def.ts`,
					`${lib.runtime.pathTo.pkg}/src/main/shared/**/api-def.ts`,
					`${lib.runtime.pathTo.pkg}/src/main/shared/**/apis.ts`,
					`${lib.runtime.pathTo.pkg}/src/main/_entity/**/apis.ts`,
				]);

				apiMapper.paths = {
					...apiMapper.paths,
					...Object.assign({}, ...allApiDefs.map((defFile) => {
							const moduleDefParts = defFile.split('/');
							const apiModule = moduleDefParts[moduleDefParts.length - 3].trim();
							const tagName = `${packageName}.${apiModule}`;

							// update tags api
							if (!apiMapper.tags) apiMapper.tags = [];
							if (!apiMapper.tags.find(tag => tag.name === tagName)) apiMapper.tags.push({name: tagName}); // push only if not exists

							//update tag groups
							if (!apiMapper['x-tagGroups']) apiMapper['x-tagGroups'] = [];

							const groupIndex = apiMapper['x-tagGroups'].findIndex(group => group.name === packageName);

							if (groupIndex !== -1) {
								if (!apiMapper['x-tagGroups'][groupIndex].tags.includes(tagName))
									apiMapper['x-tagGroups'][groupIndex].tags.push(tagName);
							} else
								apiMapper['x-tagGroups'].push({name: packageName, tags: [tagName]});

							const apis = extractApiPaths(defFile);
							this.logInfo(apis.components);

							// update api tag
							_keys(apis.paths).forEach(api => {
								const method = _keys(apis.paths[api])[0];
								apis.paths[api][method].tags = [tagName];
							});

							//update components
							if (!apiMapper.components) apiMapper.components = {schemas: {}};

							apiMapper.components.schemas = {
								...apiMapper.components.schemas,
								...apis.components.schemas
							};

							return apis.paths;
						})
					)
				};

				return apiMapper;
			},
			{
				info: {title: 'API Documentation', version: '1.0.0'},// Adjust to real data when possible
				openapi: '3.0.0'
			} as Partial<APIDefinitions>
		) as APIDefinitions;
	}

	//######################### Phase Implementation #########################

	async install() {
		await this.installGlobals();
		await this.installPackages();
	}

	async watch() {
		await this.watchImpl();
	}

	async generateDocs() {
		//handle docs templates
		await this.resolveDocsTemplate();

		//get docsMapper
		const docsMapper = await this.generateApiDocs();

		//write new json
		const destinationPath = `${this.runtime.pathTo.pkg}/.api_docs`;
		await _fs.writeFile(`${destinationPath}/openapi.json`, __stringify(docsMapper, true));
	}
}