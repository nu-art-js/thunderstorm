@Library('dev-tools')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.modules.build.BuildModule
import com.nu.art.pipeline.modules.build.TriggerCause
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

//		getRepo().assertCommitDiffs()
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
}

node() {
	Workflow.createWorkflow(Pipeline_Build.class, this)
}
