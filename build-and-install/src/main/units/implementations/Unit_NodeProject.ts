import {UnitPhaseImplementor} from '../../core/types.js';
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
import {Commando_NVM} from '@nu-art/commando';
import {Commando_PNPM} from '@nu-art/commando';
import {PNPM} from '@nu-art/commando';
import {Unit_PackageJson, Unit_PackageJson_Config} from './Unit_PackageJson.js';
import {resolve} from 'path';
import {Config_ProjectUnit, ProjectUnit} from '../base/ProjectUnit.js';
import {PhaseManager} from '../../phases/PhaseManager.js';
import {phase_CompileWatch, Phase_Install, Phase_IndicesMcpServer, Phase_PostPublish, Phase_Watch, phase_Prepare} from '../../phases/definitions/index.js';
import {UnitsDependencyMapper} from '../../dependencies/UnitsDependencyMapper.js';
import {BaseUnit} from '../base/BaseUnit.js';
import {CommandoException} from '@nu-art/commando';
import {CONST_PNPM_LOCK, CONST_PNPM_WORKSPACE} from '../../config/consts.js';
import {RunningStatusHandler} from '../../runtime/RunningStatusHandler.js';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {IndicesMcpServer} from '../../exports/IndicesMcpServer.js';


/**
 * Configuration for NodeProject (root project unit).
 */
type Unit_TypescriptProject_Config = Unit_PackageJson_Config & {
	globalPackages?: StringMap;
	isRoot: true
};

/**
 * Path declaration for watch mode (which paths to watch for which unit).
 */
type PathDeclaration = { fullPath: string, paths: string[], unit: Unit_TypescriptLib };

/**
 * Root project unit representing the entire monorepo/workspace.
 * 
 * **Key Responsibilities**:
 * - Manages child units (all packages in workspace)
 * - Handles workspace-level operations (install, watch)
 * - Creates PNPM workspace configuration
 * - Manages file watching for hot reload
 * 
 * **Phases Implemented**:
 * - `install()`: Installs all packages using PNPM workspace
 * - `watch()`: Watches file changes and triggers incremental compilation
 * - `postPublish()`: Post-publish operations
 * 
 * **Watch Mode**:
 * - Watches TypeScript, SCSS, JSON, SVG files in all child units
 * - Uses chokidar for file watching
 * - Debounces changes and compiles affected units in dependency order
 * - Supports hot reload for units with `hasSelfHotReload` flag
 * 
 * **Workspace Management**:
 * - Creates `pnpm-workspace.yaml` with all child unit paths
 * - Manages global packages installation
 * - Handles dependency tree for watch compilation
 */
export class Unit_NodeProject<C extends Unit_TypescriptProject_Config = Unit_TypescriptProject_Config>
	extends Unit_PackageJson<C>
	implements UnitPhaseImplementor<[Phase_Install, Phase_Watch, Phase_PostPublish, Phase_IndicesMcpServer]> {

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
		if (packages.length > 0)
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

				const watchRuntimeParams = {
					...this.runtimeContext.runtimeParams,
					noBuild: false,
					continue: false
				};
				const activeUnitKeys = this.runtimeContext.childUnits.map(unit => unit.config.key);
				const phaseManager = new PhaseManager(new RunningStatusHandler(this.config.fullPath, watchRuntimeParams).isolate(), [[phase_Prepare],[phase_CompileWatch]], unitDependencyTree, activeUnitKeys, activeUnitKeys);
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
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, CONST_PNPM_LOCK));
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, CONST_PNPM_WORKSPACE));
		return super.purge();
	}

	async postPublish() {

	}

	async indicesMcpServer() {
		this.setStatus('Starting Export Indices MCP Server', 'start');

		const projectRoot = this.config.fullPath;
		const port = this.runtimeContext.runtimeParams.indicesMcpPort || 3001;

		// Get active TypeScriptLib packages
		const packages = this.innerUnits.filter(unit => unit.isInstanceOf(Unit_TypescriptLib)) as Unit_TypescriptLib[];

		if (packages.length === 0) {
			this.logWarning('No TypeScriptLib packages found. MCP server will have no packages to expose.');
		}

		const server = new IndicesMcpServer(port, projectRoot, packages);

		// Handle graceful shutdown
		const shutdown = async () => {
			this.logInfo('Shutting down Export Indices MCP Server...');
			await server.stop();
			process.exit(0);
		};

		process.on('SIGINT', shutdown);
		process.on('SIGTERM', shutdown);

		try {
			await server.start();
			this.setStatus('Export Indices MCP Server running', 'end');
			this.logInfo(`Export Indices MCP Server is running on http://localhost:${port}`);
			this.logInfo('Press Ctrl+C to stop the server');

			// Keep process alive - return a promise that never resolves
			return new Promise<void>(() => {
				// This promise never resolves, keeping the process alive
			});
		} catch (error: any) {
			this.logError('Failed to start Export Indices MCP Server:', error);
			this.setStatus('Export Indices MCP Server failed', 'end');
			throw error;
		}
	}
}
