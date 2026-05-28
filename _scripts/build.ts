import { FS } from './utils/fs';
import path from 'path';
import { StringUtility } from './utils/string';

export async function build() {
    const fs = new FS(path.join(process.cwd(), 'dist'));
    let indexHtml = await fs.readString('index.html');
    const scriptHash = StringUtility.textBetween(
        indexHtml,
        '<script type="module" crossorigin src="/assets/index-',
        '.js"></script>',
    );
    if (scriptHash) {
        const js = await fs.readString([`assets`, `index-${scriptHash}.js`]);
        indexHtml = indexHtml
            .replace(
                `<script type="module" crossorigin src="/assets/index-${scriptHash}.js"></script>`,
                ``,
            )
            .replace('</body>', `  <script>${js}</script>\n</body>`);
        await fs.deleteFile([`assets`, `index-${scriptHash}.js`]);
    }
    const cssHash = StringUtility.textBetween(
        indexHtml,
        '<link rel="stylesheet" crossorigin href="/assets/index-',
        '.css">',
    );
    if (cssHash) {
        const css = await fs.readString([`assets`, `index-${cssHash}.css`]);
        indexHtml = indexHtml.replace(
            `<link rel="stylesheet" crossorigin href="/assets/index-${cssHash}.css">`,
            `<style>${css}</style>`,
        );
        await fs.deleteFile([`assets`, `index-${cssHash}.css`]);
    }
    await fs.save('index.html', indexHtml);
}
