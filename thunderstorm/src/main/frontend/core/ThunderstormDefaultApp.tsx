import {ComponentSync} from './ComponentSync';
import {TS_Route} from '../modules/routing/types';
import * as React from 'react';
import {generateUUID} from '@nu-art/ts-common';
import {Thunder} from './Thunder';
import {stopPropagation} from '../utils/tools';
import {ModuleFE_RoutingV2} from '../modules/routing/ModuleFE_RoutingV2';
import {TS_DialogOverlay} from '../components/TS_Dialog';
import {TS_PopUpOverlay} from '../components/TS_PopupMenu';
import {TS_TooltipOverlay} from '../components/TS_Tooltip';
import {TS_ToastOverlay} from '../components/TS_Toaster';
import {TS_Notifications} from '../components/TS_Notifications';
import {TS_MemoryMonitor} from '../components/TS_MemoryMonitor';


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
				<TS_PopUpOverlay/>
				<TS_TooltipOverlay/>
				<TS_ToastOverlay/>
				<TS_Notifications/>
				<TS_MemoryMonitor/>
				{this.props.additionalOverlays?.map(Overlay => this.getAdditionalOverlayRenderer(Overlay))}
			</div>);
	}
}