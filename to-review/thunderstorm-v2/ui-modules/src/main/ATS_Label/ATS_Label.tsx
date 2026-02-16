import {thunderstormATSGroups} from '../consts.js';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {LL_V_L} from '@nu-art/thunder-widgets';
import {AppToolsScreen, TS_AppTools} from '../TS_AppTools/index.js';
import './ATS_Label.scss';
import {Label} from '@nu-art/thunder-widgets';

type Props = {};
type State = {};
type LabelTest = {
	label: string;
	tooltip?: string;
};

export class ATS_Label
	extends ComponentSync<Props, State> {
	static Screen: AppToolsScreen = {
		key: 'ats-ts-label',
		name: 'Label',
		group: thunderstormATSGroups,
		renderer: this,
	};

	//######################### Life Cycle #########################
	protected deriveStateFromProps(nextProps: Props, state: State) {
		return state;
	}

	//######################### Logic #########################
	private getTests = (): LabelTest[] => {
		return [
			{label: 'Short Title - With tooltip', tooltip: 'Tooltip for short title'},
			{label: 'Short Title - Without tooltip '},
			{label: 'Long Title - With tooltip - asdasdasdasdasdasd', tooltip: 'Tooltip for Long title'},
			{label: 'Long Title - Without tooltip - asdasdasdasdasdasd'},
			{label: 'Long Title - With long tooltip - asdasdasdasdasdasd', tooltip: 'Tooltip for Long title - asdasdasdasdasdasd'},
		];
	};

	//######################### Render #########################
	render() {
		const tests = this.getTests();
		return <LL_V_L id={'ats__label'}>
			{TS_AppTools.renderPageHeader('Label')}
			<LL_V_L className={'ats__label__labels'}>
				{tests.map((test, i) => <Label key={i} tooltip={test.tooltip}>{test.label}</Label>)}
			</LL_V_L>
		</LL_V_L>;
	}
}
