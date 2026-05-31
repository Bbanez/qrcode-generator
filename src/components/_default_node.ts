import { FS } from '../utils/fs';

export async function defaultComponentBuild(
    rpath: string | string[],
    vars: any,
): Promise<string> {
    const fs = new FS(__dirname);
    let html = await fs.readString(rpath);
    if (!html) {
        throw new Error(`${rpath} not found`);
    }
    for (const key in vars) {
        html = html.replaceAll(`{{${key}}}`, vars[key]);
    }
    return html;
}
