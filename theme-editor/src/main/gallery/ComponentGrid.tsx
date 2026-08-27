import * as React from 'react';
import {ComponentPreview} from './Preview.types.js';
import {ComponentPreviews} from './registry.js';
import {GallerySection} from './GallerySection.js';
import './ComponentGrid.scss';

export type ComponentGridProps = {
	previews?: ComponentPreview[];
	selectedId?: string;
	onSelect?: (id: string) => void;
	selectable?: boolean;
};

/**
 * Gallery of component preview cards — one flex row that wraps; panels in the same
 * row stretch to the tallest card in that row.
 */
export const ComponentGrid: React.FC<ComponentGridProps> = props => {
	const previews = props.previews ?? ComponentPreviews;
	const selectable = props.selectable ?? !!props.onSelect;

	return (
		<div className={'dl-component-grid'}>
			{previews.map(preview => {
				const Renderer = preview.renderer;
				return (
					<GallerySection
						key={preview.id}
						title={preview.title}
						fitContent
						wide={preview.layout === 'matrix'}
						selectable={selectable}
						selected={props.selectedId === preview.id}
						onClick={() => props.onSelect?.(preview.id)}
					>
						<Renderer/>
					</GallerySection>
				);
			})}
		</div>
	);
};
