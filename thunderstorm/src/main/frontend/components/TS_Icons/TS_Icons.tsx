import * as React from 'react';
import {_className} from '../..';

export type IconStyle = {
	color: string;
	width: number;
	height: number;
}

type IconAttributes = React.HTMLAttributes<HTMLSpanElement>;
type Props = IconAttributes & {
	icon: string
}

class RenderIcon
	extends React.Component<Props> {
	render() {
		const className = _className('icon--default', this.props.className);
		return <div {...this.props} className={className}
								style={{WebkitMaskImage: `url(${this.props.icon})`, maskImage: `url(${this.props.icon})`}}/>;
	}
}

export type IconData = {
	ratio: number,
	value: string
}

export const iconsRenderer = (key: IconData, props: IconAttributes) => {
	return <RenderIcon {...props} icon={key.value}/>;
};

//Icons
// const arrow: IconData = {ratio: 20 / 20, value: require('./icons/icon__arrow.svg')};

//TS_Icons
export const TS_Icons = {
	// arrow: (props: IconAttributes) => iconsRenderer(arrow, props),
};