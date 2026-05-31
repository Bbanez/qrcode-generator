import { defaultComponentBuild } from './_default_node';

export interface SliderVars {
    id: string;
    parentId: string;
    lineColor?: string;
}

export async function sliderBuild(vars: SliderVars): Promise<string> {
    if (!vars.lineColor) {
        vars.lineColor = 'white';
    }
    return defaultComponentBuild('slider.html', vars);
}
