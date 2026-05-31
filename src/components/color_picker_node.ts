import { defaultComponentBuild } from './_default_node';
import { sliderBuild } from './slider_node';

interface Vars {
    inputId: string;
    title: string;
    colorVar: string;
}

export async function colorPickerBuild(vars: Vars): Promise<string> {
    let html = await defaultComponentBuild('color_picker.html', vars);
    const rSlider = await sliderBuild({
        id: `${vars.inputId}_slider_r`,
    });
    const gSlider = await sliderBuild({
        id: `${vars.inputId}_slider_g`,
    });
    const bSlider = await sliderBuild({
        id: `${vars.inputId}_slider_b`,
    });
    html = html.replaceAll('{{slider_r}}', rSlider);
    html = html.replaceAll('{{slider_g}}', gSlider);
    html = html.replaceAll('{{slider_b}}', bSlider);
    return html;
}
