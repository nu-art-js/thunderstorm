import * as React from 'react';
import {generateUUID} from '@nu-art/ts-common';
import {TS_DialogOverlay} from '../components/TS_Dialog/index.js';
import {TS_ToastOverlay} from '../components/TS_Toaster/index.js';
import {TS_Notifications} from '../components/TS_Notifications/index.js';
import {TS_MemoryMonitor} from '../components/TS_MemoryMonitor/index.js';
import {ComponentSync} from '../core/ComponentSync.js';
import {ModuleFE_Routing, TS_Route} from '@nu-art/thunder-routing';
import {stopPropagation} from '@nu-art/thunder-core';
import {TS_PopUp, TS_ToolTip} from '../components/TS_MouseInteractivity/index.js';


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
				{ModuleFE_Routing.generateRoutes(this.props.rootRoute)}
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