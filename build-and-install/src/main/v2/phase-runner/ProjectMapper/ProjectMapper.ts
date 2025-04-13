import {BaseUnit} from '../../unit/core';
import {ProjectLibRule} from './types';
import {promises as fs} from 'fs';
import {BadImplementationException} from '@nu-art/ts-common';

/**
 * This class will receive a path and will map the workspace packages and libs
 *
 * A lib will have rules to infer it, mainly from the package.json but also from existing files in the context of the node lib
 */
export class ProjectMapper {

	private rules: ProjectLibRule<BaseUnit<any>>[] = [];

	/**
	 * @param path - will always be a directory
	 */
	async resolveUnits(path: string) {
		if (!(await fs.stat(path)).isDirectory())
			throw new BadImplementationException(`Provided path '${path}' is not a directory`);

		// iterate on all the folders in the provided path
		const paths = await fs.readdir(path);
		console.log('paths', paths);
		this.resolveUnit(path);
	}

	/**
	 * @param path - will always be a directory
	 */
	private resolveUnit(path: string) {

	}

	addRule<T extends BaseUnit<any>>(rule: ProjectLibRule<T>) {
		this.rules.push(rule);
	}
}