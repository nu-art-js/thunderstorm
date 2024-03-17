import {runAllArrayToolsTests} from './array-tools/tests';
import {runAllMergeToolsTests} from './merge-tools/tests';
import {runAllObjectToolsTests} from './object-tools/tests';
import {runAllUiToolsTests} from './ui-tools/tests';
// import './queue/test';
import {runCSVTests} from './csv/test';

runAllArrayToolsTests();
runAllObjectToolsTests();
runAllMergeToolsTests();
runAllUiToolsTests();
runCSVTests();