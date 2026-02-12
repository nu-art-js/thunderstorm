import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import * as React from 'react';
import { BaseNodeRenderer } from '../adapter/BaseRenderer.js';
export class SimpleTreeNodeRenderer extends BaseNodeRenderer {
    renderCollapse() {
        let toDisplay;
        if (typeof this.props.item !== 'object')
            toDisplay = '';
        else if (Object.keys(this.props.item).length === 0)
            toDisplay = '';
        else if (this.props.node.expanded)
            toDisplay = '-';
        else
            toDisplay = '+';
        return _jsx("div", { className: `clickable`, style: { width: '15px' }, children: toDisplay });
    }
    renderItem(item) {
        return (_jsxs("div", { className: "ll_h_c", children: [this.renderCollapse(), _jsx(SimpleNodeRenderer, { ...this.props })] }));
    }
}
export class SimpleNodeRenderer extends React.Component {
    render() {
        let label;
        const item = this.props.item;
        if (typeof item !== 'object')
            label = ` : ${item}`;
        else if (Object.keys(item).length === 0)
            label = ' : {}';
        else
            label = '';
        return ('propKey') + label;
    }
}
//# sourceMappingURL=SimpleTreeNodeRenderer.js.map