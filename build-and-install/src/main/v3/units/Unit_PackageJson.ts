import {CONST_PackageJSON, CONST_PackageJSONTemplate} from '../../core/consts';
import {PackageJson} from '../../core/types';
import {BadImplementationException, ImplementationMissingException} from '@nu-art/ts-common';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {Phase_CopyPackageJSON, Phase_Purge} from '../../phase';
import {UnitPhaseImplementor} from '../../types/types';
import {MemKey_ProjectConfig} from '../../v2/phase-runner/RunnerParams';
import {convertPackageJSONTemplateToPackJSON_Value} from '../../v2/unit/tools/tools';
import {Config_ProjectUnit, ProjectUnit} from './ProjectUnit';
import {resolve} from 'path';
import {FileSystemUtils} from '../core/FileSystemUtils';


const PackageJsonTargetKey_Template = 'template';
const PackageJsonTargetKey_Root = 'root';
const PackageJsonTargetKey_Dist = 'dist';
const PackageJsonTargetKeys = [PackageJsonTargetKey_Template, PackageJsonTargetKey_Root, PackageJsonTargetKey_Dist] as const;
type PackageJsonTargetKey = typeof PackageJsonTargetKeys[number];

export type Unit_PackageJson_Config = Config_ProjectUnit & {};


export abstract class Unit_PackageJson<C extends Unit_PackageJson_Config = Unit_PackageJson_Config>
	extends ProjectUnit<C>
	implements UnitPhaseImplementor<[Phase_CopyPackageJSON, Phase_Purge]> {

	readonly packageJson: { [k in PackageJsonTargetKey]: PackageJson } = {} as { [k in PackageJsonTargetKey]: PackageJson };

	constructor(config: C) {
		super(config);
		this.addToClassStack(Unit_PackageJson);
	}

	protected async init(setInitialized: boolean = true) {
		await super.init(false);
		await this.loadTemplatePackageJSON();
		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Internal Logic #########################

	private async loadTemplatePackageJSON() {
		const unitRootPath = this.config.fullPath;
		const templatePath = `${unitRootPath}/${CONST_PackageJSONTemplate}`;

		if (!fs.existsSync(templatePath))
			throw new BadImplementationException(`Missing __package.json file in root for unit ${this.config.label}`);

		try {
			this.packageJson.template = JSON.parse(await _fs.readFile(templatePath, 'utf-8')) as PackageJson;
		} catch (e: any) {
			throw new BadImplementationException(`There is an issue in the __package.json file in root for unit ${this.config.label}`);
		}
	}

	/**
	 * Create a packageJson object for each target key
	 * @private
	 */
	private async populatePackageJson() {
		if (!this.packageJson.template)
			throw new BadImplementationException(`Missing template package.json for unit ${this.config.label}`);

		PackageJsonTargetKeys.forEach(key => this.packageJson[key] = this.convertTemplatePackageJSON(key, this.packageJson.template));
	}

	/**
	 * Execute template to packageJson object conversion based on target key
	 * @param targetKey
	 * @param template
	 * @private
	 */
	private convertTemplatePackageJSON(targetKey: PackageJsonTargetKey, template: PackageJson) {
		switch (targetKey) {
			case PackageJsonTargetKey_Template:
				return template;
			case PackageJsonTargetKey_Root:
				return this.convertPJForRoot(template);
			case PackageJsonTargetKey_Dist:
				return this.convertPJForDist(template);
			default:
				throw new ImplementationMissingException(`No implementation for targetKey ${targetKey}`);
		}
	}

	/**
	 * Converts a template __package.json file into a usable package.json for the unit root
	 * @param template
	 * @private
	 */
	private convertPJForRoot(template: PackageJson) {
		//Get the package params for replacing in the template package json
		const projectConfig = MemKey_ProjectConfig.get();

		//Convert template to actual package.json
		const converted = convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => projectConfig.params[key!]
			? 'workspace:*'
			: projectConfig.params[value]);

		//Set dynamic params for this pkg
		projectConfig.params[converted.name] = converted.version;
		projectConfig.params[`${converted.name}_path`] = `file:.dependencies/${this.config.key}`; //Not sure about this one

		MemKey_ProjectConfig.set(projectConfig);
		return converted;
	}

	/**
	 * Converts a template __package.json file into a usable package.json for the unit dist
	 * @param template
	 * @private
	 */
	private convertPJForDist(template: PackageJson) {
		//Get the package params for replacing in the template package json
		const params = MemKey_ProjectConfig.get().params;

		//if main prop exists on pkg json clear the dist from its ref
		if (template.main)
			template.main = template.main.replace('dist/', '');

		//if types prop exists on pkg json clear the dist from its ref
		if (template.types)
			template.types = template.types.replace('dist/', '');

		//Convert template to actual package.json
		return convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => params[key!] ?? params[value]);
	}

	//######################### Phase Implementations #########################

	async copyPackageJson() {
		this.setStatus('Resolving PackageJSON');
		//Populate packageJson objects
		await this.populatePackageJson();
		//Get path
		const unitRootPath = this.config.fullPath;
		const targetPath = `${unitRootPath}/${CONST_PackageJSON}`;
		//Create the package.json file in target location
		await _fs.writeFile(targetPath, JSON.stringify(this.packageJson.root, null, 2), {encoding: 'utf-8'});
		this.setStatus('PackageJSON resolved');
	}

	async purge() {
		await FileSystemUtils.file.delete(resolve(this.config.fullPath, 'package.json'));
		await FileSystemUtils.folder.delete(resolve(this.config.fullPath, 'node_modules'));
	}
}