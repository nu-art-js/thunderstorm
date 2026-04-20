import * as React from 'react';

export const Icon_ResetZoom = (props: { size?: number; color?: string }) => {
	const {size = 14, color = 'currentColor'} = props;
	return <svg width={size} height={size} viewBox={'0 0 16 16'} fill={'none'} xmlns={'http://www.w3.org/2000/svg'}>
		<path d={'M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3'} stroke={color} strokeWidth={1.5} strokeLinecap={'round'} strokeLinejoin={'round'}/>
		<rect x={5} y={5} width={6} height={6} rx={1} stroke={color} strokeWidth={1.2}/>
	</svg>;
};
