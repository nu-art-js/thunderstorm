import {CONST_NodeModules, CONST_PackageJSON} from '../../config/consts.js';
import {__stringify, StringMap} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../../core/types.js';
import {Config_ProjectUnit, ProjectUnit} from '../base/ProjectUnit.js';
import {resolve} from 'path';
import {TS_PackageJSON} from '../discovery/types.js';
import {Phase_Prepare, Phase_Purge} from '../../phases/definitions/index.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {DEFAULT_OLD_TEMPLATE_PATTERN, FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';


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
	implements UnitPhaseImplementor<[Phase_Purge, Phase_Prepare]> {


	constructor(config: C) {
		super(config);
		this.addToClassStack(Unit_PackageJson);
	}

	//######################### Internal Logic #########################

	protected npmCommand(command: string) {
		return resolve(this.runtimeContext.parentUnit.config.fullPath, './node_modules/.bin', command);
	}

	protected deriveDistDependencies(): StringMap {
		const params = this.runtimeContext.childUnits.reduce((dependencies, unit) => {
			try {
				dependencies[unit.config.key] = (unit as Unit_PackageJson).config.packageJson.version;
			} catch (e: any) {
				this.logError('Error getting dependency version for unit', unit.config.key, e);
			}
			return dependencies;
		}, {
			...this.runtimeContext.baiConfig.templateParams?.packageJson,
		});
		return {
			...params,
			THUNDERSTORM_DEP_VERSION: this.runtimeContext.baiConfig.templateParams?.packageJson?.['THUNDERSTORM_VERSION'] ?? ''
		};
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
	async prepare() {
		const targetPath = resolve(this.config.fullPath, CONST_PackageJSON);
		const params = this.deriveLibDependencies();
		const packageJson = FileSystemUtils.file.template.transform(__stringify(this.config.packageJson, true), params);
		await FileSystemUtils.file.template.write(targetPath, packageJson, params, DEFAULT_OLD_TEMPLATE_PATTERN);
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

	protected async releasePorts(allPorts: string[]) {
		const commando = this.allocateCommando(Commando_NVM).applyNVM();

		await commando.setUID(this.config.key)
			.append(`array=($(lsof -ti:${allPorts.join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.execute();
	}
}

