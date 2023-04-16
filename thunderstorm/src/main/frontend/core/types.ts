import * as React from 'react';


export type ThunderAppWrapperProps<P extends {} = {}> = {
	element: React.ElementType<P>
	props?: P
}

export type ThunderAppWrapper = (props: ThunderAppWrapperProps) => React.ReactNode;