import { defaultComponentBuild } from './_default_node';
import { buildSelectOption, type SelectOptionVars } from './select_option_node';

export interface SelectVars {
    id: string;
    label: string;
    options: SelectOptionVars[];
}

export async function buildSelect(vars: SelectVars): Promise<string> {
    const options: string[] = [];
    for (let i = 0; i < vars.options.length; i++) {
        const optionsVars = vars.options[i];
        options.push(await buildSelectOption(optionsVars));
    }
    console.log(options);
    const html = defaultComponentBuild('select.html', {
        ...vars,
        options: options.join('\n'),
    });
    return html;
}
