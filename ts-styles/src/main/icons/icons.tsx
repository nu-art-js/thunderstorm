import * as React from 'react';
import {ElementType, HTMLAttributes} from 'react';
import {_keys} from '@nu-art/ts-common';

import FilterURL, {ReactComponent as Filter} from './svgs/icon__filter.svg';
import SearchURL, {ReactComponent as Search} from './svgs/icon__search.svg';
import AttentionURL, {ReactComponent as Attention} from './svgs/icon__attention.svg';
import BellURL, {ReactComponent as Bell} from './svgs/icon__bell.svg';
import BinURL, {ReactComponent as Bin} from './svgs/icon__bin.svg';
import XURL, {ReactComponent as X} from './svgs/icon__x.svg';
import VURL, {ReactComponent as V} from './svgs/icon__v.svg';
import MoreURL, {ReactComponent as More} from './svgs/icon__more.svg';
import CollapseURL, {ReactComponent as Collapse} from './svgs/icon__treeCollapse.svg';
import GearURL, {ReactComponent as Gear} from './svgs/icon__gear.svg';
import informationUrl, {ReactComponent as Information} from './svgs/icon__information.svg';
import filterStopUrl, {ReactComponent as FilterStop} from './svgs/icon__filter-stop.svg';
import ClearURL, {ReactComponent as Clear} from './svgs/icon__clear.svg';
import SaveUrl, {ReactComponent as Save} from './svgs/icon__save.svg';
import MenuUrl, {ReactComponent as Menu} from './svgs/icon__menu.svg';

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
		const className = 'icon--wrapper' + (this.props.className ?? '');
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
		className={'icon--wrapper' + (props.className ?? '')}
	>
		<Icon/>
	</div>;
};

export const TS_Icons = {
	Filter: {component: genIcon(Filter), url: FilterURL},
	Search: {component: genIcon(Search), url: SearchURL},
	attention: {component: genIcon(Attention), url: AttentionURL},
	bell: {component: genIcon(Bell), url: BellURL},
	bin: {component: genIcon(Bin), url: BinURL},
	more: {component: genIcon(More), url: MoreURL},
	treeCollapse: {component: genIcon(Collapse), url: CollapseURL},
	v: {component: genIcon(V), url: VURL},
	x: {component: genIcon(X), url: XURL},
	gear: {component: genIcon(Gear), url: GearURL},
	information: {component: genIcon(Information), url: informationUrl},
	filterStop: {component: genIcon(FilterStop), url: filterStopUrl},
	clear: {component: genIcon(Clear), url: ClearURL},
	save: {component: genIcon(Save), url: SaveUrl},
	menu: {component: genIcon(Menu), url: MenuUrl},
};

export const tsIconKeys = (): TSIcons[] => {
	return _keys(TS_Icons);
};

export type TSIconsType = typeof TS_Icons
export type TSIcons = keyof TSIconsType

