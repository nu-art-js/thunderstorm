import * as React from 'react';
import {Example_TreeCatalog, Example_TreeObject, getWidgetComponentGuide} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const treeGuide = getWidgetComponentGuide('tree');
const ObjectExample = treeGuide?.examples.object ?? Example_TreeObject;
const CatalogExample = treeGuide?.examples.catalog ?? Example_TreeCatalog;

export const Preview_Tree: React.FC = () => (
	<PreviewSampleColumn className={'dl-preview-column--tree'}>
		<PreviewSample label={'object tree'}>
			<ObjectExample/>
		</PreviewSample>
		<PreviewSample label={'typed catalog'} className={'dl-preview-sample--tree-catalog'}>
			<CatalogExample/>
		</PreviewSample>
	</PreviewSampleColumn>
);
