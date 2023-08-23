"use strict";
/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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
exports.SmartPage = exports.dispatch_onPageTitleChanged = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const SmartComponent_1 = require("./SmartComponent");
exports.dispatch_onPageTitleChanged = new frontend_1.ThunderDispatcher('__onPageTitleChanged');
class SmartPage extends SmartComponent_1.SmartComponent {
    constructor(p) {
        var _a, _b;
        super(p);
        this.updateTitle = () => {
            const newTitle = this.resolveTitle();
            document.title = newTitle;
            this.logDebug(`Mounting page: ${newTitle}`);
            exports.dispatch_onPageTitleChanged.dispatchUI(document.title);
        };
        this.resolveTitle = () => {
            const pageTitle = this.props.pageTitle;
            if (!pageTitle)
                return '';
            return typeof pageTitle === 'function' ? pageTitle(this.state) : pageTitle;
        };
        const _componentDidMount = (_a = this.componentDidMount) === null || _a === void 0 ? void 0 : _a.bind(this);
        this.componentDidMount = () => {
            _componentDidMount === null || _componentDidMount === void 0 ? void 0 : _componentDidMount();
            this.prevTitle = document.title;
            this.updateTitle();
        };
        const _componentWillUnmount = (_b = this.componentWillUnmount) === null || _b === void 0 ? void 0 : _b.bind(this);
        this.componentWillUnmount = () => {
            _componentWillUnmount === null || _componentWillUnmount === void 0 ? void 0 : _componentWillUnmount();
            document.title = this.prevTitle;
        };
    }
    async deriveStateFromProps(nextProps, state) {
        return state;
    }
}
exports.SmartPage = SmartPage;
//# sourceMappingURL=SmartPage.js.map