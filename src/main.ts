import { Application, Container, Graphics } from 'pixi.js';
import { versionsInfo } from './versions-info';
import { vec2 } from './math/vec2';
import { GridTransform } from './utils/grid_transform';
import { QRCode } from './qrcode';

console.log('Hello world!');

async function main(): Promise<void> {
    const app = new Application();
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    await app.init({ background: '#ffffff', resizeTo: canvas, canvas });
    const container = new Container();
    app.stage.addChild(container);

    const canvasSize = vec2(canvas.clientWidth, canvas.clientHeight);
    const codeSize = vec2(versionsInfo['1'].size, versionsInfo['1'].size);
    const code = new QRCode('Hello, world!', codeSize);
    // const value = 'Hello, world!';
    // const valueBytes = new TextEncoder().encode(value);
    //
    // const code = mat([]);
    // const mask = mat([]);
    // for (let y = 0; y < codeSize.y; y++) {
    //     const row: number[] = [];
    //     const maskRow: number[] = [];
    //     for (let x = 0; x < codeSize.x; x++) {
    //         const idx = y * codeSize.x + x;
    //         row.push(idx % 4 ? 1 : 0);
    //         maskRow.push(x % 2 ? 1 : 0);
    //     }
    //     code.data.push(row);
    //     mask.data.push(maskRow);
    // }
    const gt = new GridTransform(codeSize, canvasSize);

    // const compCode = code.mulEl(mask);
    for (let y = 0; y < code.bits.data.length; y++) {
        for (let x = 0; x < code.bits.data[y].length; x++) {
            const [tl, br] = gt.out(vec2(x, y));
            const g = new Graphics();
            g.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
            // g.fill(compCode.data[y][x] ? 0x000000 : 0xffffff);
            g.fill(code.bits.data[y][x] ? 0x000000 : 0xffffff);
            container.addChild(g);
        }
    }

    app.ticker.add((_time) => {});
}
main().catch((err) => {
    console.error(err);
});
