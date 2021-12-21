@Library('dev-tools@pipeline')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.modules.build.BuildModule
import com.nu.art.pipeline.modules.build.JobTrigger
import com.nu.art.pipeline.workflow.BasePipeline
import com.nu.art.pipeline.workflow.Workflow
import com.nu.art.pipeline.workflow.WorkflowModule
import com.nu.art.pipeline.workflow.variables.VarConsts
import com.nu.art.pipeline.workflow.variables.Var_Env

abstract class Pipeline_Router<T extends Pipeline_Router>
	extends BasePipeline<T> {

	public Var_Env Env_Branch = new Var_Env("BRANCH_NAME")
	def envJobs = [:]

	Pipeline_Router() {
		super("proxy", ([SlackModule.class] as Class<? extends WorkflowModule>[]) as Class<? extends WorkflowModule>[])
	}

	Pipeline_Router(Class<? extends WorkflowModule>... modules) {
		super("proxy", (([SlackModule.class] as Class<? extends WorkflowModule>[]) + modules) as Class<? extends WorkflowModule>[])
	}

	Pipeline_Router(String name, Class<? extends WorkflowModule>... modules) {
		super(name, (([SlackModule.class] as Class<? extends WorkflowModule>[]) + modules) as Class<? extends WorkflowModule>[])
	}

	void declareJob(String branch, String jobName) {
		envJobs.put(branch, jobName)
	}

	void setDisplayName() {
		def branch = Env_Branch.get()
		getModule(BuildModule.class).setDisplayName("#${VarConsts.Var_BuildNumber.get()}: ${getName()}-${branch}")
	}

	@Override
	void pipeline() {
		addStage("running", {
			def branch = Env_Branch.get()
			def jobName = (String) envJobs[branch]
			new JobTrigger(workflow, jobName).setWait(false).run()
		})
	}
}


class Pipeline_ThunderstormRouter
	extends Pipeline_Router<Pipeline_ThunderstormRouter> {

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

