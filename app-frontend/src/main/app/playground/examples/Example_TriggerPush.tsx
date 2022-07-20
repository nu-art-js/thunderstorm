/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import * as React from 'react';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import {_setTimeout, Second} from '@nu-art/ts-common';
import {ExampleModule} from '@modules/ExampleModule';
import {ModuleFE_PushPubSub} from '@nu-art/push-pub-sub/frontend';
import {BaseSubscriptionData, DB_Notifications} from '@nu-art/push-pub-sub/shared/types';

export type State = {
	notifications: DB_Notifications[]
}

class Example_TriggerPush_Renderer
	extends ComponentSync<{}, State> {

	protected deriveStateFromProps(nextProps: {}): State {
		return {notifications: []};
	}

	render() {
		return <div className={'ll_h_v'}>
			<button onClick={ModuleFE_PushPubSub.requestPermissions}>request permissions</button>
			<button onClick={() => this.registerForPush()}>Register</button>
			<button onClick={() => this.triggerPush()}>Trigger Push</button>
			<button onClick={() => this.triggerPush(Second)}>Trigger Delayed Push</button>
			{this.state.notifications.map(_notification => <div>{_notification.read.toString()}</div>)}
		</div>;
	}

	private triggerPush(timeout?: number) {
		return _setTimeout(() => {
			ExampleModule.testPush();
		}, timeout);
	}

	private registerForPush() {
		const mySubscriptions: BaseSubscriptionData[] = [{
			pushKey: 'key',
			props: {a: 'prop'}
		}, {
			pushKey: 'test',
			props: {id: 'test1'}
		}];
		ModuleFE_PushPubSub.v1.registerAll(mySubscriptions);
	}
}

export const Example_TriggerPush = {renderer: Example_TriggerPush_Renderer, name: 'Trigger Push'};