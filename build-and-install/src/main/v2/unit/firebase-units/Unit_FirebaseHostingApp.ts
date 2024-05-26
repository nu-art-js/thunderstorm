import {Unit_TypescriptLib} from '../core';
import {FirebasePackageConfig} from '../../../core/types';
import {UnitPhaseImplementor} from '../types';
import {Phase_ResolveConfigs} from '../../phase';
import {RuntimeParams} from '../../../core/params/params';
import {ImplementationMissingException} from '@nu-art/ts-common/core/exceptions/exceptions';
import {promises as _fs} from 'fs';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../core/consts';
import {convertToFullPath} from '@nu-art/commando/core/tools';

type _Config<Config> = {
	firebaseConfig: FirebasePackageConfig;
	output: string;
	sources?: string[];
} & Config

export class Unit_FirebaseHostingApp<Config extends {} = {}, C extends _Config<Config> = _Config<Config>>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_ResolveConfigs]> {

	//######################### Internal Logic #########################

	private getEnvConfig() {
		const env = RuntimeParams.environment;
		const envConfig = this.config.firebaseConfig.envs.find(_env => _env.env === env);
		if (!envConfig)
			throw new ImplementationMissingException(`Missing EnvConfig for env ${env} in unit ${this.config.label}`);

		return envConfig;
	}

	private async resolveHostingRC () {
		const envConfig = this.getEnvConfig();
		const rcConfig = {projects: {default: envConfig.projectId}};
		const targetPath = convertToFullPath(`${this.config.pathToPackage}/${CONST_FirebaseRC}`);
		await _fs.writeFile(targetPath,JSON.stringify(rcConfig, null, 2),{encoding: 'utf-8'})
	}

	private async resolveHostingJSON() {
		const envConfig = this.getEnvConfig();
		const fileContent: FirebasePackageConfig['hosting'] = envConfig.isLocal ? {} as FirebasePackageConfig['hosting'] : this.config.firebaseConfig.hosting;
		const targetPath = convertToFullPath(`${this.config.pathToPackage}/${CONST_FirebaseJSON}`);
		await _fs.writeFile(targetPath, JSON.stringify(fileContent, null, 2), {encoding: 'utf-8'});
	}

	private async resolveHostingRuntimeConfig() {
		const envConfig = this.getEnvConfig();

		const emulatorConfig = {
			hostname: 'localhost',
			port: this.config.firebaseConfig.basePort + 2,
		};

		const feConfig = {
			ModuleFE_Thunderstorm: {
				appName: `${this.config.key} - (${envConfig.env})`
			},
			ModuleFE_XHR: {
				origin: envConfig.isLocal ? `https://localhost:${this.config.firebaseConfig.basePort}` : envConfig.backend.url,
				timeout: envConfig.backend.timeout || 30000,
				compress: envConfig.backend.compress || false,
				minLogLevel: envConfig.backend.minLogLevel || false,
			},
			ModuleFE_FirebaseListener: {
				emulatorConfig: envConfig.isLocal ? emulatorConfig : undefined,
				firebaseConfig: envConfig.firebase.listener?.config
			}
		};

		const targetPath = convertToFullPath(`${this.config.pathToPackage}/src/main/config.ts`);
		const fileContent = `export const config = ${JSON.stringify(feConfig, null, 2)};`;
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Phase Implementations #########################

	async resolveConfigs() {
		await this.resolveHostingRC();
		await this.resolveHostingJSON();
		await this.resolveHostingRuntimeConfig();
	}
}