import { Component, HTMLProps, ReactNode } from 'react';
import './FrameLayout.scss';
export declare class FrameLayout extends Component<HTMLProps<HTMLDivElement> & {
    children: ReactNode;
}, any> {
    render(): JSX.Element;
}
