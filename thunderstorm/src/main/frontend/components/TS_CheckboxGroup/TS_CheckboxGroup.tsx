import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import './TS_CheckboxGroup.scss';
import {TS_Checkbox} from '../TS_Checkbox';
import { LL_V_L } from '../Layouts';
import {BadImplementationException} from "@nu-art/ts-common";

type CheckboxOption = {
    id: string;
    label: string;
    disabled?: boolean;
}

export type Props_CheckboxGroup = {
    parent: CheckboxOption;
    options: CheckboxOption[];
    id?: string;
    className?: string;
    selectedIds?: string[];
    onChange?: (selectedIds: string[]) => void;
};

type State_CheckboxGroup = {
    selectedIds: Set<string>;
    parent: CheckboxOption;
    options: CheckboxOption[];
    allSelected: boolean;
    someSelected: boolean;
    className?: string;
};

/**
 * Checkbox Group Component
 * Handles grouped selection logic for checkboxes.
 */
export class TS_CheckboxGroup extends ComponentSync<Props_CheckboxGroup, State_CheckboxGroup> {
    constructor(p: Props_CheckboxGroup) {
        super(p);
    }

    protected deriveStateFromProps(nextProps: Props_CheckboxGroup, state: State_CheckboxGroup) {
        state.selectedIds = new Set(nextProps.selectedIds || []);
        state.allSelected = nextProps.selectedIds?.length === nextProps.options.length ?? false;
        state.options = nextProps.options;
        if (!state.options.length)
            throw new BadImplementationException('cannot have checkbox group without options');

        state.parent = nextProps.parent;
        state.className = nextProps.className;

        return state;
    }

    private onClickFather = () => {
        const { options, allSelected, selectedIds } = this.state;

        const selectableOptions = options.filter(option => !option.disabled);
        const newSelectedIds = allSelected || selectableOptions.length === selectedIds.size ? new Set<string>() : new Set(selectableOptions.map(option => option.id));

        this.setState({
            selectedIds: newSelectedIds,
            allSelected: newSelectedIds.size === options.length,
            someSelected: newSelectedIds.size > 0 && !allSelected
        });
        this.props.onChange?.([...newSelectedIds]);
    };

    private onClickCheckbox = (id: string) => {
        const { options } = this.state;

        const newSelectedIds = new Set(this.state.selectedIds);
        this.state.selectedIds.has(id) ? newSelectedIds.delete(id) : newSelectedIds.add(id);

        const allSelected = newSelectedIds.size === options.length;
        this.setState({
            selectedIds: newSelectedIds,
            someSelected: newSelectedIds.size > 0 && newSelectedIds.size < options.length,
            allSelected
        });

        this.props.onChange?.([...newSelectedIds]);
    };

    render() {
        const { selectedIds, someSelected, allSelected, options, parent, className } = this.state;

        return (
            <LL_V_L className={_className('ts-checkbox-group', className)} id={this.props.id}>
                <TS_Checkbox
                    checked={allSelected}
                    className={_className('ts-checkbox-group__parent', someSelected && 'ts-checkbox-group__partial')}
                    disabled={parent.disabled}
                    onCheck={this.onClickFather}>
                    {parent.label}
                </TS_Checkbox>
                <LL_V_L className={'ts-checkbox-group__children'}>
                    {options.map(option => (
                        <TS_Checkbox
                            key={option.id}
                            checked={selectedIds.has(option.id)}
                            disabled={option.disabled || parent.disabled}
                            onCheck={() => this.onClickCheckbox(option.id)}>
                            {option.label}
                        </TS_Checkbox>
                    ))}
                </LL_V_L>
            </LL_V_L>
        );
    }
}
