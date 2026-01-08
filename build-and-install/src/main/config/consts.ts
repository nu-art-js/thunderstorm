/**
 * Constants for file names and configuration keys used throughout the build system.
 */
import {MemKey} from '@nu-art/ts-common/mem-storage/index';
import {RuntimeProjectConfig} from './types/index.js';

/** Version file name (version-app.json) */
export const CONST_VersionApp = 'version-app.json';
/** Package.json template file name (__package.json) */
export const CONST_PackageJSONTemplate = '__package.json';
/** Package.json file name */
export const CONST_PackageJSON = 'package.json';
/** Node modules folder name */
export const CONST_NodeModules = 'node_modules';
/** BAI configuration file name (bai-config.json) */
export const CONST_BaiConfig = 'bai-config.json';
/** Firebase RC file name (.firebaserc) */
export const CONST_FirebaseRC = '.firebaserc';
/** Firebase JSON configuration file name (firebase.json) */
export const CONST_FirebaseJSON = 'firebase.json';
/** TypeScript configuration file name (tsconfig.json) */
export const CONST_TS_CONFIG = 'tsconfig.json';
/** PNPM workspace file name (pnpm-workspace.yaml) */
export const CONST_PNPM_WORKSPACE = 'pnpm-workspace.yaml';
/** PNPM lock file name (pnpm-lock.yaml) */
export const CONST_PNPM_LOCK = 'pnpm-lock.yaml';
/** Trash directory name (.trash) */
export const CONST_TrashDir = '.trash';
/** Deployment metadata file name (deployment-metadata.json) */
export const CONST_DeploymentMetadata = 'deployment-metadata.json';
/** Deployment ID metadata key (deployment-id) */
export const CONST_DeploymentId = 'deployment-id';
/** Default version tag (latest) */
export const CONST_LatestTag = 'latest';
/** Hosting build tarball name (hosting-build.tar.gz) */
export const CONST_HostingBuildTarball = 'hosting-build.tar.gz';
/** Staging directory name (staging) */
export const CONST_StagingDir = 'staging';
/** Deploy hosting temp directory name (deploy-hosting) */
export const CONST_DeployHostingDir = 'deploy-hosting';
/** Build image temp directory name (build-image) */
export const CONST_BuildImageDir = 'build-image';

/** Memory storage key for packages configuration */
export const MemKey_Packages = new MemKey<RuntimeProjectConfig>('bai-packages', true);
