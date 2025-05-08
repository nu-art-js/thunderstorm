// file: ./test-case-1.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {ProjectUnit, Unit_NodeLib} from '../../_common';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {resolve} from 'path';
import {expect} from 'chai';

const pathToPackages = resolve(__dirname, 'workspace/packages');
const pathTo_Default_BAI = resolve(__dirname, 'fixtures/bai-defaults');
const projectRoot = resolve(__dirname, 'workspace');
const projectDefaultsPath = resolve(projectRoot, 'defaults/tsconfig.json');

type LibFileSystem = {
	name: string,
	path: string,
	eslint: string
	main: {
		path: string,
		tsconfig: string
	},
	test: {
		path: string,
		tsconfig: string
	},
};

function mapLibFileSystem(libName: string): LibFileSystem {
	const path = resolve(pathToPackages, libName);
	const srcMain = resolve(path, 'src/main');
	const srcTest = resolve(path, 'src/test');

	return {
		name: libName,
		path,
		eslint: resolve(path, '.eslintrc.json'),
		main: {
			path: srcMain,
			tsconfig: resolve(srcMain, 'tsconfig.json')
		},
		test: {
			path: srcTest,
			tsconfig: resolve(srcTest, 'tsconfig.json')
		},
	};
}

const baiDefaults = {
	tsconfig: {
		main: resolve(pathTo_Default_BAI, 'tsconfig-main.json'),
		test: resolve(pathTo_Default_BAI, 'tsconfig-test.json'),
	},
	eslint: resolve(pathTo_Default_BAI, '.eslintrc.json'),
};
const lib1 = mapLibFileSystem('lib-1');
const lib2 = mapLibFileSystem('lib-2');


function cleanFile(path: string) {
	if (existsSync(path)) rmSync(path);
}

function resetFile(path: string, content: string) {
	writeFileSync(path, content);
}

function ensureDir(path: string) {
	try {
		mkdirSync(path, {recursive: true});
	} catch {
	}
}

function ensureCustomESLint() {
	resetFile(lib1.eslint, '{"root":true}');
}

type Input = {
	units: ProjectUnit<any>[],
	setup: () => (Promise<void>),
};
type Output = () => (Promise<void>);
type TestSuite_UnitPrepare = TestSuite<Input, Output>;
type TestCase_UnitPrepare = TestSuite_UnitPrepare['testcases'][number];

const test = async (input: Input) => {
	const {units, setup} = input;
	await setup();
	return Promise.all(units.map(u => u.prepare({projectRoot, baiDefaultsPath: pathTo_Default_BAI})));
};

const runTestCase = (testCase: TestCase_UnitPrepare, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('ProjectUnit - Prepare', () => {
	it('Compiles with valid tsconfig and outputs JS to dist', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-1--lib-1',
			label: 'Test case 1 - lib-1',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
			customTSConfig: false,
		});

		const tsconfigContent = '{"compilerOptions":{"target":"ES2020"}}';
		const eslintContent = '{"root":true}';

		return runTestCase({
			input: {
				units: [unit],
				setup: async () => {
					ensureDir(lib1.main.path);
					cleanFile(lib1.main.tsconfig);
					cleanFile(lib1.eslint);
					resetFile(baiDefaults.tsconfig.main, tsconfigContent);
					resetFile(baiDefaults.eslint, eslintContent);
				}
			},
			result: async () => {
				expect(readFileSync(lib1.main.tsconfig, 'utf-8')).to.equal(tsconfigContent);
				expect(readFileSync(lib1.eslint, 'utf-8')).to.equal(eslintContent);
			}
		});
	});

	it('Should fallback to project-level tsconfig.json when BAI default is missing', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-2--lib-1',
			label: 'Test case 2 - lib-1 project fallback',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
			customTSConfig: false,
		});

		const fallbackTsConfig = '{"compilerOptions":{"target":"ES2022"}}';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					cleanFile(lib1.main.tsconfig);
					cleanFile(lib1.eslint);
					cleanFile(baiDefaults.tsconfig.main);
					resetFile(projectDefaultsPath, fallbackTsConfig);
					resetFile(baiDefaults.eslint, '{"root":true}');
				}
			},
			result: () => {
				expect(readFileSync(lib1.main.tsconfig, 'utf-8')).to.equal(fallbackTsConfig);
			}
		};
	});
	it('Should fail when neither bai-default nor project-level tsconfig exists', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-3--lib-1',
			label: 'Test case 3 - fail on missing defaults',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
			customTSConfig: false,
		});

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					cleanFile(lib1.main.tsconfig);
					cleanFile(lib1.eslint);
					cleanFile(baiDefaults.tsconfig.main);
					cleanFile(projectDefaultsPath);
					cleanFile(baiDefaults.eslint);
				},
				paths: {projectRoot: `${projectRoot}1`, baiDefaultsPath: `${pathTo_Default_BAI}1`}
			},
			error: {
				expected: 'Missing tsconfig template for source folder: main'
			}
		};
	});
	it('Should override existing tsconfig.json and .eslintrc.json unless customESLintConfig = true', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-4--lib-1',
			label: 'Test case 4 - override existing config files unless customESLintConfig=true',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
			customTSConfig: false,
		});

		const tsconfigContent = '{"compilerOptions":{"target":"ES2020"}}';
		const eslintContent = '{"root":true}';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					resetFile(lib1.main.tsconfig, 'JUNK');
					resetFile(lib1.eslint, 'JUNK');
					resetFile(baiDefaults.tsconfig.main, tsconfigContent);
					resetFile(baiDefaults.eslint, eslintContent);
				}
			},
			result: () => {
				expect(readFileSync(lib1.main.tsconfig, 'utf-8')).to.equal(tsconfigContent);
				expect(readFileSync(lib1.eslint, 'utf-8')).to.equal(eslintContent);
			}
		};
	});
	it('Should skip .eslintrc.json copy when customESLintConfig = true', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-5--lib-1',
			label: 'Test case 5 - custom ESLint config skips default copy',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: true,
			customTSConfig: false,
		});

		const tsconfigContent = '{"compilerOptions":{"target":"ES2020"}}';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					cleanFile(lib1.eslint);
					cleanFile(lib1.main.tsconfig);
					resetFile(lib1.main.tsconfig, tsconfigContent);
					resetFile(baiDefaults.tsconfig.main, tsconfigContent);
					resetFile(baiDefaults.eslint, '{"root":true}');
					ensureCustomESLint();
				}
			},
			result: () => {
				expect(readFileSync(lib1.main.tsconfig, 'utf-8')).to.equal(tsconfigContent);
			}
		};
	});
	it('Fails when customTSConfig=true and tsconfig.json is missing', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-6--lib-1',
			label: 'Test case 6 - should fail if customTSConfig=true and tsconfig.json is missing',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
			customTSConfig: true,
		});

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					cleanFile(lib1.main.tsconfig);
					cleanFile(lib1.eslint);
				}
			},
			error: {
				expected: 'Expected custom tsconfig in folder for source folder:'
			}
		};
	});
	it('Should copy tsconfig.json into each source subfolder (main/test)', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-7--lib-1',
			label: 'Test case 7 - tsconfig copied for each source folder',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
			customTSConfig: false,
		});

		const tsconfigMain = '{"compilerOptions":{"target":"ES2020"}}';
		const tsconfigTest = '{"compilerOptions":{"target":"ES2021"}}';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					ensureDir(lib1.test.path);
					cleanFile(lib1.main.tsconfig);
					cleanFile(lib1.test.tsconfig);
					resetFile(baiDefaults.tsconfig.main, tsconfigMain);
					resetFile(baiDefaults.tsconfig.test, tsconfigTest);
					resetFile(baiDefaults.eslint, '{"root":true}');
				}
			},
			result: () => {
				expect(readFileSync(lib1.main.tsconfig, 'utf-8')).to.equal(tsconfigMain);
				expect(readFileSync(lib1.test.tsconfig, 'utf-8')).to.equal(tsconfigTest);
			}
		};
	});
	it('Fails when customESLintConfig=true but .eslintrc.json is missing', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-8--lib-1',
			label: 'Test case 8 - fails if customESLintConfig=true and .eslintrc.json missing',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: true,
			customTSConfig: false,
		});

		const tsconfigContent = '{ "compilerOptions": { "target": "ES2020" } }';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					cleanFile(lib1.main.tsconfig);
					cleanFile(lib1.eslint);
					resetFile(baiDefaults.tsconfig.main, tsconfigContent);
					resetFile(baiDefaults.eslint, '{ "root": true }');
				}
			},
			error: {
				expected: 'Expected custom eslint.rc'
			}
		};
	});
	it('Fails if either ESLint or TSConfig is missing when both are custom', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-9--lib-1',
			label: 'Test case 9 - custom ESLint & TSConfig must exist',
			relativePath: `./${lib1.name}`,
			fullPath: lib1.path,
			output: 'dist',
			dependencies: {},
			customESLintConfig: true,
			customTSConfig: true,
		});

		const customTSConfig = '{ "compilerOptions": { "target": "ES2019" } }';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					resetFile(lib1.main.tsconfig, customTSConfig);
					cleanFile(lib1.eslint); // ← force failure
				}
			},
			error: {
				expected: 'Expected custom eslint.rc'
			}
		};
	});
	it('Should copy tsconfig only into test folder if main is missing', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-10', label: 'TSConfig copied only for test folder',
			relativePath: `./${lib1.name}`, fullPath: lib1.path, output: 'dist', dependencies: {},
			customESLintConfig: false, customTSConfig: false
		});

		const tsconfigTest = '{"compilerOptions": {"target": "ES2021"}}';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.test.path);
					cleanFile(lib1.test.tsconfig);
					cleanFile(lib1.main.tsconfig);
					if (existsSync(lib1.main.path))
						rmSync(lib1.main.path, {recursive: true, force: true});

					resetFile(baiDefaults.tsconfig.test, tsconfigTest);
				}
			},
			result: () => {
				expect(readFileSync(lib1.test.tsconfig, 'utf-8')).to.equal(tsconfigTest);
				expect(existsSync(lib1.main.tsconfig)).to.be.false;
			}
		};
	});
	it('Should use pre-existing tsconfig when customTSConfig = true', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-11', label: 'Custom TSConfig respected',
			relativePath: `./${lib1.name}`, fullPath: lib1.path, output: 'dist', dependencies: {},
			customESLintConfig: false, customTSConfig: true
		});

		const customTS = '{"compilerOptions": {"target": "ESNEXT"}}';

		return {
			input: {
				units: [unit],
				setup: () => {
					ensureDir(lib1.main.path);
					resetFile(lib1.main.tsconfig, customTS);
				}
			},
			result: () => {
				expect(readFileSync(lib1.main.tsconfig, 'utf-8')).to.equal(customTS);
			}
		};
	});
	it('Should use pre-existing .eslintrc.json when customESLintConfig = true', () => {
		const unit = new Unit_NodeLib({
			key: 'test-case-12', label: 'Custom ESLint respected',
			relativePath: `./${lib1.name}`, fullPath: lib1.path, output: 'dist', dependencies: {},
			customESLintConfig: true,
			customTSConfig: false
		});

		const customESLint = '{"rules": {"semi": ["error", "always"]}}';

		return {
			input: {
				units: [unit],
				setup: () => {
					resetFile(lib1.eslint, customESLint);
				}
			},
			result: () => {
				expect(readFileSync(lib1.eslint, 'utf-8')).to.equal(customESLint);
			}
		};
	});
	it('Should handle multiple units with mixed custom/default configs', () => {
		const unit1 = new Unit_NodeLib({
			key: 'test-case-13-lib1', label: 'Lib1',
			relativePath: `./${lib1.name}`, fullPath: lib1.path, output: 'dist', dependencies: {},
			customESLintConfig: false, customTSConfig: false
		});
		const unit2 = new Unit_NodeLib({
			key: 'test-case-13-lib2', label: 'Lib2',
			relativePath: './lib-2', fullPath: resolve(pathToPackages, 'lib-2'), output: 'dist', dependencies: {},
			customESLintConfig: true, customTSConfig: true
		});

		return {
			input: {
				units: [unit1, unit2],
				setup: () => {
					ensureDir(lib1.main.path);
					resetFile(lib1.eslint, '{"root": true}');
					resetFile(lib1.main.tsconfig, '{"compilerOptions": {"target": "ES5"}}');
					ensureDir(lib1.main.path);
					resetFile(lib2.eslint, '{"rules": {}}');
					resetFile(lib1.main.tsconfig, '{"compilerOptions": {"target": "ES2022"}}');
				}
			},
			result: () => {
				expect(readFileSync(lib1.main.tsconfig, 'utf-8')).to.contain('ES5');
				expect(readFileSync(resolve(pathToPackages, 'lib-2/src/main/tsconfig.json'), 'utf-8')).to.contain('ES2022');
			}
		};
	});
});


