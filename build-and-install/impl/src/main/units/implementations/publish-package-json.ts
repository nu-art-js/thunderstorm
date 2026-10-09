import {resolve} from 'path';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {CONST_PackageJSON} from '../../config/consts.js';

/**
 * `publishConfig` (directory, linkDirectory) is only for pnpm workspace linking. npm does not know
 * these keys and warns ("Unknown publishConfig config") on publish, so the published package.json
 * omits it. The source __package.json keeps it.
 */
export const stripPublishConfig = <T extends { publishConfig?: unknown }>(packageJson: T): Omit<T, 'publishConfig'> => {
	const {publishConfig: _publishConfig, ...rest} = packageJson;
	return rest;
};

/** Rewrites `<outputDir>/package.json` without `publishConfig`. No-op when there is none. */
export const preparePackageJsonForPublish = async (outputDir: string): Promise<void> => {
	const path = resolve(outputDir, CONST_PackageJSON);
	const packageJson = await FileSystemUtils.file.read.json<{ publishConfig?: unknown }>(path);
	if (!('publishConfig' in packageJson))
		return;

	await FileSystemUtils.file.write.json(path, stripPublishConfig(packageJson));
};
