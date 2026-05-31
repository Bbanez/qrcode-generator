import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import glsl from 'vite-plugin-glsl';
import { colorPickerBuild } from './src/components/color_picker_node';
import { buildSelect } from './src/components/select_node';

export default defineConfig({
    plugins: [
        viteSingleFile(),
        glsl(),
        {
            name: 'html-transform',
            async transformIndexHtml(html): Promise<string> {
                html = html
                    .replace(
                        '<!-- {{fgcPicker}} -->',
                        await colorPickerBuild({
                            id: 'fgc_input',
                            title: 'Foreground Color',
                            colorClass: 'var(--c-fg)',
                            colorValue: 'FFFFFFFF',
                            leftOffset: '0px',
                        }),
                    )
                    .replace(
                        '<!-- {{bgcPicker}} -->',
                        await colorPickerBuild({
                            id: 'bgc_input',
                            title: 'Background Color',
                            colorClass: 'var(--c-bg)',
                            colorValue: '000000FF',
                            leftOffset: '-100px',
                        }),
                    )
                    .replace(
                        '<!-- style_select -->',
                        await buildSelect({
                            id: 'style_select',
                            label: 'Style',
                            options: [
                                {
                                    value: 'square',
                                    label: 'Square',
                                    selected: true,
                                },
                                {
                                    value: 'dots',
                                    label: 'Dots',
                                    selected: false,
                                },
                            ],
                        }),
                    )
                    .replace(
                        '<!-- ec_level -->',
                        await buildSelect({
                            id: 'ec_level',
                            label: 'Error Correction Level',
                            options: [
                                {
                                    value: 'L',
                                    label: 'Low (7%)',
                                    selected: false,
                                },
                                {
                                    value: 'M',
                                    label: 'Medium (15%)',
                                    selected: false,
                                },
                                {
                                    value: 'Q',
                                    label: 'Quartile (25%)',
                                    selected: false,
                                },
                                {
                                    value: 'H',
                                    label: 'High (30%)',
                                    selected: true,
                                },
                            ],
                        }),
                    );
                return html;
            },
            handleHotUpdate({ server }) {
                server.ws.send({
                    type: 'full-reload',
                });
                return [];
            },
        },
    ],
});
