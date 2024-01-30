import { ComponentSync } from '@nu-art/thunderstorm/frontend';
import { DB_Notifications } from '@nu-art/push-pub-sub/shared/types';
export type State = {
    notifications: DB_Notifications[];
};
declare class Example_TriggerPush_Renderer extends ComponentSync<{}, State> {
    protected deriveStateFromProps(nextProps: {}): State;
    render(): JSX.Element;
    private triggerPush;
    private registerForPush;
}
export declare const Example_TriggerPush: {
    renderer: typeof Example_TriggerPush_Renderer;
    name: string;
};
export {};
