import * as React from 'react';
import { ComponentClass, FunctionComponent } from 'react';
import { ResolvableContent } from '@nu-art/ts-common';
import { AwaitSync } from '../components/AwaitSync/AwaitSync.js';
import { AwaitModule_LoaderProps, AwaitModules } from '../components/AwaitModules/AwaitModules.js';
import { ModuleFE_BaseDB } from "@nu-art/thunder-routing";
export type RouteAwaiterOptions = {
    modules?: ResolvableContent<(ModuleFE_BaseDB<any>)[]>;
    awaitSync?: boolean;
    awaitModulesLoader?: ResolvableContent<React.ReactNode, [
        AwaitModule_LoaderProps
    ]>;
    awaitSyncLoader?: ResolvableContent<React.ReactNode>;
};
/**
 * Wraps a React component with AwaitSync and/or AwaitModules based on provided options.
 * This utility function handles all combinations of awaiting behavior for route components.
 *
 * @param Component - The component to wrap (can be class or function component)
 * @param options - Optional configuration for awaiting behavior
 * @returns A wrapped component function that handles awaiting logic
 *
 * @example
 * ```typescript
 * const route: TS_Route = {
 *   key: 'my-route',
 *   path: '/my-route',
 *   Component: withRouteAwaiters(MyComponent, {
 *     modules: [ModuleA, ModuleB],
 *     awaitSync: true
 *   })
 * };
 * ```
 */
export function withRouteAwaiters(Component: React.ComponentType, options?: RouteAwaiterOptions): React.ComponentType {
    // No awaiting options provided, return component as-is
    if (!options || (!options.modules && !options.awaitSync)) {
        return Component;
    }
    const shouldAwaitModules = !!options.modules;
    const shouldAwaitSync = !!options.awaitSync;
    // Helper to render component (handles both class and function components)
    const renderComponent = () => {
        const isClassComponent = Component.prototype?.render !== undefined;
        if (isClassComponent) {
            const ClassComponent = Component as ComponentClass;
            return <ClassComponent />;
        }
        const FunctionComponent = Component as FunctionComponent;
        return FunctionComponent({});
    };
    // Wraps with AwaitModules
    const awaitModules = (child: React.ReactNode): React.ReactNode => {
        return <AwaitModules modules={options.modules!} customLoader={options.awaitModulesLoader}>
			{child}
		</AwaitModules>;
    };
    // Wraps with AwaitSync
    const awaitSync = (child: React.ReactNode): React.ReactNode => {
        return <AwaitSync customLoader={options.awaitSyncLoader}>
			{child}
		</AwaitSync>;
    };
    // Compose based on what needs to be awaited
    if (shouldAwaitModules && shouldAwaitSync) {
        return (() => awaitSync(awaitModules(renderComponent()))) as React.ComponentType;
    }
    if (shouldAwaitModules) {
        return (() => awaitModules(renderComponent())) as React.ComponentType;
    }
    if (shouldAwaitSync) {
        return (() => awaitSync(renderComponent())) as React.ComponentType;
    }
    // Fallback (should not reach here, but TypeScript needs it)
    return Component;
}
