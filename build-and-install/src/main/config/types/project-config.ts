import {StringMap, TypedMap} from '@nu-art/ts-common';
import {Package, RuntimePackage} from './package/index.js';

export type ProjectConfig = {
	params: StringMap;
	packages: Package[]
}

export type RuntimeProjectConfig = {
	packages: Package[];
	params: StringMap;
	packagesDependency: RuntimePackage[][];
	packageMap?: { [packageName: string]: RuntimePackage };
};

export type Constructor<T> = new (...args: any) => T

export type BAI_Config = {
	thunderstormVersion: string
	appVersion: string
	templateParams?: {
		packageJson?: TypedMap<string>
	}
	files?: {
		docker?: {
			dockerfile?: string
		}
		tests?: {
			firebase?: {
				'firebase.json'?: string
				'.firebaserc'?: string
				baseEmulationPort?: number
			}
			playwright?: {
				browsers?: ('chromium' | 'firefox' | 'webkit')[]
				headless?: boolean
				baseURL?: string
				viewport?: {
					width: number
					height: number
				}
				vite?: {
					port?: number
					configPath?: string // Relative path from project root to vite config (e.g., 'vite.config.ts')
				}
			}
		}
		firebase?: {
			databaseRules?: string
			storageRules?: string
			firestoreIndexesRules?: string
			firestoreRules?: string
		}
		typescript?: {
			tsConfig?: StringMap
			eslintConfig?: string
		}
		backend: {
			proxy: string
		}
	}
}