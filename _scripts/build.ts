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
    const js = await fs.readString([`assets`, `index-${scriptHash}.js`]);
    const cssHash = StringUtility.textBetween(
        indexHtml,
        '<link rel="stylesheet" crossorigin href="/assets/index-',
        '.css">',
    );
    const css = await fs.readString([`assets`, `index-${cssHash}.css`]);
    indexHtml = indexHtml
        .replace(
            `<script type="module" crossorigin src="/assets/index-${scriptHash}.js"></script>`,
            ``,
        )
        .replace('</body>', `  <script>${js}</script>\n</body>`)
        .replace(
            `<link rel="stylesheet" crossorigin href="/assets/index-${cssHash}.css">`,
            `<style>${css}</style>`,
        );
    await fs.save('index.html', indexHtml);
}
