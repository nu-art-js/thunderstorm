import * as React from 'react';

export type ThunderAppWrapperProps = {
	element: React.ElementType<{}>
}

export type ThunderAppWrapper = (props: ThunderAppWrapperProps) => React.ReactNode;