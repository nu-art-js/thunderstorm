"use strict";
/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartComponent = exports.ComponentStatus = void 0;
const React = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ComponentBase_1 = require("@nu-art/thunderstorm/frontend/core/ComponentBase");
const consts_1 = require("../modules/consts");
const ts_common_1 = require("@nu-art/ts-common");
var ComponentStatus;
(function (ComponentStatus) {
    ComponentStatus[ComponentStatus["Loading"] = 0] = "Loading";
    ComponentStatus[ComponentStatus["Syncing"] = 1] = "Syncing";
    ComponentStatus[ComponentStatus["Synced"] = 2] = "Synced";
})(ComponentStatus = exports.ComponentStatus || (exports.ComponentStatus = {}));
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
class SmartComponent extends ComponentBase_1.BaseComponent {
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
    constructor(p) {
        var _a;
        super(p);
        // static defaultProps = {
        // 	modules: []
        // };
        this.derivingState = false;
        /**
         * Called after each deriveStateFromProps, to check if more derives are queued.
         *
         * if no derives are queued, while return.
         *
         * if more derives are queued, will call derive again with the previous
         * derive answer and return its answer.
         */
        this.reDeriveCompletedCallback = (state) => {
            this.derivingState = false;
            if (!this.pending)
                return;
            if (!this.mounted)
                return this.logWarning('Will not trigger pending props - Component Unmounted');
            this.logVerbose('Triggering pending props');
            this._deriveStateFromProps(this.pending.props, Object.assign(Object.assign({}, state), this.pending.state));
        };
        // ######################### Render #########################
        this.renderLoader = () => {
            return React.createElement("div", { className: 'loader-container' },
                React.createElement(frontend_1.TS_Loader, null));
        };
        const _render = (_a = this.render) === null || _a === void 0 ? void 0 : _a.bind(this);
        this.render = () => {
            const toRet = () => {
                if (this.state.componentPhase === ComponentStatus.Loading)
                    return this.renderLoader();
                return React.createElement(React.Fragment, null,
                    _render(),
                    this.state.componentPhase === ComponentStatus.Syncing &&
                        React.createElement("div", { className: 'loader-transparent-container' },
                            React.createElement(frontend_1.TS_Loader, null)));
            };
            return React.createElement(frontend_1.TS_ErrorBoundary, { onError: this.reDeriveState, error: this.state.error }, toRet());
        };
    }
    // ######################### Life Cycle #########################
    __onSyncStatusChanged(module) {
        this.logVerbose(`__onSyncStatusChanged: ${module.getCollectionName()}`);
        const modules = (0, ts_common_1.resolveContent)(this.props.modules);
        if (modules === null || modules === void 0 ? void 0 : modules.includes(module))
            this.reDeriveState();
    }
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
    _deriveStateFromProps(nextProps, partialState = this.createInitialState(nextProps)) {
        const currentState = partialState;
        const modules = (0, ts_common_1.resolveContent)(this.props.modules);
        const unpreparedModules = (modules === null || modules === void 0 ? void 0 : modules.filter(module => module.getDataStatus() !== consts_1.DataStatus.ContainsData)) || [];
        if (unpreparedModules.length > 0) {
            const state = this.createInitialState(nextProps);
            this.logVerbose(`Component not ready ${unpreparedModules.map(module => module.getName()).join(', ')}`, state);
            return state;
        }
        if (this.derivingState) {
            this.logVerbose('Scheduling new props', nextProps);
            this.pending = { props: nextProps, state: partialState };
            return;
        }
        this.logDebug('Will derive state from props', nextProps);
        this.pending = undefined;
        this.derivingState = true;
        this.deriveStateFromProps(nextProps, Object.assign(Object.assign({}, partialState), { componentPhase: ComponentStatus.Synced }))
            .then((state) => {
            if (this.pending)
                return this.reDeriveCompletedCallback(state);
            if (!this.mounted)
                return this.logWarning('Will not set derived state - Component Unmounted');
            this.logDebug(`resolved state: `, state);
            if (state)
                this.setState(state, this.reDeriveCompletedCallback);
        })
            .catch(e => {
            this.logError(`error`, e);
            if (!this.mounted)
                return this.logWarning('Will not set derived error state - Component Unmounted');
            this.setState({ error: e }, this.reDeriveCompletedCallback);
        });
        this.logDebug(`state: `, currentState);
        return currentState;
    }
    createInitialState(nextProps) {
        return { componentPhase: ComponentStatus.Loading };
    }
}
exports.SmartComponent = SmartComponent;
//# sourceMappingURL=SmartComponent.js.map