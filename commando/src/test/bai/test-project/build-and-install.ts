import {mapProjectPackages} from '../logic/map-project-packages';
import {_keys, convertToFullPath} from '../core/tools';
import {ProjectManager} from '../logic/ProjectManager';
import {JSONVersion, PackageJson} from '../core/types';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {Commando} from '../../../main/core/cli';
import {PNPM} from '../../../main/cli/pnpm';
import {NVM} from '../../../main/cli/nvm';
import {CONST_PackageJSON} from '../core/consts';


const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
const CONST_ThunderstormDependencyKey = 'THUNDERSTORM_SDK_VERSION_DEPENDENCY';
const CONST_ProjectVersionKey = 'APP_VERSION';
const CONST_ProjectDependencyKey = 'APP_VERSION_DEPENDENCY';
const CONST_TS_Config = `tsconfig.json`;

const pathToProjectTS_Config = convertToFullPath(`./.config/${CONST_TS_Config}`);
const pathToProjectEslint = convertToFullPath('./.config/.eslintrc.js');
const projectPackages = mapProjectPackages(convertToFullPath('./.config/packages.json'));
const projectManager = new ProjectManager(projectPackages);
const runningWithInfra = true;
const installGlobal = true;

projectManager.registerPhase({
	type: 'project',
	name: 'setup-project',
	action: async () => {
		const thunderstormVersionJson = require(convertToFullPath('./version-thunderstorm.json')) as JSONVersion;
		projectPackages.params[CONST_ThunderstormVersionKey] = thunderstormVersionJson.version;
		if (runningWithInfra)
			projectPackages.params[CONST_ThunderstormDependencyKey] = `workspace:*`;
		else
			projectPackages.params[CONST_ThunderstormDependencyKey] = thunderstormVersionJson.version;

		const projectVersionJson = require(convertToFullPath('./version-app.json')) as JSONVersion;
		projectPackages.params[CONST_ProjectVersionKey] = projectVersionJson.version;
		projectPackages.params[CONST_ProjectDependencyKey] = `workspace:*`;
	}
});

projectManager.registerPhase({
	type: 'package',
	name: 'resolve-template',
	action: async (pkg) => {
		let packageJsonTemplateAsString = JSON.stringify(pkg.packageJsonTemplate);
		let match = null;
		do {
			match = packageJsonTemplateAsString.match(/\$([A-Z_]+)/);
			if (match?.[0])
				packageJsonTemplateAsString = packageJsonTemplateAsString.replace(new RegExp(`\\$${match[1]}`, 'g'), projectPackages.params[match[1]]);
		} while (!!match);

		const packageJson = JSON.parse(packageJsonTemplateAsString) as PackageJson;
		if (packageJson.dependencies)
			_keys(packageJson.dependencies).reduce((dependencies, dependencyKey) => {
				if (dependencies[dependencyKey] === '$$') {
					const packageDetails = projectPackages.packageMap[dependencies[dependencyKey]];
					if (!packageDetails)
						throw new Error('$$ can only be used with inner project dependency');

					dependencies[dependencyKey] = packageDetails.packageJsonTemplate.version;
				}

				return dependencies;
			}, packageJson.dependencies);

		pkg.packageJson = packageJson;

		// write final package.json to package root folder
		await _fs.writeFile(`${pkg.path}/${CONST_PackageJSON}`, JSON.stringify(pkg.packageJson, null, 2), {encoding: 'utf-8'});

		// write final package.json to package output folder
		if (pkg.type === 'sourceless')
			return;

		if (!fs.existsSync(pkg.output))
			await _fs.mkdir(pkg.output);

		await _fs.writeFile(`${pkg.output}/${CONST_PackageJSON}`, JSON.stringify(pkg.packageJson, null, 2), {encoding: 'utf-8'});
	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'setup-packages',
	action: async () => {

	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'install-nvm',
	action: async () => {
		await NVM.installRequiredVersionIfNeeded();
	}
});

projectManager.registerPhase({
	type: 'package',
	name: 'package-purge',
	action: async (pkg) => {
		if (fs.existsSync(pkg.output))
			await _fs.rm(pkg.output, {recursive: true, force: true});

		if (fs.existsSync(pkg.nodeModulesFolder))
			await _fs.rm(pkg.nodeModulesFolder, {recursive: true, force: true});
	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'install',
	action: async () => {
		const listOfLibs = projectPackages.packages
			.filter(pkg => runningWithInfra || ['project-lib', 'app', 'sourceless'].includes(pkg.type))
			.map(pkg => pkg.path.replace(`${process.cwd()}/`, '').replace(process.cwd(), '.'));

		if (installGlobal) {
			await NVM.createCommando().append('npm i -g typescript@latest eslint@latest').execute();
		}

		await PNPM.createWorkspace(listOfLibs);
		await PNPM.install(NVM.createCommando());
	}
});

projectManager.registerPhase({
	type: 'package',
	name: 'clean',
	action: async (pkg) => {
		if (fs.existsSync(pkg.output))
			await _fs.rm(pkg.output, {recursive: true, force: true});
	}
});

projectManager.registerPhase({
	type: 'package',
	name: 'lint',
	action: async (pkg) => {
		if (pkg.type === 'sourceless')
			return;

		const folder = 'main';
		const sourceFolder = `${pkg.path}/src/${folder}`;
		return NVM.createCommando().append(`eslint --config ${pathToProjectEslint} --ext .ts --ext .tsx "${sourceFolder}"`).execute();
	}
});

projectManager.registerPhase({
	type: 'package',
	name: 'compile',
	action: async (pkg) => {
		if (pkg.type === 'sourceless')
			return;

		const folder = 'main';
		const sourceFolder = `${pkg.path}/src/${folder}`;
		const pathToLocalTsConfig = `${sourceFolder}/${CONST_TS_Config}`;
		if (!pkg.customTsConfig)
			await _fs.copyFile(pathToProjectTS_Config, pathToLocalTsConfig);

		return NVM.createCommando()
			.append(`tsc -p "${pathToLocalTsConfig}" --rootDir "${sourceFolder}" --outDir "${pkg.output}"`).execute();
	}
});

// projectManager.registerPhase({
// 	type: 'project',
// 	name: 'debug',
// 	action: async () => {
// 		console.log(JSON.stringify(projectPackages, null, 2));
// 	}
// });

(async () => {
	return projectManager.execute();
	// await projectManager.runPhaseByKey('install-nvm');
	// await projectManager.runPhaseByKey('install');
	// return projectManager.runPhaseByKey('lint');
	// return projectManager.runPhaseByKey('install-nvm');
})()
	.then(() => console.log('completed'))
	.catch(err => console.error('Failed with error: ', err));
