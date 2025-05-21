import {CONST_NodeModules, CONST_PackageJSON} from '../../core/consts';
import {__stringify} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../core/types';
import {convertPackageJSONTemplateToPackJSON_Value} from '../../old/tools';
import {Config_ProjectUnit, ProjectUnit} from './ProjectUnit';
import {resolve} from 'path';
import {FileSystemUtils} from '../core/FileSystemUtils';
import {TS_PackageJSON} from '../UnitsMapper/types';
import {Phase_Purge} from '../phase';


export type Unit_PackageJson_Config = Config_ProjectUnit & { packageJson: TS_PackageJSON; };


export class Unit_PackageJson<C extends Unit_PackageJson_Config = Unit_PackageJson_Config>
	extends ProjectUnit<C>
	implements UnitPhaseImplementor<[Phase_Purge]> {


	constructor(config: C) {
		super(config);
		this.addToClassStack(Unit_PackageJson);
	}

	async init(setInitialized: boolean = true) {
		await super.init(false);
		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Internal Logic #########################

	protected deriveDistDependencies() {
		return {...this.runtimeContext.baiConfig.dependenciesVersions};
	}

	protected deriveLibDependencies() {
		return this.runtimeContext.childUnits.reduce((dependencies, unit) => {
			dependencies[unit.config.key] = 'workspace:*';
			return dependencies;
		}, {...this.runtimeContext.baiConfig.dependenciesVersions});
	}

	protected convertPackageJsonForDist() {
		const dependenciesVersions = this.deriveDistDependencies();
		return convertPackageJSONTemplateToPackJSON_Value(this.config.packageJson, (key: string) => dependenciesVersions[key]);
	}

	protected convertPackageJsonForLib() {
		const dependenciesVersions = this.deriveLibDependencies();
		return convertPackageJSONTemplateToPackJSON_Value(this.config.packageJson, (key: string) => dependenciesVersions[key!]);
	}


	//######################### Phase Implementations #########################

	async prepare() {
		this.setStatus('Resolving PackageJSON');
		const packageJson = this.convertPackageJsonForLib();
		const pathToFile = resolve(this.config.fullPath, CONST_PackageJSON);
		await FileSystemUtils.file.write(pathToFile, __stringify(packageJson, true));
		this.setStatus('PackageJSON resolved');
	}

	async purge() {
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, CONST_PackageJSON));
		await FileSystemUtils.folder.delete(resolve(this.config.fullPath, CONST_NodeModules));
	}

}