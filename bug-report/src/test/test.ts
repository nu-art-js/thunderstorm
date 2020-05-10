import {__scenario} from "@nu-art/testelot";
import {JiraModule} from "../main/app-backend/modules/JiraModule";
import {Tester} from "./_core/Tester";
import {issueScenario} from "./jira/issue";

const mainScenario = __scenario("Bug Report Testing");
mainScenario.add(issueScenario);

const noa_email = 'noabkr@intuitionrobotics.com';
const noa_key = 'bQfDHHtlLbHUIwSxklRa715A';
JiraModule.setDefaultConfig({auth:{email: noa_email, apiKey: noa_key}});

module.exports = new Tester()
	.addModules(JiraModule)
	.setScenario(mainScenario)
	.build();