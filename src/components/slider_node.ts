import { defaultComponentBuild } from './_default_node';

export interface SliderVars {
    id: string;
}

export async function sliderBuild(vars: SliderVars): Promise<string> {
    return defaultComponentBuild('slider.html', vars);
}
