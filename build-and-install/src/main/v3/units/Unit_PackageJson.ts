import {CONST_NodeModules, CONST_PackageJSON} from '../../core/consts.js';
import {__stringify} from '@nu-art/ts-common';
import {UnitPhaseImplementor} from '../core/types.js';
import {Config_ProjectUnit, ProjectUnit} from './ProjectUnit.js';
import {resolve} from 'path';
import {DEFAULT_OLD_TEMPLATE_PATTERN, FileSystemUtils} from '../core/FileSystemUtils.js';
import {TS_PackageJSON} from '../UnitsMapper/types.js';
import {Phase_Prepare, Phase_Purge} from '../phase/index.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';


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
		const targetPath = resolve(this.config.fullPath, CONST_PackageJSON);
		const params = this.deriveLibDependencies();
		const packageJson = FileSystemUtils.file.template.transform(__stringify(this.config.packageJson, true), params);
		await FileSystemUtils.file.template.write(targetPath, packageJson, params, DEFAULT_OLD_TEMPLATE_PATTERN);
	}

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

