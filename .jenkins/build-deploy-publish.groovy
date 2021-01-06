@Library('dev-tools')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.modules.git.Cli
import com.nu.art.pipeline.thunderstorm.Pipeline_ThunderstormMain
import com.nu.art.pipeline.workflow.Workflow
import com.nu.art.pipeline.workflow.variables.Var_Creds
import com.nu.art.pipeline.workflow.variables.Var_Env

class Pipeline_Build
	extends Pipeline_ThunderstormMain<Pipeline_Build> {

	public Var_Env Env_SecretNPM = new Var_Env("NPM_SECRET")
	public Var_Creds Creds_SecretNPM = new Var_Creds("string", "npm_token", Env_SecretNPM)

	Pipeline_Build() {
		super("Thunderstorm", "thunderstorm", SlackModule.class)
	}

	@Override
	protected void init() {
		setRequiredCredentials(Creds_SecretNPM)

		declareEnv("dev", "ir-thunderstorm-dev")
		declareEnv("staging", "ir-thunderstorm-staging")
		declareEnv("prod", "ir-thunderstorm")
		setGitRepoId("intuition-robotics/thunderstorm", true)
		super.init()
	}

	@Override
	void pipeline() {
//		super.pipeline()
		checkout({
			getModule(SlackModule.class).setOnSuccess(getRepo().getChangeLog().toSlackMessage())
		})

		install()
		clean()
		build()
//		test()

//		deploy()

		addStage("Auth NPM", {
			Cli cli = new Cli("#!/bin/bash")
				.append("source \"\$HOME/.nvm/nvm.sh\"")
				.append("nvm use")
				.append('npm config set "@intuitionrobotics:registry" https://npm.intuitionrobotics.com/')
				.append("npm config set \"${Env_SecretNPM.get()}\"")
			getRepo().sh(cli)
		})
		publish()
	}
}

node() {
	Workflow.createWorkflow(Pipeline_Build.class, this)
}
