import { BaseStorm } from "@ir/thunderstorm/app-backend/core/BaseStorm";
import { Scenario } from "@ir/testelot";
export declare class StormTester extends BaseStorm {
    private function;
    private scenario?;
    private reporter;
    constructor();
    setScenario(scenario: Scenario): this;
    build(): {
        test: any;
    };
    private startServerImpl;
}
