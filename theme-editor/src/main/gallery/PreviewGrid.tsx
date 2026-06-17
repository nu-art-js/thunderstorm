import * as React from 'react';
import {PreviewPermutation} from './Preview.types.js';

type PreviewGridProps<P> = {
	/** Column axis — the widget's primary variants (e.g. button variants, input types). */
	columns: string[];
	/** Row axis — states/permutations spread onto every cell in the row. */
	rows: PreviewPermutation<P>[];
	/** Renders one cell: the real widget for a given column under the row's props. */
	renderCell: (column: string, row: PreviewPermutation<P>) => React.ReactNode;
};

/**
 * The single permutation-matrix layout shared by every preview. A real CSS grid —
 * one column track per variant plus a leading label track — so column headers align
 * over their cells and widgets never overlap, regardless of count. Previews only
 * declare their axes and a cell renderer (KISS / no duplication).
 */
export const PreviewGrid = <P, >(props: PreviewGridProps<P>) => {
	const {columns, rows, renderCell} = props;
	const gridStyle: React.CSSProperties = {
		gridTemplateColumns: `max-content repeat(${columns.length}, max-content)`
	};

	return (
		<div className={'dl-grid'} style={gridStyle}>
			<div className={'dl-grid__corner'}/>
			{columns.map(column => <div key={column} className={'dl-grid__col-label'}>{column}</div>)}
			{rows.map(row => (
				<React.Fragment key={row.label}>
					<div className={'dl-grid__label'}>{row.label}</div>
					{columns.map(column => (
						<div key={column} className={'dl-grid__cell'}>{renderCell(column, row)}</div>
					))}
				</React.Fragment>
			))}
		</div>
	);
};
