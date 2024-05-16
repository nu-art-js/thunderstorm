export type InferProps<Component extends React.Component<any>> = Component extends React.Component<infer Props> ? Props : never;
export type InferState<Component extends React.Component<any, any>> = Component extends React.Component<any, infer State> ? State : never;
export type DefaultProps<Component extends React.Component<any>> = Partial<InferProps<Component>>;
