import * as React from 'react';
import {Props_Button, TS_Button} from '@nu-art/thunder-widgets/v3';
import {PreviewGrid} from '../PreviewGrid.js';
import {PreviewPermutation} from '../Preview.types.js';

// Mirrors styles/components/src/main/components/_button.scss — the [data-variant] set.
const Variants = ['primary', 'secondary', 'tertiary', 'text', 'dangerous'];

const States: PreviewPermutation<Props_Button>[] = [
	{label: 'default', props: {}},
	{label: 'hover', props: {className: 'pseudo-hover'}},
	{label: 'disabled', props: {disabled: true}},
	{label: 'in-progress', props: {actionInProgress: true}}
];

/**
 * Visual reference for the real v3 TS_Button across variant × state. Every value the
 * button renders comes from var(--ts-button--*) tokens, so switching the theme re-skins
 * this grid live — making it a conformance test of @app/styles-components theming.
 */
export const Preview_Button: React.FC = () => (
	<PreviewGrid<Props_Button>
		columns={Variants}
		rows={States}
		renderCell={(variant, row) => (
			<TS_Button variant={variant} {...row.props}>{variant}</TS_Button>
		)}
	/>
);
