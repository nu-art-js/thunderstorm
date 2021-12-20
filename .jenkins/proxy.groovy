@Library('dev-tools@pipeline')

import com.nu.art.pipeline.modules.SlackModule
import com.nu.art.pipeline.modules.build.BuildModule
import com.nu.art.pipeline.modules.docker.DockerModule
import com.nu.art.pipeline.modules.git.GitModule
import com.nu.art.pipeline.workflow.BasePipeline
import com.nu.art.pipeline.workflow.Workflow

class Pipeline_Router
	extends BasePipeline<Pipeline_Router> {
//	protected GitRepo repo

	Pipeline_Router() {
		super("Thunderstorm-Proxy", SlackModule.class, DockerModule.class, GitModule.class)
	}

	@Override
	protected void init() {
		getModule(SlackModule.class).setDefaultChannel("thunderstorm")
		super.init()

		getModule(BuildModule.class).printCauses();
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

