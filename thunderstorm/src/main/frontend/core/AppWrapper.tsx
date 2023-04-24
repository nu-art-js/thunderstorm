/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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
import {BrowserRouter, MemoryRouter} from 'react-router-dom';
import {Thunder} from './Thunder';
import {ImplementationMissingException} from '@nu-art/ts-common';
import * as RDC from 'react-dom/client';
import {ThunderAppWrapperProps} from './types';
import {TS_Route} from '../modules/routing/types';
import {ComponentSync} from './ComponentSync';
import {stopPropagation} from '../utils/tools';
import {ModuleFE_RoutingV2} from '../modules/routing/ModuleFE_RoutingV2';
import {TS_DialogOverlay} from '../components/TS_Dialog';
import {TS_PopUpOverlay} from '../components/TS_PopupMenu';
import {TS_TooltipOverlay} from '../components/TS_Tooltip';
import {TS_ToastOverlay} from '../components/TS_Toaster';
import {TS_Notifications} from '../components/TS_Notifications';
import {TS_MemoryMonitor} from '../components/TS_MemoryMonitor';


export function renderApp() {
	const appJsx = Thunder.getInstance().renderApp();
	if (!appJsx)
		throw new ImplementationMissingException('Could not get app from Thunder!');

	//Set root div and its attributes
	const rootDiv = document.createElement('div');
	rootDiv.classList.add('match_parent');
	rootDiv.setAttribute('id', 'root');
	document.body.appendChild(rootDiv);

	//Set app root
	const root = RDC.createRoot(rootDiv);
	root.render(appJsx);
}

export function appWithBrowserRouter(props: ThunderAppWrapperProps) {
	const MainApp = props.element;
	return <BrowserRouter><MainApp/></BrowserRouter>;
}

export function appWithMemoryRouter(props: ThunderAppWrapperProps) {
	const MainApp = props.element;
	return <MemoryRouter><MainApp/></MemoryRouter>;
}

export function appWithJSX(props: ThunderAppWrapperProps<any>) {
	const MainApp = props.element;
	return <MainApp {...props.props}/>;
}

export class ThunderstormApp
	extends ComponentSync<{ rootRoute: TS_Route, additionalOverlays?: React.ReactNode[] }> {

	public static blockEvent<T>(ev: React.DragEvent<T>) {
		ev.preventDefault();
		ev.stopPropagation();
	}

	protected deriveStateFromProps(nextProps: {}) {
		return {};
	}

	render() {
		// @ts-ignore
		const blockRightClick = !Thunder.getInstance().config.isDebug;

		return (
			<div id="app" onDrop={stopPropagation} onDragOver={stopPropagation} onContextMenu={blockRightClick ? stopPropagation : undefined}>
				{ModuleFE_RoutingV2.generateRoutes(this.props.rootRoute)}
				<TS_DialogOverlay/>
				<TS_PopUpOverlay/>
				<TS_TooltipOverlay/>
				<TS_ToastOverlay/>
				<TS_Notifications/>
				<TS_MemoryMonitor/>
				{this.props.additionalOverlays?.map(Overlay => Overlay)}
			</div>);
	}
}