import {CONST_NodeModules, CONST_PackageJSON, CONST_PackageJSONTemplate} from '../../config/consts.js';
import {__stringify, _keys, BadImplementationException, deepClone, InvalidResult, LogLevel, StringMap, ValidationException} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../../core/types.js';
import {Config_ProjectUnit, ProjectUnit} from '../base/ProjectUnit.js';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {TS_PackageJSON} from '../discovery/types.js';
import {Phase_Prepare, Phase_PrepareWatch, Phase_Purge} from '../../phases/definitions/consts.js';
import {Commando_Basic} from '@nu-art/commando';
import {DEFAULT_TEMPLATE_PATTERN, FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {Unit_NodeProject} from './Unit_NodeProject.js';
import {FilesCache} from '../../core/FilesCache.js';


/**
 * Configuration for PackageJson units (units with package.json).
 */
export type Unit_PackageJson_Config = Config_ProjectUnit & { packageJson: TS_PackageJSON; };

/**
 * Base class for all units that have a package.json file.
 *
 * **Key Responsibilities**:
 * - Manages package.json template transformation
 * - Handles dependency derivation (lib and dist dependencies)
 * - Implements prepare and purge phases
 *
 * **Dependency Management**:
 * - `deriveLibDependencies()`: Creates workspace dependencies for development
 * - `deriveDistDependencies()`: Creates versioned dependencies for distribution
 *
 * **Template System**: Uses FileSystemUtils to transform package.json templates
 * with runtime parameters (THUNDERSTORM_VERSION, __ENV__, etc.).
 *
 * **Phases Implemented**:
 * - `prepare()`: Generates package.json from template with resolved dependencies
 * - `purge()`: Deletes package.json and node_modules
 *
 * **Base For**: Unit_NodeProject, Unit_TypescriptLib, Unit_FirebaseHosting, etc.
 */
export class Unit_PackageJson<C extends Unit_PackageJson_Config = Unit_PackageJson_Config>
	extends ProjectUnit<C>
	implements UnitPhaseImplementor<[Phase_Purge, Phase_Prepare, Phase_PrepareWatch]> {

	configValidationResult?: InvalidResult<any>;

	/**
	 * Clones a raw __package.json and replaces '?' dependency values with template
	 * placeholders '{{key}}' so template-transform can resolve them later.
	 */
	static transformDependencyPlaceholders<T extends TS_PackageJSON>(packageJson: T): T {
		const result = deepClone(packageJson);

		const dependencies = result.dependencies;
		if (dependencies)
			result.dependencies = _keys(dependencies).reduce<StringMap>((acc, key) => {
				acc[key] = dependencies[key] === '?' ? `{{${key}}}` : dependencies[key];
				return acc;
			}, {});

		const devDependencies = result.devDependencies;
		if (devDependencies)
			result.devDependencies = _keys(devDependencies).reduce<StringMap>((acc, key) => {
				acc[key] = devDependencies[key] === '?' ? `{{${key}}}` : devDependencies[key];
				return acc;
			}, {});

		return result;
	}

	constructor(config: C) {
		super(config);
		this.addToClassStack(Unit_PackageJson);
	}

	//######################### Internal Logic #########################

	protected npmCommand(command: string) {
		const packageBin = resolve(this.config.fullPath, './node_modules/.bin', command);
		if (existsSync(packageBin))
			return packageBin;

		return resolve(this.runtimeContext.parentUnit.config.fullPath, './node_modules/.bin', command);
	}

	protected deriveDistDependencies(): StringMap {
		const baseParams = this.runtimeContext.baiConfig.templateParams?.packageJson ?? {};
		const params = (this.runtimeContext.parentUnit as Unit_NodeProject).innerUnits.reduce((dependencies, unit) => {
			const rawVersion = (unit as Unit_PackageJson).config.packageJson.version;
			dependencies[unit.config.key] = FileSystemUtils.file.template.transform(rawVersion, baseParams);
			return dependencies;
		}, {
			...baseParams,
		});
		return params;
	}

	protected deriveLibDependencies() {
		return this.runtimeContext.childUnits.reduce((dependencies, unit) => {
			dependencies[unit.config.key] = 'workspace:*';
			return dependencies;
		}, {...this.runtimeContext.baiConfig.templateParams?.packageJson, __ENV__: this.runtimeContext.runtimeParams.environment} as StringMap);
	}


	//######################### Phase Implementations #########################

	/**
	 * Prepares package.json by generating it from template with resolved dependencies.
	 *
	 * **Process**:
	 * 1. Derives lib dependencies (workspace:* for development)
	 * 2. Transforms package.json template with params
	 * 3. Writes transformed package.json to disk
	 *
	 * **Template Params**: Includes THUNDERSTORM_VERSION, __ENV__, and child unit versions.
	 */
	async prepare(): Promise<void> {
		if (this.configValidationResult)
			throw new ValidationException(`Invalid unit config for '${this.config.key}'`, undefined, this.configValidationResult);

		await this._sharedPrepare();
	}

	async watchPrepare(): Promise<void> {
		const pathToFile = resolve(this.config.fullPath, CONST_PackageJSONTemplate);
		FilesCache.invalidate(pathToFile);
		const raw = await FilesCache.load.json<TS_PackageJSON>(pathToFile);
		const freshPackageJson = Unit_PackageJson.transformDependencyPlaceholders(raw);

		const targetPath = resolve(this.config.fullPath, CONST_PackageJSON);
		const params = this.deriveLibDependencies();
		const content = FileSystemUtils.file.template.transform(__stringify(freshPackageJson, true), params);
		await FileSystemUtils.file.template.write(targetPath, content, params, DEFAULT_TEMPLATE_PATTERN);
	}

	private async _sharedPrepare() {
		const targetPath = resolve(this.config.fullPath, CONST_PackageJSON);
		const params = this.deriveLibDependencies();
		const packageJson = FileSystemUtils.file.template.transform(__stringify(this.config.packageJson, true), params);
		await FileSystemUtils.file.template.write(targetPath, packageJson, params, DEFAULT_TEMPLATE_PATTERN);
	}

	/**
	 * Purges package.json and node_modules folder.
	 *
	 * Used by `--purge` flag to clean up before reinstall.
	 */
	async purge() {
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, CONST_PackageJSON));
		await FileSystemUtils.folder.delete(resolve(this.config.fullPath, CONST_NodeModules));
	}

	protected async describeHostPortListeners(port: number): Promise<{ pid: number; comm: string; command?: string }[]> {
		let stdout = '';
		await this.allocateCommando(Commando_Basic)
			.setLogLevelFilter((_log, std) => std === 'err' ? undefined : LogLevel.Verbose)
			.append(`for pid in $(lsof -nP -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null); do`)
			.append(`  comm=$(ps -p "$pid" -o comm= 2>/dev/null | xargs || true)`)
			.append(`  cmd=$(ps -p "$pid" -o command= 2>/dev/null | head -c 120 | xargs || true)`)
			.append(`  printf '%s\\t%s\\t%s\\n' "$pid" "$comm" "$cmd"`)
			.append(`done`)
			.execute((out, _stderr, _exitCode) => {
				stdout = out;
			});

		const listeners = stdout.trim().split('\n').filter(Boolean).map(line => {
			const [pidStr, comm, command] = line.split('\t');
			return {pid: +pidStr, comm: comm || 'unknown', command: command?.trim() || undefined};
		});

		for (const listener of listeners)
			this.logDebug(`Port ${port} listener: ${this.formatHostPortListener(listener)}`);

		return listeners;
	}

	protected describeProcessLabel(comm: string, command?: string): string {
		if (!command || command === comm)
			return comm;

		const trimmed = command.trim();
		if (comm === 'node' || comm === 'java') {
			const args = trimmed.replace(/^\S+\s*/, '');
			return args ? `${comm} ${args.substring(0, 80)}` : comm;
		}

		return trimmed.length > comm.length ? `${comm} (${trimmed.substring(0, 60)})` : comm;
	}

	protected formatHostPortListener(listener: { pid: number; comm: string; command?: string }): string {
		return `pid ${listener.pid} ${this.describeProcessLabel(listener.comm, listener.command)}`;
	}

	protected formatHostPortListeners(listeners: { pid: number; comm: string; command?: string }[]): string {
		return listeners.map(listener => this.formatHostPortListener(listener)).join(', ');
	}

	protected async isHostPortInUse(port: number): Promise<boolean> {
		return (await this.describeHostPortListeners(port)).length > 0;
	}

	protected async resolveAvailableHostPort(basePort: number, maxOffset = 10): Promise<number> {
		for (let offset = 0; offset <= maxOffset; offset++) {
			const port = basePort + offset;
			const listeners = await this.describeHostPortListeners(port);
			if (!listeners.length) {
				if (offset > 0)
					this.logInfo(`Port ${basePort} in use; using ${port}`);
				return port;
			}

			this.logInfo(`Port ${port} in use (${this.formatHostPortListeners(listeners)}); skipping`);
		}

		throw new BadImplementationException(`No free host port in range ${basePort}–${basePort + maxOffset}`);
	}

	protected async resolveConsecutiveAvailableHostPorts(basePort: number, count: number, maxOffset = 10): Promise<number[]> {
		for (let offset = 0; offset <= maxOffset; offset++) {
			const startPort = basePort + offset;
			const ports = Array.from({length: count}, (_, i) => startPort + i);
			const blocked: { port: number; listeners: { pid: number; comm: string; command?: string }[] }[] = [];

			for (const port of ports) {
				const listeners = await this.describeHostPortListeners(port);
				if (listeners.length)
					blocked.push({port, listeners});
			}

			if (!blocked.length) {
				if (offset > 0)
					this.logInfo(`Ports ${basePort}–${basePort + count - 1} in use; using ${startPort}–${startPort + count - 1}`);
				return ports;
			}

			for (const {port, listeners} of blocked)
				this.logInfo(`Port ${port} in use (${this.formatHostPortListeners(listeners)}); skipping block at ${startPort}`);
		}

		throw new BadImplementationException(`No free consecutive host port block of ${count} in range ${basePort}–${basePort + maxOffset + count - 1}`);
	}

	protected async releasePorts(allPorts: string[]) {
		if (!allPorts.length)
			return;

		this.logInfo('Releasing ports:', allPorts);

		// Never kill com.docker* — on Docker Desktop that PID owns every published port;
		// kill -9 there takes down the daemon and all containers (including dev mongo-emu--*).
		for (const portStr of allPorts) {
			const port = +portStr;
			const listeners = await this.describeHostPortListeners(port);
			for (const listener of listeners) {
				const label = this.formatHostPortListener(listener);
				if (listener.comm.startsWith('com.docker')) {
					this.logInfo(`Port ${port} in use (${label}); skipping (docker)`);
					continue;
				}

				this.logInfo(`Port ${port} in use (${label}); releasing`);
				await this.allocateCommando(Commando_Basic)
					.addLogProcessor(() => false)
					.append(`kill -9 ${listener.pid} 2>/dev/null || true`)
					.execute();
			}
		}
	}
}

