@Library('dev-tools@pipeline')

import com.nu.art.pipeline.modules.ModuleBE_Slack
import com.nu.art.pipeline.modules.build.BuildModule
import com.nu.art.pipeline.modules.build.TriggerCause
import com.nu.art.pipeline.thunderstorm.Pipeline_ThunderstormMain
import com.nu.art.pipeline.workflow.Workflow
import com.nu.art.pipeline.workflow.variables.Var_Creds
import com.nu.art.pipeline.workflow.variables.Var_Env

class Pipeline_Build
	extends Pipeline_ThunderstormMain<Pipeline_Build> {

	public Var_Env Var_TestingAccount = new Var_Env("SERVICE_ACCOUNT")
	public Var_Creds Cred_ServiceAccount = new Var_Creds("string", "", Var_TestingAccount)

	Pipeline_Build() {
		super("Thunderstorm", "thunderstorm", ModuleBE_Slack.class)
	}

	@Override
	protected void init() {
//		setRequiredCredentials(Cred_ServiceAccount)
		getModule(ModuleBE_Slack.class).setTeam("nu-art")

		declareEnv("dev", "thunderstorm-dev")
		declareEnv("staging", "thunderstorm-staging")
		declareEnv("prod", "nu-art-thunderstorm")
		setGitRepoId("nu-art-js/thunderstorm", true)

		super.init()
	}

	@Override
	void _postInit() {
		TriggerCause[] causes = getModule(BuildModule.class).getTriggerCause(TriggerCause.Type_SCM)
		this.logInfo("GOT HERE!! ${causes.size()}")
		TriggerCause cause = causes.find { it.originator == "Nu-Art-Jenkins" }
		causes.each {
			this.logInfo("Detected SCM cause: '${it.originator}'")
		}

		if (cause) {
			workflow.terminate("Detected push from Jenkins")
		}

		super.postInit()
	}

	@Override
	protected void _test() {
	}
}

node() {
	Workflow.createWorkflow(Pipeline_Build.class, this)
}

