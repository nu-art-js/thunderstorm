import { BaseStorm } from "@nu-art/thunderstorm/app-backend/core/BaseStorm";
import { Scenario } from "@nu-art/testelot";
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
