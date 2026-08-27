import * as React from 'react';
import {ElementType, HTMLAttributes} from 'react';
import {_keys} from '@nu-art/ts-common';

import {ReactComponent as Filter} from './svgs/icon__filter.svg';
import {ReactComponent as Search} from './svgs/icon__search.svg';
import {ReactComponent as Attention} from './svgs/icon__attention.svg';
import {ReactComponent as Bell} from './svgs/icon__bell.svg';
import {ReactComponent as Bin} from './svgs/icon__bin.svg';
import {ReactComponent as X} from './svgs/icon__x.svg';
import {ReactComponent as V} from './svgs/icon__v.svg';
import {ReactComponent as Dash} from './svgs/icon__dash.svg';
import {ReactComponent as More} from './svgs/icon__more.svg';
import {ReactComponent as Collapse} from './svgs/icon__treeCollapse.svg';
import {ReactComponent as Gear} from './svgs/icon__gear.svg';
import {ReactComponent as User} from './svgs/icon__user.svg';
import {ReactComponent as Information} from './svgs/icon__information.svg';
import {ReactComponent as FilterStop} from './svgs/icon__filter-stop.svg';
import {ReactComponent as Clear} from './svgs/icon__clear.svg';
import {ReactComponent as Save} from './svgs/icon__save.svg';
import {ReactComponent as Menu} from './svgs/icon__menu.svg';
import {ReactComponent as Google} from './svgs/icon__google.svg';
import {ReactComponent as Download} from './svgs/icon__download.svg';
import {ReactComponent as Copy} from './svgs/icon__copy.svg';
import {ReactComponent as AddImage} from './svgs/icon__add-image.svg';
import {ReactComponent as Link} from './svgs/icon__link.svg';
import {ReactComponent as Crosshair} from './svgs/icon__crosshair.svg';
import {ReactComponent as Pin} from './svgs/icon__pin.svg';
import {ReactComponent as Pulse} from './svgs/icon__pulse.svg';
import {ReactComponent as Undo} from './svgs/icon__undo.svg';

export type IconStyle = {
	color: string;
	width: number;
	height: number;
}

export type IconAttributes = HTMLAttributes<HTMLDivElement>;
type Props = IconAttributes & {
	icon: string
}

class RenderIcon
	extends React.Component<Props> {
	render() {
		const className = 'icon--wrapper ' + (this.props.className ?? '');
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

const genIcon = (Icon: ElementType) => {
	return (props: IconAttributes) => <div
		{...props}
		className={'icon--wrapper ' + (props.className ?? '')}>
		<Icon/>
	</div>;
};

export const TS_Icons = {
	Filter: {component: genIcon(Filter)},
	Search: {component: genIcon(Search)},
	attention: {component: genIcon(Attention)},
	bell: {component: genIcon(Bell)},
	bin: {component: genIcon(Bin)},
	more: {component: genIcon(More)},
	treeCollapse: {component: genIcon(Collapse)},
	v: {component: genIcon(V)},
	x: {component: genIcon(X)},
	dash: {component: genIcon(Dash)},
	gear: {component: genIcon(Gear)},
	information: {component: genIcon(Information)},
	filterStop: {component: genIcon(FilterStop)},
	clear: {component: genIcon(Clear)},
	save: {component: genIcon(Save)},
	menu: {component: genIcon(Menu)},
	google: {component: genIcon(Google)},
	download: {component: genIcon(Download)},
	copy: {component: genIcon(Copy)},
	addImage: {component: genIcon(AddImage)},
	user: {component: genIcon(User)},
	link: {component: genIcon(Link)},
	crosshair: {component: genIcon(Crosshair)},
	pin: {component: genIcon(Pin)},
	pulse: {component: genIcon(Pulse)},
	undo: {component: genIcon(Undo)},
};

export const tsIconKeys = (): TSIcons[] => {
	return _keys(TS_Icons);
};

export type TSIconsType = typeof TS_Icons
export type TSIcons = keyof TSIconsType

