import { Application, Container, Graphics } from 'pixi.js';
import { vec2 } from './math/vec2';
import { GridTransform } from './utils/grid_transform';
import { Qr } from './qr';

console.log('Hello world!');

function drawQrCode(
    code: Qr,
    canvas: HTMLCanvasElement,
    container: Container,
): void {
    container.removeChildren();
    const canvasSize = vec2(canvas.clientWidth, canvas.clientHeight);
    const quietZone = 4;
    const gt = new GridTransform(
        code.info.size.add(vec2(quietZone * 2)),
        canvasSize,
    );
    // const compCode = code.mulEl(mask);
    for (let y = 0; y < code.bits.data.length; y++) {
        for (let x = 0; x < code.bits.data[y].length; x++) {
            const [tl, br] = gt.out(vec2(x + quietZone, y + quietZone));
            const g = new Graphics();
            g.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
            // g.fill(compCode.data[y][x] ? 0x000000 : 0xffffff);
            const val = code.bits.data[y][x];
            switch (val) {
                case 2:
                    g.fill(0xff0000);
                    break;
                case 3:
                    g.fill(0x00ff00);
                    break;
                case 4:
                    g.fill(0x0000ff);
                    break;
                case 100:
                    g.fill(0x000000);
                    break;
                case 101:
                    g.fill(0x220000);
                    break;
                case 102:
                    g.fill(0x440000);
                    break;
                case 103:
                    g.fill(0x660000);
                    break;
                case 104:
                    g.fill(0x880000);
                    break;
                case 105:
                    g.fill(0xaa0000);
                    break;
                case 106:
                    g.fill(0xcc0000);
                    break;
                case 107:
                    g.fill(0xee0000);
                    break;
                default:
                    g.fill(code.bits.data[y][x] ? 0x000000 : 0xffffff);
                    break;
            }
            container.addChild(g);
        }
    }
    // for (let y = 0; y < code.maskData.data.length; y++) {
    //     for (let x = 0; x < code.maskData.data[y].length; x++) {
    //         const [tl, br] = gt.out(vec2(x + quietZone, y + quietZone));
    //         // g.fill(compCode.data[y][x] ? 0x000000 : 0xffffff);
    //         const val = code.maskData.data[y][x];
    //         if (!val) {
    //             continue;
    //         }
    //         const g = new Graphics({
    //             alpha: 0.2,
    //         });
    //         g.rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    //         g.fill(0xff0000);
    //         container.addChild(g);
    //     }
    // }
}

async function main(): Promise<void> {
    const app = new Application();
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    await app.init({ background: '#ffffff', resizeTo: canvas, canvas });
    const container = new Container();
    app.stage.addChild(container);
    const input = document.getElementById('input') as HTMLInputElement;
    if (!input) {
        throw new Error('Input element not found');
    }
    input.addEventListener('input', () => {
        code.setData(input.value);
        drawQrCode(code, canvas, container);
        infoEl.innerHTML = `Version: ${code.info.version}<br/> EC Level: ${code.info.ecLevel}<br/> Mode: ${code.info.mode}<br/> Data codewords: ${code.info.dataCodewords}<br/> Mask: ${code.mask}`;
    });
    const infoEl = document.getElementById('info') as HTMLDivElement;

    const code = new Qr('H', input.value);
    drawQrCode(code, canvas, container);
    infoEl.innerHTML = `Version: ${code.info.version}<br/> EC Level: ${code.info.ecLevel}<br/> Mode: ${code.info.mode}<br/> Data codewords: ${code.info.dataCodewords}<br/> Mask: ${code.mask}`;

    app.ticker.add((_time) => {});
}
main().catch((err) => {
    console.error(err);
});
