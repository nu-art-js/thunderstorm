@Library('dev-tools@pipeline')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.workflow.Pipeline_BaseProxy
import com.nu.art.pipeline.workflow.Workflow
import com.nu.art.pipeline.workflow.WorkflowModule

class Pipeline_ThunderstormProxy
	extends Pipeline_BaseProxy<Pipeline_ThunderstormProxy> {

	Pipeline_ThunderstormProxy() {
		super("proxy", [SlackModule.class] as Class<? extends WorkflowModule>[])
	}

	@Override
	protected void init() {
		getModule(SlackModule.class).setDefaultChannel("thunderstorm")

		declareJob("dev", "thunderstorm--DEV")
		declareJob("staging", "thunderstorm--STAGING")
		declareJob("prod", "thunderstorm--PROD")

		super.init()
	}
}


node() {
	Workflow.createWorkflow(Pipeline_ThunderstormProxy.class, this)
}

