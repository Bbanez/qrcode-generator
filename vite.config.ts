import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import glsl from 'vite-plugin-glsl';
import { colorPickerBuild } from './src/components/color_picker_node';

export default defineConfig({
    plugins: [
        viteSingleFile(),
        glsl(),
        {
            name: 'html-transform',
            async transformIndexHtml(html): Promise<string> {
                html = html.replace(
                    '<!-- {{fgcPicker}} -->',
                    await colorPickerBuild({
                        inputId: 'fgc_input',
                        title: 'Foreground Color',
                        colorVar: '--c-fg',
                    }),
                );
                html = html.replace(
                    '<!-- {{bgcPicker}} -->',
                    await colorPickerBuild({
                        inputId: 'bgc_input',
                        title: 'Background Color',
                        colorVar: '--c-bg',
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
