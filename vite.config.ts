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
                        id: 'fgc_input',
                        title: 'Foreground Color',
                        colorClass: 'var(--c-fg)',
                        colorValue: 'FFFFFF',
                    }),
                );
                html = html.replace(
                    '<!-- {{bgcPicker}} -->',
                    await colorPickerBuild({
                        id: 'bgc_input',
                        title: 'Background Color',
                        colorClass: 'var(--c-bg)',
                        colorValue: '000000',
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
