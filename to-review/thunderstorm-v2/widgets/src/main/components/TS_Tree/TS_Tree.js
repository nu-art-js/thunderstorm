import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Fragment } from 'react';
import { _className } from "@nu-art/thunder-routing";
import './TS_Tree.scss';
import { ComponentSync } from "@nu-art/thunder-routing";
import { _keys, exists } from '@nu-art/ts-common';
const ignoreToggler = () => {
};
export class TS_Tree extends ComponentSync {
    // ######################## Static ########################
    static defaultProps = {
        checkExpanded: (expanded, path) => expanded[path]
    };
    containerRefs = {};
    rendererRefs = {};
    // ######################## Life Cycle ########################
    constructor(props) {
        super(props);
    }
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return true;
    }
    deriveStateFromProps(nextProps) {
        return {
            adapter: nextProps.adapter,
            expanded: nextProps.expanded ?? this.state?.expanded ?? { '/': nextProps.startTreeOpen ?? true },
            isSelected: nextProps.isSelected,
            selected: {
                path: nextProps.selectedPath,
                item: nextProps.selectedItem
            }
        };
    }
    componentDidUpdate() {
        if (!this.props.scrollSelectedIntoView || !(this.state.selected?.item || this.state.selected?.path) || !this.props.containerRef?.current)
            return;
        const itemPath = this.state.selected.path ?? _keys(this.rendererRefs).find(key => this.getItemByPath(key) === this.state.selected.item);
        const childRect = this.rendererRefs[itemPath].getBoundingClientRect();
        const containerRect = this.props.containerRef.current.getBoundingClientRect();
        const inView = (childRect.top >= containerRect.top) && (childRect.bottom <= containerRect.top + this.props.containerRef.current.clientHeight);
        if (!inView) {
            const scrollTop = childRect.top - containerRect.top;
            const scrollBot = childRect.bottom - containerRect.bottom;
            let scroll = this.props.containerRef.current.scrollTop;
            if (Math.abs(scrollTop) < Math.abs(scrollBot))
                scroll += scrollTop;
            else
                scroll += scrollBot;
            this.props.containerRef.current.scroll({ top: scroll });
        }
    }
    // ######################## Logic ########################
    onNodeClicked = (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        if (!path)
            return this.logError('No Path for tree node:', e);
        //FIXME: consider typing the return from resolveItemFromPath instead of limiting the return to just the item
        this.props.onNodeClicked?.(path, TS_Tree.resolveItemFromPath(this.state.adapter.data, path));
    };
    onContextMenuClicked = (e) => {
        const path = e.currentTarget.getAttribute('data-path');
        if (!path)
            return this.logError('No Path for tree node:', e);
        //FIXME: consider typing the return from resolveItemFromPath instead of limiting the return to just the item
        this.props.onContextMenuClicked?.(e, path, TS_Tree.resolveItemFromPath(this.state.adapter.data, path));
    };
    nodeResolver(nodePath, renderChildren, filteredKeys) {
        return (_ref) => {
            if (this.rendererRefs[nodePath])
                return;
            this.rendererRefs[nodePath] = _ref;
            if (this.containerRefs[nodePath] && renderChildren && filteredKeys.length > 0)
                this.forceUpdate();
        };
    }
    resolveContainer(nodePath, renderChildren, filteredKeys) {
        return (_ref) => {
            if (this.containerRefs[nodePath])
                return;
            this.containerRefs[nodePath] = _ref;
            if (renderChildren && filteredKeys.length > 0)
                this.forceUpdate();
        };
    }
    getItemByPath(path) {
        return TS_Tree.resolveItemFromPath(this.state.adapter.data, path);
    }
    static resolveItemFromPath(data, path) {
        if (!path)
            return;
        let item = data;
        const hierarchy = path.split('/');
        hierarchy.shift();
        for (const el of hierarchy) {
            if (el) {
                item = item[el];
                if (!item)
                    return;
            }
        }
        return item;
    }
    toggleExpandState = (e, _expanded) => this.expandOrCollapse(this.resolveTreeNode(e.currentTarget), _expanded);
    expandOrCollapse = (path, forceExpandState) => {
        if (path === '/' && this.state.adapter.hideRoot && forceExpandState === false)
            return;
        const treeExpandedState = this.state.expanded;
        const currentExpandState = treeExpandedState[path];
        const newExpandState = exists(forceExpandState) ? forceExpandState : !currentExpandState;
        if (newExpandState)
            treeExpandedState[path] = newExpandState;
        else
            delete treeExpandedState[path];
        this.forceUpdate();
    };
    resolveTreeNode(currentTarget) {
        if (!currentTarget) {
            this.logError('Could not find node!!');
            return '';
        }
        if (!currentTarget.getAttribute('data-path'))
            return this.resolveTreeNode(currentTarget.parentElement || undefined);
        return currentTarget.getAttribute('data-path') || '';
    }
    // ######################## Render ########################
    renderNode = (_data, key, _path, level) => {
        const nodePath = `${_path}${key}/`;
        const adjustedNode = this.state.adapter.adjust(_data);
        const data = adjustedNode.data;
        let filteredKeys = [];
        const alwaysExpanded = exists(_data) && typeof _data === 'object' && _data.alwaysExpanded;
        let expanded = alwaysExpanded || !!this.props.checkExpanded(this.state.expanded, nodePath, data);
        if (nodePath.endsWith('_children/'))
            expanded = true;
        let renderChildren = expanded;
        if (typeof data !== 'object')
            renderChildren = false;
        if (renderChildren)
            filteredKeys = this.state.adapter.getFilteredChildren(_data);
        const nodeRefResolver = this.nodeResolver(nodePath, renderChildren, filteredKeys);
        const containerRefResolver = this.resolveContainer(nodePath, renderChildren, filteredKeys);
        const isSelected = this.state.isSelected?.(_data) || _data === this.state.selected.item;
        return _jsxs(Fragment, { children: [this.renderItem(data, nodePath, key, nodeRefResolver, level, isSelected, expanded), this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver)] }, nodePath);
    };
    renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver) {
        if (!(filteredKeys.length > 0 && renderChildren))
            return;
        const containerRef = this.containerRefs[nodePath];
        return (_jsx("div", { className: "ts-tree__children-container", ref: containerRefResolver, children: containerRef && filteredKeys.map((childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + '/' : ''), level + 1)) }));
    }
    renderItem(item, path, key, nodeRefResolver, level, isSelected, expanded) {
        if (this.state.adapter.hideRoot && path.length === 1)
            return null;
        const TreeNodeRenderer = this.state.adapter.treeNodeRenderer;
        // console.log("isParent: ", this.state.adapter.isParent(item));
        const isParent = this.state.adapter.isParent(item);
        const node = {
            adapter: this.state.adapter,
            propKey: key,
            path,
            item,
            expandToggler: isParent ? this.toggleExpandState : ignoreToggler,
            expandFromNode: expand => this.expandOrCollapse(path, expand),
            expanded: !!expanded,
        };
        if (this.state.adapter.childrenKey === key)
            return null;
        const className = _className('ts-tree__node', isParent && 'ts-tree__parent-node', isSelected && 'ts-tree__selected-node', `depth-${level}`);
        return _jsx("div", { tabIndex: this.props.indexTreeNodes ? 1 : undefined, "data-path": path, className: className, ref: nodeRefResolver, onClick: this.onNodeClicked, onContextMenu: this.onContextMenuClicked, children: _jsx(TreeNodeRenderer, { item: item, node: node }) });
    }
    render() {
        return _jsx("div", { className: _className('ts-tree', this.props.className), style: this.props.treeContainerStyle, children: this.renderNode(this.state.adapter.data, '', '', (this.state.adapter.hideRoot ? -1 : 0)) });
    }
}
//# sourceMappingURL=TS_Tree.js.map