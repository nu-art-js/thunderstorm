import {testSuiteTester} from "../../main/testing/consts";
import {TestSuite_Debounce} from "./cases/debounce";

export const UiToolsTests = {
    debounce: ()=> testSuiteTester(TestSuite_Debounce)
}

export function runAllUiToolsTests(){
    UiToolsTests.debounce();
}