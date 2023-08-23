/// <reference types="react" />
import { BaseComponent } from '@nu-art/thunderstorm/frontend/core/ComponentBase';
import { OnSyncStatusChangedListener } from '../modules/types';
import { ModuleFE_BaseDB } from '../modules/ModuleFE_BaseDB';
import { DB_Object, ResolvableContent } from '@nu-art/ts-common';
export declare enum ComponentStatus {
    Loading = 0,
    Syncing = 1,
    Synced = 2
}
export type Props_SmartComponent = {
    modules?: ResolvableContent<ModuleFE_BaseDB<any>[]>;
};
export type State_SmartComponent = {
    componentPhase: ComponentStatus;
    error?: Error;
};
/**
 * # SmartComponent
 * ## The new way to render things in React
 * ## <ins>Intro:</ins>
 *
 * This shared-components is an async extension on TS BaseComponent.
 * The smart shared-components provides its deriveStateFromProps a previous state, to be able to calculate the new state based
 * on previous data, as well as new props.
 * If provided a "modules" prop, the shared-components will render a loader while waiting for the modules in the prop to finish their
 * sync cycle and be ready, e.g:
 *
 * This shared-components will wait for both the values and the references modules to finish sync before loading its own content.
 * ```js
 * static defaultProps = {
 *   modules: [ModuleFE_Values, ModuleFE_References]
 * }
 *```
 *
 * ## Important!
 * Any "on{Item}Updated" function should NOT be an arrow function, as it can't be re-binded in the constructor,
 * thus obstructing the SmartComponent ability to listen to sync events, causing it to load forever.
 */
export declare abstract class SmartComponent<P extends any = {}, S extends any = {}, Props extends Props_SmartComponent & P = Props_SmartComponent & P, State extends State_SmartComponent & S = State_SmartComponent & S> extends BaseComponent<Props, State> implements OnSyncStatusChangedListener<DB_Object> {
    private derivingState;
    private pending?;
    /**
     * The constructor does 2 important things:
     *
     * 1. Creates and binds a listener function for each module provided in the "modules" prop.
     * 		This function waits for a sync event and calls the reDeriveState function.
     * 	 	only when all modules are ready will the shared-components phase change to synced and will render actual content.
     *
     * 2. Binds extending class render function and overwrites it to be able to:
     * 		2.1. wrap the content in a TS_ErrorBoundary to contain and display crashes in the shared-components.
     * 		2.2. render whatever the "renderLoader" function returns while the shared-components is not synced.
     */
    constructor(p: Props);
    __onSyncStatusChanged(module: ModuleFE_BaseDB<DB_Object, any>): void;
    /**
     * This function gates the actual deriveStateFromProps from being called when the shared-components
     * is waiting for the modules in the "modules" prop to finish syncing.
     *
     * After deriveStateFromProps is called, will check to see if more pending props exist and if so will reDerive again
     * until eventually when no more pending props, will setState to implement changes.
     *
     * This way all the calculations are merged to a final result before rendering, to reduce render calls.
     * @protected
     */
    protected _deriveStateFromProps(nextProps: Props, partialState?: State): State | undefined;
    /**
     * Called after each deriveStateFromProps, to check if more derives are queued.
     *
     * if no derives are queued, while return.
     *
     * if more derives are queued, will call derive again with the previous
     * derive answer and return its answer.
     */
    private reDeriveCompletedCallback;
    protected createInitialState(nextProps: Props): State;
    protected abstract deriveStateFromProps(nextProps: Props, state?: Partial<S> & State_SmartComponent): Promise<State>;
    protected renderLoader: () => JSX.Element;
}
