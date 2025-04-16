import {BaseUnit} from '../../unit/core';
import {promises as fs} from 'fs';
import {BadImplementationException, Logger} from '@nu-art/ts-common';
import {UnitMapper} from './resolvers/core';

/**
 * This class will receive a path and will map the workspace packages and libs
 *
 * A lib will have rules to infer it, mainly from the package.json but also from existing files in the context of the node lib
 */
export class ProjectMapper
	extends Logger {

	private rules: UnitMapper<BaseUnit<any>>[] = [];

	/**
	 * @param path - will always be a directory
	 * @param projectRoot - The path to the project root
	 * @param units - The project units derived from the file system
	 */
	async resolveUnits(path: string, projectRoot = path, units = [] as BaseUnit<any>[]) {
		for (const rule of this.rules) {
			const unit = await rule.resolveUnit(path, projectRoot);
			if (!unit)
				continue;

			this.logDebug(`Found unit ${unit.config.name} at path ${path}`);
			units.push(unit);
			if (!unit.config.isRoot)
				return units;

			break;
		}

		this.logVerbose(`Iterating on path: ${path}`);
		if (!(await fs.stat(path)).isDirectory())
			throw new BadImplementationException(`Provided path '${path}' is not a directory`);

		// filter out all the folders in the provided path
		const paths = (await fs.readdir(path, {withFileTypes: true}))
			.filter(dirent => dirent.isDirectory())
			.map(dirent => `${path}/${dirent.name}`);

		for (const path of paths) {
			await this.resolveUnits(path, projectRoot, units);
		}

		return units;
	}

	addRules<T extends BaseUnit<any>>(...rules: UnitMapper<T>[]) {
		this.rules.push(...rules);
		return this;
	}
}