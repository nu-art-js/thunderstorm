import * as React from 'react';
import {generateUUID} from '@nu-art/ts-common';
import {TS_DialogOverlay} from '../dialog/TS_DialogOverlay.js';
import {TS_ToastOverlay} from '../toaster/global/TS_ToastOverlay.js';
import {TS_MemoryMonitor} from '../_utils/TS_MemoryMonitor/TS_MemoryMonitor.js';
import {ComponentSync} from '../_core/ComponentSync.js';
import {ModuleFE_Routing, TS_Route} from '@nu-art/thunder-routing';
import {stopPropagation, Thunder} from '@nu-art/thunder-core';

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
		const blockRightClick = !(Thunder.getInstance().getConfig() as { isDebug?: boolean }).isDebug;

		return (
			<div id="app" onDrop={stopPropagation} onDragOver={stopPropagation} onContextMenu={blockRightClick ? stopPropagation : undefined}>
				{ModuleFE_Routing.generateRoutes(this.props.rootRoute)}
				<TS_DialogOverlay/>
				<TS_ToastOverlay/>
				<TS_MemoryMonitor/>
				{this.props.additionalOverlays?.map(Overlay => this.getAdditionalOverlayRenderer(Overlay))}
			</div>);
	}
}