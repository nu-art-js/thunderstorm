import * as React from 'react';
import {useState} from 'react';
import {TS_ListOrganizer} from '../../main/components/TS_ListOrganizer/TS_ListOrganizer.js';

export default function EntryListOrganizerV1() {
	const [items, setItems] = useState(['First', 'Second', 'Third']);

	return (
		<div data-testid="list-organizer-container">
			<TS_ListOrganizer
				items={items}
				onOrderChanged={setItems}
				renderer={(props) => (
					<div
						draggable
						onDragStart={(e) => props.onDragStart(e, props.index)}
						onDragOver={(e) => props.onDragOver(e, props.index)}
						onDragLeave={(e) => props.onDragLeave(e, props.index)}
						onDragEnd={props.onDragEnd}
					>
						{props.item}
					</div>
				)}
			/>
		</div>
	);
}
