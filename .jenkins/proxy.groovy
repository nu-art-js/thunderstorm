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

	private static Class<? extends WorkflowModule>[] defaultModules = [SlackModule.class]
	public Var_Env Env_Branch = new Var_Env("BRANCH_NAME")
	def envJobs = [:]

	Pipeline_Router() {
		super("proxy", defaultModules)
	}

	Pipeline_Router(Class<? extends WorkflowModule>... modules) {
		super("proxy", defaultModules + modules)
	}

	Pipeline_Router(String name, Class<? extends WorkflowModule>... modules = []) {
		super(name, defaultModules + modules)
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
			JobTrigger trigger = new JobTrigger(workflow, jobName)
			def result = trigger.run()
			getModule(BuildModule.class).setResult(result.result)
		})
	}
}


class Pipeline_ThunderstormRouter
	extends BasePipeline<Pipeline_ThunderstormRouter> {

	public Var_Env Env_Branch = new Var_Env("BRANCH_NAME")
	def envJobs = [:]

	Pipeline_ThunderstormRouter() {
		super("proxy", [SlackModule.class] as Class<? extends WorkflowModule>[])
	}

	@Override
	protected void init() {
		declareJob("dev", "thunderstorm--DEV")
		declareJob("staging", "thunderstorm--STAGING")
		declareJob("master", "thunderstorm--PROD")

		getModule(SlackModule.class).setDefaultChannel("thunderstorm")
		super.init()
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
			JobTrigger trigger = new JobTrigger(workflow, jobName)
			def result = trigger.run()
			getModule(BuildModule.class).setResult(result.result)
		})
	}

}


node() {
	Workflow.createWorkflow(Pipeline_ThunderstormRouter.class, this)
}

