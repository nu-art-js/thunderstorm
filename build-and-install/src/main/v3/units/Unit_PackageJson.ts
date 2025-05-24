import {CONST_NodeModules, CONST_PackageJSON} from '../../core/consts';
import {__stringify, _keys} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../core/types';
import {Config_ProjectUnit, ProjectUnit} from './ProjectUnit';
import {resolve} from 'path';
import {DEFAULT_OLD_TEMPLATE_PATTERN, FileSystemUtils} from '../core/FileSystemUtils';
import {TS_PackageJSON} from '../UnitsMapper/types';
import {Phase_Prepare, Phase_Purge} from '../phase';


export type Unit_PackageJson_Config = Config_ProjectUnit & { packageJson: TS_PackageJSON; };


export class Unit_PackageJson<C extends Unit_PackageJson_Config = Unit_PackageJson_Config>
	extends ProjectUnit<C>
	implements UnitPhaseImplementor<[Phase_Purge, Phase_Prepare]> {


	constructor(config: C) {
		super(config);
		this.addToClassStack(Unit_PackageJson);
	}

	//######################### Internal Logic #########################

	protected deriveDistDependencies() {
		return {...this.runtimeContext.baiConfig.templateParams?.packageJson};
	}

	protected deriveLibDependencies() {
		return this.runtimeContext.childUnits.reduce((dependencies, unit) => {
			dependencies[unit.config.key] = 'workspace:*';
			return dependencies;
		}, {...this.runtimeContext.baiConfig.templateParams?.packageJson});
	}


	//######################### Phase Implementations #########################

	async prepare() {
		this.setStatus('Resolving PackageJSON', 'start');
		const targetPath = resolve(this.config.fullPath, CONST_PackageJSON);
		try {
			await FileSystemUtils.file.template.write(targetPath, __stringify(this.config.packageJson, true), this.deriveLibDependencies(), DEFAULT_OLD_TEMPLATE_PATTERN);
			this.setStatus('PackageJSON resolved', 'end');
		} catch (e: any) {
			this.setErrorStatus('PackageJSON resolved - ERROR', e);
			throw e;
		}
	}

	async purge() {
		this.setStatus('Purging', 'start');
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, CONST_PackageJSON));
		await FileSystemUtils.folder.delete(resolve(this.config.fullPath, CONST_NodeModules));
		this.setStatus('Purged', 'end');
	}
}

