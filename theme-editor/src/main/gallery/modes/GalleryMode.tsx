import * as React from 'react';
import {LL_V_L} from '@nu-art/thunder-widgets/v3';
import {ComponentGrid} from '../ComponentGrid.js';

export type GalleryModeProps = {
	onSelectComponent: (id: string) => void;
};

/** Design Language root — component grid only, no token editor. */
export const GalleryMode: React.FC<GalleryModeProps> = props => (
	<LL_V_L className={'dl-mode dl-mode--gallery'}>
		<ComponentGrid selectable onSelect={props.onSelectComponent}/>
	</LL_V_L>
);
