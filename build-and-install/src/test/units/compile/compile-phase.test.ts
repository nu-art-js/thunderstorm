import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {Unit_NodeLib} from '../../_common';
import {resolve} from 'path';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'fs';
import {expect} from 'chai';

const pathToWorkspace = resolve(__dirname, 'workspace');
const pathToPackages = resolve(pathToWorkspace, 'packages');

const libCompile = mapLibFileSystem('lib-compile');

const packageJsonDist = {name: 'lib-compile', version: '1.0.0'};
const tsConfigContent = JSON.stringify({compilerOptions: {target: 'ES2020'}}, null, 2);

function mapLibFileSystem(libName: string) {
  const path = resolve(pathToPackages, libName);
  const srcMain = resolve(path, 'src/main');
  const srcTest = resolve(path, 'src/test');

  return {
    name: libName,
    path,
    eslint: resolve(path, '.eslintrc.json'),
    main: {
      path: srcMain,
      tsconfig: resolve(srcMain, 'tsconfig.json'),
    },
    test: {
      path: srcTest,
      tsconfig: resolve(srcTest, 'tsconfig.json'),
    },
  };
}

function ensureDir(path: string) {
  try { mkdirSync(path, {recursive: true}); } catch {}
}

function clean(path: string) {
  try { rmSync(path, {recursive: true, force: true}); } catch {}
}

function writeTSConfig() {
  writeFileSync(libCompile.main.tsconfig, tsConfigContent);
}

function writeDummyTSFile() {
  writeFileSync(resolve(libCompile.main.path, 'index.ts'), 'export const x = 5;');
}

type Input = { prepare: () => void };
type Output = () => void;

export const TestSuite_CompilePhase: TestSuite<Input, Output> = {
  label: 'Unit_NodeLib - Compile Phase',
  testcases: [
    {
      description: 'Compiles with valid tsconfig and outputs JS to dist/',
      input: {
        prepare: () => {
          clean(libCompile.path + '/dist');
          ensureDir(libCompile.main.path);
          writeTSConfig();
          writeDummyTSFile();
        }
      },
      result: () => {
        const compiledJS = resolve(libCompile.path, 'dist/index.js');
        expect(existsSync(compiledJS)).to.be.true;
      }
    },
    {
      description: 'Creates output folder if it does not exist',
      input: {
        prepare: () => {
          clean(libCompile.path + '/dist');
          ensureDir(libCompile.main.path);
          writeTSConfig();
          writeDummyTSFile();
        }
      },
      result: () => {
        expect(existsSync(resolve(libCompile.path, 'dist'))).to.be.true;
      }
    }
  ],

  processor: async (testCase) => {
    const {prepare} = testCase.input;
    prepare();

    const unit = new Unit_NodeLib({
      key: libCompile.name,
      label: libCompile.name,
      relativePath: `./${libCompile.name}`,
      fullPath: libCompile.path,
      output: resolve(libCompile.path, 'dist'),
      dependencies: {},
      customTSConfig: true
    });

    (unit as any).packageJson = {dist: packageJsonDist};

    await unit.compile();

    if ('error' in testCase) {
      expect(() => {}).to.throw(testCase.error.expected); // Placeholder if needed later
      return;
    }

    testCase.result();
  }
};

describe('Unit_NodeLib - Compile Phase', () => testSuiteTester(TestSuite_CompilePhase));


