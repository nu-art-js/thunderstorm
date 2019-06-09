import * as emotion from 'emotion';

export const margin = (px: number) => emotion.css`margin: ${px}px;`;
export const marginTop = (px: number) => emotion.css`margin-top: ${px}px;`;
export const marginBottom = (px: number) => emotion.css`margin-bottom: ${px}px;`;
export const marginLeft = (px: number) => emotion.css`margin-left: ${px}px;`;
export const marginRight = (px: number) => emotion.css`margin-right: ${px}px;`;
export const padding = (px: number) => emotion.css`padding: ${px}px;`;
export const paddingLeft = (px: number) => emotion.css`padding-left: ${px}px;`;
export const paddingRight = (px: number) => emotion.css`padding-right: ${px}px;`;
export const paddingTop = (px: number) => emotion.css`padding-top: ${px}px;`;
export const paddingBottom = (px: number) => emotion.css`padding-bottom: ${px}px;`;
export const backgroundColor = (color: string) => emotion.css`background-color: ${color};`;