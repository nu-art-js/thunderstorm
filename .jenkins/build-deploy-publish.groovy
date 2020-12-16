@Library('dev-tools')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.thunderstorm.Pipeline_ThunderstormMain
import com.nu.art.pipeline.workflow.Workflow

class Pipeline_Build
	extends Pipeline_ThunderstormMain<Pipeline_Build> {

		Pipeline_Build() {
			super("Thunderstorm", "thunderstorm", SlackModule.class)
		}

		@Override
		protected void init() {
			declareEnv("dev", "thunderstorm-dev")
			declareEnv("staging", "thunderstorm-staging")
			declareEnv("prod", "nu-art-thunderstorm")
			setGitRepoId("nu-art-js/thunderstorm", true)
			super.init()
		}
}

node() {
	Workflow.createWorkflow(Pipeline_Build.class, this)
}
