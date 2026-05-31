import { defaultComponentBuild } from './_default_node';

export interface SelectOptionVars {
    value: string;
    label: string;
    selected: boolean;
}

export async function buildSelectOption(
    vars: SelectOptionVars,
): Promise<string> {
    const html = await defaultComponentBuild('select_option.html', {
        ...vars,
        selected: vars.selected ? 'selected' : '',
    });
    return html;
}
