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
import './TS_AppTools.scss';
import { LL_H_C, LL_V_L } from '@nu-art/thunder-widgets';
import { _className, StorageKey } from '@nu-art/web-client';
import { TS_ErrorBoundary } from '@nu-art/thunder-widgets';
import { TS_NavLink } from '@nu-art/thunder-routing';
import { md5, sortArray, ThisShouldNotHappenException } from '@nu-art/ts-common';
import { Outlet } from 'react-router-dom';
import { TS_AppTools_Default } from './TS_AppTools_Default.js';
import { TS_Icons } from '@nu-art/ts-styles';
import { TS_CollapsableContainer } from '@nu-art/thunder-widgets';
const noGroupLabel = 'Other';
const collapseStateStorage = new StorageKey('app-tools-collapse-state');
export class TS_AppTools extends React.Component {
    // ######################### Static #########################
    static Route;
    static screens;
    static headerTail;
    static onMountCallback;
    static createRoute(screens, path = 'app-tools', headerTail, onMountCallback) {
        this.screens = screens;
        this.headerTail = headerTail;
        this.onMountCallback = onMountCallback;
        return this.Route = {
            path,
            key: 'app-tools',
            Component: this,
            children: [
                TS_AppTools_Default.Route,
                ...TS_AppTools.screens.map(screen => {
                    return ({
                        key: screen.key || (screen.key = screen.name),
                        path: md5(screen.name),
                        Component: screen.renderer,
                        modulesToAwait: screen.modulesToAwait,
                        children: screen.children
                    });
                }),
            ]
        };
    }
    static renderPageHeader(title) {
        return _jsx("div", { className: 'app-tools-page__page__header', children: title });
    }
    // ######################### Life Cycle #########################
    constructor(props) {
        super(props);
        const collapse = collapseStateStorage.get();
        this.state = {
            navbarCollapse: collapse?.navbarCollapse ?? false,
            groups: collapse?.groups ?? {},
        };
    }
    componentDidMount() {
        TS_AppTools.onMountCallback?.();
    }
    // ######################### Logic #########################
    toggleGroupCollapse = (key) => {
        const collapse = { ...this.state };
        collapse.groups[key] = !collapse.groups[key];
        this.setState(collapse);
        collapseStateStorage.set(collapse);
    };
    toggleNavBarCollapse = () => {
        const collapse = { ...this.state };
        collapse.navbarCollapse = !collapse.navbarCollapse;
        this.setState(collapse);
        collapseStateStorage.set(collapse);
    };
    groupsSort = (g1, g2) => {
        if (g1.label === noGroupLabel)
            return 1;
        if (g2.label === noGroupLabel)
            return -1;
        return g1.label > g2.label ? -1 : 1;
    };
    groupScreens = (screens) => {
        let groups = screens.reduce((acc, curr) => {
            if (!curr.group) {
                acc[0].screens.push(curr);
                return acc;
            }
            let index = acc.findIndex(i => i.label === curr.group);
            if (index < 0) {
                acc.push({ label: curr.group, screens: [] });
                index = acc.length - 1;
            }
            acc[index].screens.push(curr);
            return acc;
        }, [{ label: noGroupLabel, screens: [] }]);
        groups = groups.sort(this.groupsSort);
        return groups;
    };
    // ######################### Render #########################
    render() {
        return _jsxs(LL_V_L, { className: 'ts-app-tools', children: [this.renderHeader(), _jsxs(LL_H_C, { className: 'ts-app-tools__main', children: [this.renderNavbar(), _jsx(TS_ErrorBoundary, { children: this.renderPage() })] })] });
    }
    renderHeader = () => {
        return _jsxs(LL_H_C, { className: 'ts-app-tools__header', children: [_jsx(TS_Icons.menu.component, { className: 'ts-app-tools__header__caret', onClick: this.toggleNavBarCollapse }), _jsx("span", { className: 'ts-app-tools__header__title', children: "App-Tools" }), TS_AppTools.headerTail && TS_AppTools.headerTail()] });
    };
    renderNavbar = () => {
        const screens = sortArray(TS_AppTools.screens, i => i.name);
        const groups = this.groupScreens(screens);
        const className = _className('ts-app-tools__nav-bar', this.state.navbarCollapse ? 'ts-app-tools__nav-bar-collapsed' : undefined);
        if (groups.length === 1) {
            return _jsx(LL_V_L, { className: className, children: screens.map(this.renderNavbarItem) });
        }
        return _jsx(LL_V_L, { className: className, children: groups.map(group => {
                return _jsx(TS_CollapsableContainer, { headerRenderer: group.label, containerRenderer: group.screens.map(this.renderNavbarItem), customCaret: _jsx(TS_Icons.treeCollapse.component, {}), flipHeaderOrder: true, onCollapseToggle: () => this.toggleGroupCollapse(group.label), collapsed: this.state.groups[group.label] }, group.label);
            }) });
    };
    renderNavbarItem = (screen) => {
        const route = TS_AppTools.Route.children.find(i => i.key === screen.key);
        if (!route)
            throw new ThisShouldNotHappenException(`Couldn't find route for screen with key ${screen.name}`);
        const Icon = screen.icon ?? TS_Icons.gear.component;
        return _jsxs(TS_NavLink, { route: route, className: ({ isActive }) => _className('ts-app-tools__nav-bar__item', isActive ? 'selected' : undefined), children: [_jsx(Icon, {}), _jsx("div", { className: 'ts-app-tools__nav-bar__item__title', children: screen.name })] }, screen.key);
    };
    renderPage = () => {
        return _jsx("div", { className: "ts-app-tools__page", children: _jsx(Outlet, {}) });
    };
}
//# sourceMappingURL=TS_AppTools.js.map