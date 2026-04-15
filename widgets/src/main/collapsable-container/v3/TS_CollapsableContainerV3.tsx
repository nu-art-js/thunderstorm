import * as React from 'react';
import {useCallback, useState} from 'react';
import '../v2/TS_CollapsableContainerV2.scss';
import {_className} from '@nu-art/thunder-core';
import {LL_H_C, LL_V_L} from '../../layouts/v1/Layouts.js';
import {exists, resolveContent} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import type {Props_TS_CollapsableContainerV2} from '../v2/TS_CollapsableContainerV2.js';

export type {Props_TS_CollapsableContainerV2} from '../v2/TS_CollapsableContainerV2.js';

/**
 * Function component implementation of TS_CollapsableContainerV2 — same API surface.
 */
export function TS_CollapsableContainerV3(props: Props_TS_CollapsableContainerV2) {
	const {
					headerRenderer,
					containerRenderer,
					customCaret,
					onCollapseToggle,
					collapsed: controlledCollapsed,
					initialCollapsed = true,
					className,
					style,
					id,
					onHeaderRightClick,
					animated         = false,
					innerRef
				} = props;
	const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(initialCollapsed);
	const collapsed = controlledCollapsed ?? uncontrolledCollapsed;
	const toggleCollapse = useCallback((e: React.MouseEvent) => {
		if (exists(onCollapseToggle))
			return onCollapseToggle(collapsed, e);
		setUncontrolledCollapsed(prev => !prev);
	}, [collapsed, onCollapseToggle]);
	const headerCaret = exists(customCaret) ? resolveContent(customCaret) : <TS_Icons.treeCollapse.component/>;
	return (
		<LL_V_L id={id} className={_className('ts-collapsable-container-v2', collapsed && 'collapsed', animated && 'animated', className)} style={style}
						innerRef={innerRef}>
			<LL_H_C className="ts-collapsable-container-v2__header" onClick={toggleCollapse} onContextMenu={onHeaderRightClick}>
				{headerCaret}
				<div className="ts-collapsable-container-v2__header-content">{resolveContent(headerRenderer)}</div>
			</LL_H_C>
			<div className="ts-collapsable-container-v2__content">
				<div className="ts-collapsable-container-v2__content-inner">
					{resolveContent(containerRenderer)}
				</div>
			</div>
		</LL_V_L>
	);
}
