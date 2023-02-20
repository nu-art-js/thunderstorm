import {TestSuit_V2} from "@nu-art/ts-common";
import {ModelDb} from "../test/add-data";

export type TestSuit_TS_addData = TestSuit_V2<ModelDb, any>

export type TestSuit_TS_scenarioUpdate<T extends any = any> = TestSuit_V2<{ obj1: T, obj2: T }, T>

export type TestSuit_TS_removeData = TestSuit_V2<any, any>
