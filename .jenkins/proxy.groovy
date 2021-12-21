@Library('dev-tools@pipeline')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.modules.build.BuildModule
import com.nu.art.pipeline.modules.docker.DockerModule
import com.nu.art.pipeline.modules.git.GitModule
import com.nu.art.pipeline.workflow.BasePipeline
import com.nu.art.pipeline.workflow.Workflow
import com.nu.art.pipeline.workflow.variables.VarConsts
import com.nu.art.pipeline.workflow.variables.Var_Env

class Pipeline_Router
	extends BasePipeline<Pipeline_Router> {

	public Var_Env Env_Branch = new Var_Env("BRANCH_NAME")

	Pipeline_Router() {
		super("Thunderstorm-Proxy", SlackModule.class, DockerModule.class, GitModule.class)
		setDisplayName()
	}

	@Override
	protected void init() {
		getModule(SlackModule.class).setDefaultChannel("thunderstorm")
		super.init()
	}

	protected void setDisplayName() {
		getModule(BuildModule.class).setDisplayName("#${VarConsts.Var_BuildNumber.get()}: ${name}")
	}

	@Override
	void pipeline() {
		run("something", { logDebug("something") })
//		checkout({
//			getModule(SlackModule.class).setOnSuccess(getRepo().getChangeLog().toSlackMessage())
//		})
	}
//
//	GitRepo getRepo() {
//		return repo
//	}
//
//	@Override
//	void _postInit() {
//		TriggerCause[] causes = getModule(BuildModule.class).getTriggerCause(TriggerCause.Type_SCM)
//		this.logInfo("GOT HERE!! ${causes.size()}")
//		TriggerCause cause = causes.find { it.originator == "Nu-Art-Jenkins" }
//		causes.each {
//			this.logInfo("Detected SCM cause: '${it.originator}'")
//		}
//
//		if (cause) {
//			workflow.terminate("Detected push from Jenkins")
//		}
//
//		super.postInit()
//	}
//
//	T checkout(Closure postCheckout) {
//		if (repo)
//			addStage("checkout", {
//				getRepo().cloneRepo()
//				getRepo().cloneSCM()
//				if (postCheckout)
//					postCheckout()
//			})
//		return (T) this
//	}

	Pipeline_Router run(String name, Closure toRun) {
		addStage(name, { toRun() })
		return this
	}
//
//	String _sh(GString command, readOutput = false) {
//		return _sh(command.toString(), readOutput)
//	}
//
//	String _sh(String command, readOutput = false) {
//		if (docker)
//			return docker.sh(command, "${VarConsts.Var_Workspace.get()}/${repo.getOutputFolder()}")
//
//		return repo.sh(command, readOutput)
//	}
//
//	@Override
//	void cleanup() {
//		if (docker)
//			docker.kill()
//
//		super.cleanup()
//	}

}

node() {
	Workflow.createWorkflow(Pipeline_Router.class, this)
}

