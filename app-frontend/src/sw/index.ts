/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const config = {
	PushPubSubModule: {
		config: {
			apiKey: "AIzaSyCoQjoQibuydMi1ejlpobfgHOI7WMf11P8",
			authDomain: "nu-art-thunderstorm.firebaseapp.com",
			projectId: "nu-art-thunderstorm",
			messagingSenderId: "992823653177",
			appId: "1:992823653177:web:e289e37f159c1b56de6ee8"
		}
	}
};
import {ServiceWorker} from '@nu-art/thunderstorm/sw';
import {PushPubSubModule} from "@nu-art/push-pub-sub/sw";

new ServiceWorker()
	.setConfig(config)
	.addModules(PushPubSubModule)
	.build();

export default null;