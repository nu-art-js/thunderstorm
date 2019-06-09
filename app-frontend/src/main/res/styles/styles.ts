import * as emotion from 'emotion';

export const _margin = (px: number) => emotion.css`margin: ${px}px;`;
export const _marginTop = (px: number) => emotion.css`margin-top: ${px}px;`;
export const _marginBottom = (px: number) => emotion.css`margin-bottom: ${px}px;`;
export const _marginLeft = (px: number) => emotion.css`margin-left: ${px}px;`;
export const _marginRight = (px: number) => emotion.css`margin-right: ${px}px;`;
export const _padding = (px: number) => emotion.css`padding: ${px}px;`;
export const _paddingLeft = (px: number) => emotion.css`padding-left: ${px}px;`;
export const _paddingRight = (px: number) => emotion.css`padding-right: ${px}px;`;
export const _paddingTop = (px: number) => emotion.css`padding-top: ${px}px;`;
export const _paddingBottom = (px: number) => emotion.css`padding-bottom: ${px}px;`;
export const _backgroundColor = (color: string) => emotion.css`background-color: ${color};`;