import * as React from "react";
import {css} from "emotion";

export type IconStyle = {
	color: string;
	width: number;
	height: number;
}

type Props = {
	iconStyle: IconStyle
	icon: string
}

class RenderIcon
	extends React.Component<Props> {
	render() {
		const iconStyle = css`
		 width: ${this.props.iconStyle.width}px;
		 height: ${this.props.iconStyle.height}px;
		 background: ${this.props.iconStyle.color};
		 -webkit-mask-image: url(${this.props.icon});
		 mask-image: url(${this.props.icon});
		 mask-size: cover;
		 display: inline-block;
		`;

		return <span className={iconStyle}/>;
	}
}


export type IconData = {
	ratio: number,
	value: string
}

export const iconsRenderer = (key: IconData, color?: string, width: number = 24) => {
	return <RenderIcon icon={key.value} iconStyle={{color: color || "#000000", height: width * key.ratio, width: width}}/>
};

const arrowClose: IconData = {ratio: 5 / 6,  value: require('@res/icons/icon__arrowClose.svg')};
const arrowOpen: IconData = {ratio: 5 / 6,  value: require('@res/icons/icon__arrowOpen.svg')};
const check: IconData = {ratio: 12 / 12,  value: require('@res/icons/icon__check.svg')};
const close: IconData = {ratio: 10 / 10,  value: require('@res/icons/icon__close.svg')};
const errorToast: IconData = {ratio: 24 / 26,  value: require('@res/icons/icon__errorToast.svg')};
const infoToast: IconData = {ratio: 24 / 26,  value: require('@res/icons/icon__infoToast.svg')};
const successToast: IconData = {ratio: 24 / 26,  value: require('@res/icons/icon__successToast.svg')};

export const ICONS = {

	arrowClose: (color?: string, width?: number) => iconsRenderer(arrowClose, color, width),
	arrowOpen: (color?: string, width?: number) => iconsRenderer(arrowOpen, color, width),
	check: (color?: string, width?: number) => iconsRenderer(check, color, width),
	close: (color?: string, width?: number) => iconsRenderer(close, color, width),
	errorToast: (color?: string, width?: number) => iconsRenderer(errorToast, color, width),
	infoToast: (color?: string, width?: number) => iconsRenderer(infoToast, color, width),
	successToast: (color?: string, width?: number) => iconsRenderer(successToast, color, width),
};
