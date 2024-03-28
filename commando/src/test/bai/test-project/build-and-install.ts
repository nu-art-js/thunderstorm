import {convertPackageJSONTemplateToPackJSON, mapProjectPackages} from '../logic/map-project-packages';
import {_keys, convertToFullPath} from '../core/tools';
import {PackageBuildPhaseType_PackageWithOutput, ProjectManager} from '../logic/ProjectManager';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {PNPM} from '../../../main/cli/pnpm';
import {NVM} from '../../../main/cli/nvm';
import {CONST_FirebaseJSON, CONST_FirebaseRC, CONST_PackageJSON} from '../core/consts';
import {JSONVersion, Package_FirebaseHostingApp, PackageJson} from '../core/types';
import {default as projectConfig} from './.config/project-config';


const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
const CONST_ThunderstormDependencyKey = 'THUNDERSTORM_SDK_VERSION_DEPENDENCY';
const CONST_ProjectVersionKey = 'APP_VERSION';
const CONST_ProjectDependencyKey = 'APP_VERSION_DEPENDENCY';
const CONST_TS_Config = `tsconfig.json`;

const pathToProjectTS_Config = convertToFullPath(`./.config/${CONST_TS_Config}`);
const pathToProjectEslint = convertToFullPath('./.config/.eslintrc.js');
const projectPackages = mapProjectPackages(projectConfig);
const projectManager = new ProjectManager(projectPackages);
const runningWithInfra = true;
const installGlobal = true;
const buildForEnv = 'dev';

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

		pkg.packageJson = convertPackageJSONTemplateToPackJSON(pkg.packageJsonTemplate, projectConfig);

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
	type: 'package',
	name: 'resolve-env',
	action: async (pkg) => {
		if (!['firebase-functions-app', 'firebase-hosting-app'].includes(pkg.type))
			return;

		const firebasePkg = pkg as Package_FirebaseHostingApp;
		await _fs.writeFile(`${firebasePkg.path}/${CONST_FirebaseRC}`, JSON.stringify(firebasePkg.config.rc[buildForEnv], null, 2), {encoding: 'utf-8'});
		await _fs.writeFile(`${firebasePkg.path}/${CONST_FirebaseJSON}`, JSON.stringify(firebasePkg.config.json[buildForEnv], null, 2), {encoding: 'utf-8'});
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
	type: PackageBuildPhaseType_PackageWithOutput,
	name: 'package-purge',
	action: async (pkg) => {
		if (fs.existsSync(pkg.output))
			await _fs.rm(pkg.output, {recursive: true, force: true});

		// if (fs.existsSync(pkg.nodeModulesFolder))
		// 	await _fs.rm(pkg.nodeModulesFolder, {recursive: true, force: true});
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
	type: PackageBuildPhaseType_PackageWithOutput,
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
