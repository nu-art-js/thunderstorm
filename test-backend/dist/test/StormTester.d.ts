import { BaseStorm } from "@intuitionrobotics/thunderstorm/app-backend/core/BaseStorm";
import { Scenario } from "@intuitionrobotics/testelot";
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
