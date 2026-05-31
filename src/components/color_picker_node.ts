import { defaultComponentBuild } from './_default_node';
import { sliderBuild } from './slider_node';

interface Vars {
    id: string;
    title: string;
    colorClass: string;
    colorValue: string;
    leftOffset: string;
}

export async function colorPickerBuild(vars: Vars): Promise<string> {
    let html = await defaultComponentBuild('color_picker.html', vars);
    const rSlider = await sliderBuild({
        id: `${vars.id}_slider_r`,
        parentId: vars.id,
        lineColor: 'linear-gradient(to right, #000, red)',
    });
    const gSlider = await sliderBuild({
        id: `${vars.id}_slider_g`,
        parentId: vars.id,
        lineColor: 'linear-gradient(to right, #000, green)',
    });
    const bSlider = await sliderBuild({
        id: `${vars.id}_slider_b`,
        parentId: vars.id,
        lineColor: 'linear-gradient(to right, #000, blue)',
    });
    const aSlider = await sliderBuild({
        id: `${vars.id}_slider_a`,
        parentId: vars.id,
        lineColor: 'linear-gradient(to right, #000, white)',
    });
    html = html.replaceAll('{{slider_r}}', rSlider);
    html = html.replaceAll('{{slider_g}}', gSlider);
    html = html.replaceAll('{{slider_b}}', bSlider);
    html = html.replaceAll('{{slider_a}}', aSlider);
    return html;
}
