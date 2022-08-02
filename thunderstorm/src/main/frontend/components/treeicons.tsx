import * as React from 'react';


export const Expanded = (props: { style: { [k: string]: any } }) => <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" style={props.style}>
	<path d="M0 5l6 6 6-6z"/>
</svg>;

export const Collapsed = (props: { style: { [k: string]: any } }) => <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" style={props.style}>
	<path d="M0 14l6-6-6-6z"/>
</svg>;
