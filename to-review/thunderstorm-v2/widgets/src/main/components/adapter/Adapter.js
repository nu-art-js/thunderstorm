import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { _keys, BadImplementationException, } from '@nu-art/ts-common';
import { SimpleTreeNodeRenderer } from '../TS_Tree/SimpleTreeNodeRenderer.js';
import { _className } from "@nu-art/thunder-routing";
export class BaseAdapter {
    data;
    childrenKey;
    constructor(data) {
        this.data = data;
    }
    setData(data) {
        this.data = data;
        return this;
    }
    filter = (obj, key) => true;
    // by default all objects and arrays are parents
    isParent = (obj) => {
        if (obj === undefined || obj === null)
            return false;
        if (!this.childrenKey)
            return Array.isArray(obj) || typeof obj === 'object';
        return typeof obj === 'object' && obj['_isParent'] === true || Array.isArray(obj);
    };
    hadChildren = (obj) => {
        if (!this.isParent(obj))
            return false;
        return obj['length'] > 0;
    };
    // this can be gone.. and builders must use the new filterChildren
    getFilteredChildren(obj) {
        if (obj === undefined || obj === null)
            return [];
        if (typeof obj !== 'object')
            return [];
        if (Array.isArray(obj))
            return _keys(obj);
        if (!this.childrenKey)
            return _keys(obj).filter(k => this.filter(obj, k));
        const objElement = obj[this.childrenKey];
        if (!objElement)
            return [];
        return _keys(objElement);
    }
    // this to allow us to navigate and skip into nested items in an object without changing the object
    // adjust = (obj: any): { data: any; deltaPath: string } => this.adjustImpl(obj, "_children");
    adjust = (obj) => {
        if (!this.childrenKey)
            return ({ data: obj, deltaPath: '' });
        if (!obj[this.childrenKey])
            return { data: obj, deltaPath: '' };
        const objElement = { ...obj[this.childrenKey], type: obj.type, item: obj.item, _isParent: true, length: obj[this.childrenKey].length, alwaysExpanded: obj.alwaysExpanded };
        return { data: objElement, deltaPath: this.childrenKey || '' };
    };
    clone(baseAdapter) {
        _keys(this).forEach(k => {
            baseAdapter[k] = this[k];
        });
        return baseAdapter;
    }
}
export class Adapter extends BaseAdapter {
    hideRoot = false;
    treeNodeRenderer = SimpleTreeNodeRenderer;
    setTreeNodeRenderer(renderer) {
        this.treeNodeRenderer = renderer;
        return this;
    }
    resolveRenderer(propKey) {
        return (pah) => null;
    }
}
class BaseAdapterBuilder {
    data;
    treeNodeRenderer;
    multiRenderer = false;
    expandCollapseRenderer;
    filter = (obj, key) => true;
    childrenKey;
    constructor() {
        this.expandCollapseRenderer = this.defaultExpandCollapseRenderer;
    }
    setData(data) {
        this.data = data;
        return this;
    }
    setNodeRenderer(treeNodeRenderer) {
        this.treeNodeRenderer = treeNodeRenderer;
        return this;
    }
    setExpandCollapseRenderer(expandCollapseRenderer) {
        this.expandCollapseRenderer = expandCollapseRenderer;
        return this;
    }
    // Utility - move to builder
    setChildrenKey = (childrenKey) => {
        this.childrenKey = childrenKey;
        return this;
    };
    setFilter(filter) {
        this.filter = filter;
    }
    defaultExpandCollapseRenderer = (props) => {
        function resolveSymbol() {
            if (typeof props.item !== 'object')
                return '';
            if (Object.keys(props.item).length === 0)
                return '';
            if (props.node.adapter.isParent(props.item)) {
                if (props.node.expanded)
                    return '-';
                return '+';
            }
            return '';
        }
        const className = _className('node-icon', props.node.expanded ? 'expanded' : undefined);
        return _jsx("div", { className: className, style: { minWidth: '12px' }, children: resolveSymbol() });
    };
    defaultTreeNodeRenderer = (props) => {
        const _Renderer = this.resolveRenderer(props.item.type);
        return (_jsxs("div", { className: "ll_h_c clickable", onClick: props.node.expandToggler, children: [_jsx(this.expandCollapseRenderer, { ...props }), _jsx(_Renderer, { item: this.multiRenderer ? props.item.item : props.item, node: props.node })] }));
    };
}
class ListSingleAdapterBuilder extends BaseAdapterBuilder {
    renderer;
    constructor(renderer) {
        super();
        this.renderer = renderer;
        this.treeNodeRenderer = (props) => {
            const _Renderer = this.resolveRenderer();
            return _jsx(_Renderer, { item: props.item, node: props.node });
        };
    }
    resolveRenderer(type) {
        return this.renderer;
    }
    nested() {
        this.childrenKey = '_children';
        this.treeNodeRenderer = (props) => {
            const _Renderer = this.renderer;
            return _jsx(_Renderer, { ...props });
        };
        return this;
    }
    build() {
        const adapter = new Adapter(this.data);
        adapter.hideRoot = true;
        adapter.treeNodeRenderer = this.treeNodeRenderer;
        adapter.childrenKey = this.childrenKey;
        adapter.isParent = (obj) => obj === this.data;
        // @ts-ignore
        adapter.itemRenderer = this.renderer;
        return adapter;
    }
}
class MultiTypeAdapterBuilder extends BaseAdapterBuilder {
    rendererMap;
    _hideRoot = true;
    constructor(rendererMap) {
        super();
        this.multiRenderer = true;
        this.rendererMap = rendererMap;
        this.childrenKey = '_children';
        this.treeNodeRenderer = (props) => {
            const _Renderer = this.resolveRenderer(props.item.type);
            return _jsx(_Renderer, { item: props.item.item, node: props.node });
        };
    }
    resolveRenderer = (type) => {
        if (!type)
            throw new BadImplementationException('multi renderer adapter items must have a type to resolve renderer');
        const renderer = this.rendererMap[type];
        if (!renderer)
            throw new BadImplementationException(`renderer of type ${type} doesn't exists, in rendererMap found keys: ${JSON.stringify(_keys(this.rendererMap))}`);
        return renderer;
    };
    tree() {
        this.treeNodeRenderer = this.defaultTreeNodeRenderer;
        this._hideRoot = false;
        return this;
    }
    hideRoot() {
        this._hideRoot = true;
        return this;
    }
    build() {
        const adapter = new Adapter(this.data);
        adapter.hideRoot = this._hideRoot;
        adapter.treeNodeRenderer = this.treeNodeRenderer;
        adapter.resolveRenderer = this.resolveRenderer;
        adapter.childrenKey = this.childrenKey;
        return adapter;
    }
}
class TreeSingleAdapterBuilder extends BaseAdapterBuilder {
    renderer;
    _hideRoot = false;
    constructor(renderer) {
        super();
        this.renderer = renderer;
        this.treeNodeRenderer = this.defaultTreeNodeRenderer;
    }
    resolveRenderer(type) {
        return this.renderer;
    }
    hideRoot() {
        this._hideRoot = true;
        return this;
    }
    build() {
        const adapter = new Adapter(this.data);
        adapter.treeNodeRenderer = this.treeNodeRenderer;
        adapter.hideRoot = this._hideRoot;
        return adapter;
    }
}
class ListAdapterBuilder {
    singleRender(renderer) {
        return new ListSingleAdapterBuilder(renderer);
    }
    multiRender(rendererMap) {
        return new MultiTypeAdapterBuilder(rendererMap);
    }
    multiRenderV3(rendererMap) {
        return new MultiTypeAdapterBuilder(rendererMap);
    }
}
class TreeAdapterBuilder {
    singleRender(renderer) {
        return new TreeSingleAdapterBuilder(renderer);
    }
    multiRender(rendererMap) {
        return new MultiTypeAdapterBuilder(rendererMap).tree();
    }
}
class _AdapterBuilder {
    list() {
        return new ListAdapterBuilder();
    }
    tree() {
        return new TreeAdapterBuilder();
    }
}
export function AdapterBuilder() {
    return new _AdapterBuilder();
}
export function SimpleTreeAdapter(options, renderer) {
    return AdapterBuilder()
        .tree()
        .singleRender(renderer)
        .setData(options)
        .build();
}
export function SimpleListAdapter(options, renderer) {
    return AdapterBuilder()
        .list()
        .singleRender(renderer)
        .setData(options)
        .build();
}
//# sourceMappingURL=Adapter.js.map