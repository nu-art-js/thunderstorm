import * as React from 'react';

/** Minimal loading spinner for PDF_Renderer. No external UI dependency. */
export function PDF_Loader(props: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={props.className ? `pdf-loader ${props.className}` : 'pdf-loader'}>
			<div className="pdf-loader__spinner"/>
		</div>
	);
}
