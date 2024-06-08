import {BaseUnit, BaseUnit_Config, BaseUnit_RuntimeConfig} from './BaseUnit';
import {CONST_PackageJSON, CONST_PackageJSONTemplate} from '../../../core/consts';
import {PackageJson} from '../../../core/types';
import {
	AbsolutePath,
	BadImplementationException,
	ImplementationMissingException,
	RelativePath,
	_keys
} from '@nu-art/ts-common';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {Phase_CopyPackageJSON} from '../../phase';
import {UnitPhaseImplementor} from '../types';
import {MemKey_ProjectConfig} from '../../phase-runner/RunnerParams';
import {convertToFullPath} from '@nu-art/commando/shell/tools';
import {convertPackageJSONTemplateToPackJSON_Value} from '../tools/tools';


const PackageJsonTargetKey_Template = 'template';
const PackageJsonTargetKey_Root = 'root';
const PackageJsonTargetKey_Dist = 'dist';
const PackageJsonTargetKeys = [PackageJsonTargetKey_Template, PackageJsonTargetKey_Root, PackageJsonTargetKey_Dist] as const;
type PackageJsonTargetKey = typeof PackageJsonTargetKeys[number];

export type Unit_Typescript_Config = BaseUnit_Config & {
	pathToPackage: RelativePath
};

export type Unit_Typescript_RuntimeConfig = BaseUnit_RuntimeConfig & {
	pathTo: { pkg: AbsolutePath };
};

export class Unit_Typescript<C extends Unit_Typescript_Config = Unit_Typescript_Config, RTC extends Unit_Typescript_RuntimeConfig = Unit_Typescript_RuntimeConfig>
	extends BaseUnit<C, RTC>
	implements UnitPhaseImplementor<[Phase_CopyPackageJSON]> {

	readonly packageJson: { [k in PackageJsonTargetKey]: PackageJson } = {} as { [k in PackageJsonTargetKey]: PackageJson };

	constructor(config: C) {
		super(config);
		this.addToClassStack(Unit_Typescript);
	}

	protected async init(setInitialized: boolean = true) {
		await super.init(false);
		this.runtime.pathTo = {
			pkg: convertToFullPath(this.config.pathToPackage),
		};
		await this.loadTemplatePackageJSON();
		this.runtime.dependencyName = this.packageJson.template.name;
		this.runtime.unitDependencyNames = _keys(this.packageJson.template.dependencies ?? {});
		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Internal Logic #########################

	private async loadTemplatePackageJSON() {
		const unitRootPath = this.runtime.pathTo.pkg;
		const templatePath = `${unitRootPath}/${CONST_PackageJSONTemplate}`;

		if (!fs.existsSync(templatePath))
			throw new BadImplementationException(`Missing __package.json file in root for unit ${this.config.label}`);

		this.packageJson.template = JSON.parse(await _fs.readFile(templatePath, 'utf-8')) as PackageJson;
	}

	/**
	 * Create a packageJson object for each target key
	 * @private
	 */
	private async populatePackageJson() {
		if (!this.packageJson.template)
			await this.loadTemplatePackageJSON();
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
		const converted = convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => projectConfig.params[key!] ? 'workspace:*' : projectConfig.params[value]);

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
		const unitRootPath = this.runtime.pathTo.pkg;
		const targetPath = `${unitRootPath}/${CONST_PackageJSON}`;
		//Create the package.json file in target location
		await _fs.writeFile(targetPath, JSON.stringify(this.packageJson.root, null, 2), {encoding: 'utf-8'});
		this.setStatus('PackageJSON resolved');
	}
}