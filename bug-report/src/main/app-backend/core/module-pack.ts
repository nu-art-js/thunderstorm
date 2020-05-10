import {BugReportModule} from "../modules/BugReportModule";
import {JiraModule} from "../modules/JiraModule";
import {AdminBRModule} from "../modules/AdminBRModule";

export const Backend_ModulePack_BugReport = [
    BugReportModule,
    JiraModule,
    AdminBRModule
];

export * from "../modules/AdminBRModule"
export * from "../modules/BugReportModule"
export * from "../modules/JiraModule"