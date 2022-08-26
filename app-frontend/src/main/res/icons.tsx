import * as React from 'react';
import {HTMLAttributes} from 'react';

export type IconStyle = {
	color: string;
	width: number;
	height: number;
}

type IconAttributes = HTMLAttributes<HTMLSpanElement>;
type Props = IconAttributes & {
	icon: string
}

class RenderIcon
	extends React.Component<Props> {
	render() {
		return <div {...this.props} className={`icon--default ${this.props.className}`}
								style={{WebkitMaskImage: `url(${this.props.icon})`, maskImage: `url(${this.props.icon})`}}/>;
	}
}

export type IconData = {
	ratio: number,
	value: string
}

export const iconsRenderer = (key: IconData, props?: IconAttributes) => {
	return <RenderIcon {...props} icon={key.value}/>;
};

const arrowClose: IconData = {ratio: 5 / 6,  value: require('@res/icons/icon__arrowClose.svg')};
const arrowOpen: IconData = {ratio: 5 / 6,  value: require('@res/icons/icon__arrowOpen.svg')};
const avatar: IconData = {ratio: 14 / 13,  value: require('@res/icons/icon__avatar.svg')};
const check: IconData = {ratio: 12 / 12,  value: require('@res/icons/icon__check.svg')};
const close: IconData = {ratio: 10 / 10,  value: require('@res/icons/icon__close.svg')};
const errorToast: IconData = {ratio: 24 / 26,  value: require('@res/icons/icon__errorToast.svg')};
const infoToast: IconData = {ratio: 24 / 26,  value: require('@res/icons/icon__infoToast.svg')};
const lock: IconData = {ratio: 15 / 12,  value: require('@res/icons/icon__lock.svg')};
const successToast: IconData = {ratio: 24 / 26,  value: require('@res/icons/icon__successToast.svg')};
const icon_arrowheadFullDown: IconData = {ratio: 24 / 24,  value: require('@res/icons/icon_arrowheadFullDown.svg')};
const icon_arrowheadFullUp: IconData = {ratio: 24 / 24,  value: require('@res/icons/icon_arrowheadFullUp.svg')};

export const ICONS = {

	arrowClose: (props?: IconAttributes) => iconsRenderer(arrowClose, props),
	arrowOpen: (props?: IconAttributes) => iconsRenderer(arrowOpen, props),
	avatar: (props?: IconAttributes) => iconsRenderer(avatar, props),
	check: (props?: IconAttributes) => iconsRenderer(check, props),
	close: (props?: IconAttributes) => iconsRenderer(close, props),
	errorToast: (props?: IconAttributes) => iconsRenderer(errorToast, props),
	infoToast: (props?: IconAttributes) => iconsRenderer(infoToast, props),
	lock: (props?: IconAttributes) => iconsRenderer(lock, props),
	successToast: (props?: IconAttributes) => iconsRenderer(successToast, props),
	icon_arrowheadFullDown: (props?: IconAttributes) => iconsRenderer(icon_arrowheadFullDown, props),
	icon_arrowheadFullUp: (props?: IconAttributes) => iconsRenderer(icon_arrowheadFullUp, props),
};

export type IconsType = typeof ICONS
