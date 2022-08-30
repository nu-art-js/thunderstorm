import {Module} from "@nu-art/ts-common";
import {PubSub} from "@google-cloud/pubsub";
import {PublishOptions} from "@google-cloud/pubsub/build/src/topic";
import {ModuleBE_Auth} from "./ModuleBE_Auth";
import {GoogleAuth} from "google-auth-library";

class ModuleBE_GooglePubSub_Class
	extends Module {

	project(projectId: string, authKey = projectId) {
		const authObject = ModuleBE_Auth.getAuth(authKey, []);
		const auth: GoogleAuth = authObject.auth;

		// @ts-ignore
		const pubSub = new PubSub({projectId, auth});
		return {
			createTopic: async (topicName: string) => {
				const [topic] = await pubSub.createTopic(topicName);
				return topic;
			},
			topic: (topicName: string, options?: PublishOptions) => {
				const topic = pubSub.topic(topicName, options);
				return {
					publishJson: async (json: object) => topic.publishJSON(json),
					publish: async (buffer: Buffer) => topic.publish(buffer)
				};
			}
		};
	}
}

export const ModuleBE_GooglePubSub = new ModuleBE_GooglePubSub_Class();