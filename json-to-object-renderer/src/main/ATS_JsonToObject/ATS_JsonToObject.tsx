import {EditableItem} from '@nu-art/thunderstorm-frontend';
import {AppToolsScreen} from '@nu-art/thunder-ui-modules';
import {ComponentSync, InferProps, InferState, LL_V_L, TS_Button, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {Editor_JsonToObject} from '../Editor_JsonToObject.js';
import {tsValidateString, ValidatorTypeResolver} from '@nu-art/ts-common';

type ATS_JsonToObject_Props = {};
type ATS_JsonToObject_State = {
	editable: EditableItem<TestType>
	freeText: boolean
};

type TestType = {
	a: string
	b: string
	c: string
}

const validator: ValidatorTypeResolver<TestType> = {
	a: tsValidateString(-1),
	b: tsValidateString(-1),
	c: tsValidateString(-1)
};

export class ATS_JsonToObject
	extends ComponentSync<ATS_JsonToObject_Props, ATS_JsonToObject_State> {

	static screen: AppToolsScreen = {name: `DevTool - JsonToObject`, renderer: this};

	static defaultProps = {
		modules: [],
		pageTitle: () => this.screen.name
	};

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>): InferState<this> {
		state.freeText ??= false;
		state.editable ??= new EditableItem<TestType>({}).setAutoSave(true);
		return state;
	}

	constructor(p: ATS_JsonToObject_Props) {
		super(p);
	}

	render() {
		return <LL_V_L>
			<Editor_JsonToObject
				isFreeTextMode={this.state.freeText}
				validator={validator}
				editable={this.state.editable}
				renderer={(editable) => {
					const item = editable.item;
					return <LL_V_L>
						<TS_PropRenderer.Vertical label={'property a'}>{item.a ?? 'no A'}</TS_PropRenderer.Vertical>
						<TS_PropRenderer.Vertical label={'property b'}>{item.b ?? 'no B'}</TS_PropRenderer.Vertical>
					</LL_V_L>;
				}}
			/>
			<TS_Button onClick={() => this.reDeriveState({freeText: !this.state.freeText})}>toggle</TS_Button>
		</LL_V_L>;
	}
}