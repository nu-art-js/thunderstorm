import { thunderstormATSGroups } from '../../consts.js';
import { ComponentSync } from "@nu-art/thunder-routing";
import { LL_V_L } from '../Layouts/index.js';
import { AppToolsScreen, TS_AppTools } from '../TS_AppTools/index.js';
import './ATS_CheckboxGroup.scss';
import { TS_CheckboxGroup } from "./TS_CheckboxGroup.js";
import { voidFunction } from "@nu-art/ts-common";
type Props = {};
type State = {
    selectedIdsGroup: string[];
    selectedIdsSomeDisabled: string[];
};
export class ATS_CheckboxGroup extends ComponentSync<Props, State> {
    static Screen: AppToolsScreen = {
        key: 'ats-ts-checkbox-group',
        name: 'CheckboxGroup',
        group: thunderstormATSGroups,
        renderer: this,
    };
    protected deriveStateFromProps(nextProps: Props, state: State) {
        state.selectedIdsGroup ??= [];
        state.selectedIdsSomeDisabled ??= [];
        return state;
    }
    //######################### Logic #########################
    private onChangeGroup = (selectedIds: string[]) => {
        this.setState({ selectedIdsGroup: selectedIds });
    };
    private onChangeSomeDisabledGroup = (selectedIds: string[]) => {
        this.setState({ selectedIdsSomeDisabled: selectedIds });
    };
    //######################### Render #########################
    render() {
        return <LL_V_L id={'ats__checkboxGroup'}>
            {TS_AppTools.renderPageHeader('Checkbox Group')}
            {this.render_CheckboxGroup()}
            {this.render_PartialDisabledCheckboxGroup()}
            {this.render_DisabledParent()}
        </LL_V_L>;
    }
    private render_CheckboxGroup = () => {
        const options = [
            {
                id: '1',
                label: 'first',
            },
            {
                id: '2',
                label: 'second',
            },
            {
                id: '3',
                label: 'third',
            }
        ];
        return <TS_CheckboxGroup parent={{ id: 'father', label: 'all' }} options={options} onChange={this.onChangeGroup} selectedIds={this.state.selectedIdsGroup}/>;
    };
    private render_PartialDisabledCheckboxGroup = () => {
        const options = [
            {
                id: '1',
                label: 'Disabled',
                disabled: true,
            },
            {
                id: '2',
                label: 'Not Disabled',
            },
            {
                id: '3',
                label: 'Disabled 2',
                disabled: true,
            },
            {
                id: '4',
                label: 'Not Disabled 2',
            }
        ];
        return <TS_CheckboxGroup parent={{ id: 'father', label: 'All' }} options={options} onChange={this.onChangeSomeDisabledGroup} selectedIds={this.state.selectedIdsSomeDisabled}/>;
    };
    private render_DisabledParent = () => {
        const options = [
            {
                id: '1',
                label: 'Not Disabled 1',
            },
            {
                id: '2',
                label: 'Not Disabled 2',
            },
            {
                id: '3',
                label: 'Not Disabled 3',
            }
        ];
        return <TS_CheckboxGroup parent={{ id: 'father', label: 'Disabled Father', disabled: true }} options={options} onChange={voidFunction} selectedIds={[]}/>;
    };
}
