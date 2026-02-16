import {ComponentSync} from '@nu-art/thunder-widgets';
import {thunderstormATSGroups} from '../consts.js';
import {LL_H_C, LL_V_L} from '@nu-art/thunder-widgets';
import './ats.scss';
import {TS_PropRenderer} from '@nu-art/thunder-widgets';
import {TS_CollapsableContainerV2} from '@nu-art/thunder-widgets';
import {AppToolsScreen, TS_AppTools} from '../TS_AppTools/index.js';

const lorem = () => <p className={'lorem'}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sagittis mauris quis elit tristique tempor. Sed in
	pellentesque nisi, eu
	luctus purus. Nam id mi libero. Morbi non auctor elit, eu sodales ex. Aliquam eget diam porttitor, vestibulum orci non, eleifend tortor. Curabitur finibus
	orci eu odio pretium, at fringilla ex scelerisque. Praesent eu ante velit. Fusce in ligula eu mi efficitur cursus at et quam. Phasellus nec accumsan velit,
	sed interdum arcu. In quis mauris tincidunt, convallis erat at, lobortis ex. Cras urna sapien, sagittis nec sodales sit amet, pretium eget felis. Class aptent
	taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>;
type Props = {
	collapsed: boolean;
};
type State = {
	collapsed: boolean;
};

class Component
	extends ComponentSync<Props, State> {
	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.collapsed ??= true;
		return state;
	}

	private test_Singular = () => {
		return <TS_PropRenderer.Vertical label={'Singular Collapsable - Uncontrolled'}>
			<TS_CollapsableContainerV2 headerRenderer={'I\'m a single container!'} containerRenderer={lorem}/>
		</TS_PropRenderer.Vertical>;
	};
	private test_Controlled = () => {
		return <TS_PropRenderer.Vertical label={'Singular Collapsable - Controlled'}>
			<TS_CollapsableContainerV2 headerRenderer={'I\'m a single container!'} containerRenderer={lorem} collapsed={this.state.collapsed}
																 onCollapseToggle={collapsed => this.setState({collapsed: !collapsed})}/>
		</TS_PropRenderer.Vertical>;
	};
	private test_Animated = () => {
		return <TS_PropRenderer.Vertical label={'Singular Collapsable - Animated'}>
			<TS_CollapsableContainerV2 headerRenderer={'I\'m an animated container!'} containerRenderer={lorem} animated={true}/>
		</TS_PropRenderer.Vertical>;
	};
	private test_Multiple = () => {
		return <TS_PropRenderer.Vertical label={'Multiple Collapsable'}>
			<TS_CollapsableContainerV2 headerRenderer={'Multiple 1'} containerRenderer={lorem}/>
			<TS_CollapsableContainerV2 headerRenderer={'Multiple 2'} containerRenderer={lorem}/>
		</TS_PropRenderer.Vertical>;
	};
	private test_Nesting = () => {
		return <TS_PropRenderer.Vertical label={'Nested Collapsable'}>
			<TS_CollapsableContainerV2 headerRenderer={'Parent'} containerRenderer={() => <>
				<TS_CollapsableContainerV2 headerRenderer={'Child 1'} containerRenderer={lorem}/>
				<TS_CollapsableContainerV2 headerRenderer={'Child 2'} containerRenderer={lorem}/>
			</>}/>
		</TS_PropRenderer.Vertical>;
	};

	render() {
		return <LL_V_L id={'ats__collapsable-container'}>
			{TS_AppTools.renderPageHeader('Collapsable Container')}
			<LL_H_C className={'ats__tests'}>
				{this.test_Singular()}
				{this.test_Controlled()}
				{this.test_Animated()}
				{this.test_Multiple()}
				{this.test_Nesting()}
			</LL_H_C>
		</LL_V_L>;
	}
}

export const ATS_CollapsableContainerV2: AppToolsScreen = {
	key: 'collapsable-container-v2',
	name: 'Collapsable Container',
	group: thunderstormATSGroups,
	renderer: Component,
};
