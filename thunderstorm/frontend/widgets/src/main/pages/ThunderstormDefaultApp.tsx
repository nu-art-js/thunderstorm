import {ComponentSync} from './ComponentSync.js';
import {TS_Route} from '../modules/routing/types.js';
import * as React from 'react';
import {generateUUID} from '@nu-art/ts-common';
import {Thunder} from '@nu-art/web-client//Thunder.js';
import {stopPropagation} from '../utils/tools.js';
import {ModuleFE_RoutingV2} from '../modules/routing/ModuleFE_RoutingV2.js';
import {TS_DialogOverlay} from '../components/TS_Dialog/index.js';
import {TS_PopUp, TS_ToolTip} from '../components/TS_MouseInteractivity/index.js';
import {TS_ToastOverlay} from '../components/TS_Toaster/index.js';
import {TS_Notifications} from '../components/TS_Notifications/index.js';
import {TS_MemoryMonitor} from '../components/TS_MemoryMonitor/index.js';


export class ThunderstormDefaultApp
	extends ComponentSync<{ rootRoute: TS_Route, additionalOverlays?: React.ElementType[] }> {

	public static blockEvent<T>(ev: React.DragEvent<T>) {
		ev.preventDefault();
		ev.stopPropagation();
	}

	public getAdditionalOverlayRenderer(overlay: React.ElementType) {
		const Renderer = overlay;

		return <Renderer key={generateUUID()}/>;
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
				<TS_PopUp/>
				<TS_ToolTip/>
				<TS_ToastOverlay/>
				<TS_Notifications/>
				<TS_MemoryMonitor/>
				{this.props.additionalOverlays?.map(Overlay => this.getAdditionalOverlayRenderer(Overlay))}
			</div>);
	}
}