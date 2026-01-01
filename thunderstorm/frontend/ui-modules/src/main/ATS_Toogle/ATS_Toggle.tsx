import { TS_Toggle } from '@nu-art/thunder-widgets/src/main/components/TS_Toggle/TS_Toggle.js';
import { ComponentSync } from "@nu-art/thunder-routing";
import { AppToolsScreen } from '../TS_AppTools/index.js';
type State = {
    checked: boolean;
};
export class ATS_Toggle extends ComponentSync<{}, State> {
    static Screen: AppToolsScreen = {
        name: 'TS Toggle',
        key: 'ts-toggle',
        group: 'TS Components',
        renderer: this,
    };
    protected deriveStateFromProps(nextProps: {}, state: State): State {
        state.checked ??= false;
        return state;
    }
    render() {
        return <TS_Toggle id={'test-toggle'} checked={this.state.checked} onCheck={() => this.setState({ checked: !this.state.checked })}/>;
    }
}
