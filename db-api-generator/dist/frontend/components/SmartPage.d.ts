import { ThunderDispatcher } from '@nu-art/thunderstorm/frontend';
import { Props_SmartComponent, SmartComponent, State_SmartComponent } from './SmartComponent';
export interface OnPageTitleChangedListener {
    __onPageTitleChanged(title: string): void;
}
export declare const dispatch_onPageTitleChanged: ThunderDispatcher<OnPageTitleChangedListener, "__onPageTitleChanged", [title: string], void>;
export type Props_SmartPage<S extends {} = {}> = Props_SmartComponent & {
    pageTitle?: string | ((state: State_SmartComponent & S) => string);
};
export declare abstract class SmartPage<P extends Props_SmartPage<S> = {}, S extends {} = {}> extends SmartComponent<P, S> {
    private prevTitle;
    constructor(p: P);
    protected deriveStateFromProps(nextProps: Props_SmartComponent & P, state?: Partial<S> & State_SmartComponent): Promise<State_SmartComponent & S>;
    protected updateTitle: () => void;
    private resolveTitle;
}
