@Library('dev-tools@pipeline')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.workflow.Pipeline_BaseRouter
import com.nu.art.pipeline.workflow.Workflow
import com.nu.art.pipeline.workflow.WorkflowModule

class Pipeline_ThunderstormRouter
	extends Pipeline_BaseRouter<Pipeline_ThunderstormRouter> {

	Pipeline_ThunderstormRouter() {
		super("proxy", [SlackModule.class] as Class<? extends WorkflowModule>[])
	}

	@Override
	protected void init() {
		getModule(SlackModule.class).setDefaultChannel("thunderstorm")

		declareJob("dev", "thunderstorm--DEV")
		declareJob("staging", "thunderstorm--STAGING")
		declareJob("master", "thunderstorm--PROD")

		super.init()
	}
}


node() {
	Workflow.createWorkflow(Pipeline_ThunderstormRouter.class, this)
}

