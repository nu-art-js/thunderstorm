import * as React from 'react';
import './ThreeDotsLoader.scss';

/**
 * Three-dots (ellipsis) loading indicator. Exported as TS_ButtonLoader for backward compatibility.
 */
export function ThreeDotsLoader(): React.ReactElement {
	return (
		<div className="three-dots-loader">
			<div/>
			<div/>
			<div/>
			<div/>
		</div>
	);
}

/** @deprecated Use ThreeDotsLoader. Kept for backward compatibility. */
export const TS_ButtonLoader = ThreeDotsLoader;
