import {Module} from "@nu-art/ts-common";
import {AuthModule} from "./AuthModule";
import {dialogflow_v2} from "googleapis";
import Params$Resource$Projects$Agent$Entitytypes$Entities$Batchcreate = dialogflow_v2.Params$Resource$Projects$Agent$Entitytypes$Entities$Batchcreate;
import Schema$GoogleCloudDialogflowV2EntityTypeEntity = dialogflow_v2.Schema$GoogleCloudDialogflowV2EntityTypeEntity;

type DialogFlowModuleConfig = {
	dialogFlowProject?: string
}
export class DialogFlowModule_Class
	extends Module<DialogFlowModuleConfig> {

	private dialogFlowApi!: dialogflow_v2.Dialogflow;

	protected init() {
		this.dialogFlowApi = new dialogflow_v2.Dialogflow(AuthModule.getAuth(this.config?.dialogFlowProject));
	}

	agent = {
		create: async (agentProjectId: string, name: string) => {
			this.logInfo(`Creating agent for project ${agentProjectId}`)
			const newTestAgent = {
				"parent": `projects/${agentProjectId}`,
				"displayName": name,
				"defaultLanguageCode": "en",
				"timeZone": "America/New_York",
				"enableLogging": true,
				"matchMode": "MATCH_MODE_HYBRID",
				"classificationThreshold": 0.7,
				"apiVersion": "API_VERSION_V2",
				"tier": "TIER_STANDARD"
			}

			await this.dialogFlowApi.projects.setAgent({parent: `projects/${agentProjectId}`, requestBody: newTestAgent});
			this.logInfo(`Created agent for project ${agentProjectId} with name: ${name}`);
		},
		train: async (agentProjectId: string) => {
			this.logInfo(`Train ${agentProjectId}`)
			return (await this.dialogFlowApi.projects.agent.train({parent: `projects/${agentProjectId}`})).data
		},
		export: async (agentProjectId: string) => {
			this.logInfo(`Exporting ${agentProjectId}`)
			return (await this.dialogFlowApi.projects.agent.export({parent: `projects/${agentProjectId}`})).data.response?.agentContent
		},
		restore: async (agentProjectId: string, agentContent: string) => {
			this.logInfo(`Restoring ${agentProjectId}`)
			return (await this.dialogFlowApi.projects.agent.restore({parent: `projects/${agentProjectId}`, requestBody: {agentContent}})).data
		},
		import: async (agentProjectId: string, agentContent: string) => {
			this.logInfo(`Importing ${agentProjectId}`)
			return (await this.dialogFlowApi.projects.agent.import({parent: `projects/${agentProjectId}`, requestBody: {agentContent}})).data
		},
		copy: async (fromAgent: string, toAgent: string) => {
			this.logInfo(`Merging agent ${fromAgent} => ${toAgent}`)
			const content: string = await DialogFlowModule.agent.export(fromAgent);
			if (content)
				await DialogFlowModule.agent.import(toAgent, content);
		},
		override: async (fromAgent: string, toAgent: string) => {
			this.logInfo(`Overriding agent ${fromAgent} => ${toAgent}`)
			const content: string = await DialogFlowModule.agent.export(fromAgent);
			if (content)
				await DialogFlowModule.agent.restore(toAgent, content);
		}
	}

	intent = {
		list: async (agentProjectId: string) => {
			this.logInfo(`List intents of ${agentProjectId}`)
			return (await this.dialogFlowApi.projects.agent.intents.list({parent: `projects/${agentProjectId}`})).data;
		},
	}

	entity = {
		createEntities: async (agentProjectId: string, entityId: string, entityList: Schema$GoogleCloudDialogflowV2EntityTypeEntity[]) => {
			const request: Params$Resource$Projects$Agent$Entitytypes$Entities$Batchcreate = {
				parent: entityId,
				requestBody: {
					entities: entityList
				}
			}
			return (await this.dialogFlowApi.projects.agent.entityTypes.entities.batchCreate(request)).data
		},

		createEntityType: async (agentProjectId: string, entityName: string) => {
			const pathString: string = `projects/${agentProjectId}/agent`
			const entityTypeList = await this.dialogFlowApi.projects.agent.entityTypes.list({parent: pathString});
			const foundType: dialogflow_v2.Schema$GoogleCloudDialogflowV2EntityType | undefined = entityTypeList.data?.entityTypes?.find(
				entityType => entityType.displayName === entityName)

			if (foundType)
				return foundType.name

			const request = {
				parent: pathString,
				requestBody: {
					"displayName": `${entityName}`,
					"enableFuzzyExtraction": false,
					"kind": "KIND_MAP",
				}
			}
			return (await this.dialogFlowApi.projects.agent.entityTypes.create(request)).data.name
		},
	}
}


export const DialogFlowModule = new DialogFlowModule_Class();