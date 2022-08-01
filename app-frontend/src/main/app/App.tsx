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

import * as React from 'react';
import {ComponentSync, RoutingModule, TS_DialogOverlay, TS_PopupMenuOverlay, TS_ToastOverlay, WrapperProps} from '@nu-art/thunderstorm/frontend';

import {VersionOnScreen} from '@components/VersionOnScreen';
import {registerRoutes} from './Routes';
import {ModuleFE_Account, OnLoginStatusUpdated} from '@nu-art/user-account/frontend';


export class App
	extends ComponentSync<WrapperProps>
	implements OnLoginStatusUpdated {

	public static dropBlocker<T>(ev: React.DragEvent<T>) {
		ev.preventDefault();
		ev.stopPropagation();
	}

	protected deriveStateFromProps(nextProps: WrapperProps) {
		return {};
	}

	__onLoginStatusUpdated = () => {
		const status = ModuleFE_Account.getLoggedStatus();
		console.log('status update', status);
	};

	render() {
		registerRoutes();
		return (
			<div onDrop={App.dropBlocker} onDragOver={App.dropBlocker}>
				{/*<BugReport>*/}
				{RoutingModule.getRoutesMap()}
				{/*</BugReport>*/}
				<VersionOnScreen/>
				<TS_DialogOverlay/>
				<TS_ToastOverlay/>
				<TS_PopupMenuOverlay/>
			</div>);
	}
}

