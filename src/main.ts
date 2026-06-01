import { Qr } from './qr';
import { Color } from './utils/color';
import { storage } from './storage';
import { SimpleLinearFn } from './math/simple_linear_fn';
import { vec2, Vec2 } from './math/vec2';
import {
    findChild,
    findChildByTag,
    findParent,
    findParentElById,
    waitForSelector,
} from './utils/dom';
import { QrRenderer } from './qr-renderer';
import { Sub } from './utils/sub';
import { downloadDataUrl } from './utils/download';

declare global {
    interface Window {
        qrRenderer: QrRenderer;
        SimpleLinearFn: typeof SimpleLinearFn;
        Color: typeof Color;

        Vec2: typeof Vec2;
        vec2(): Vec2;
        vec2(x: number): Vec2;
        vec2(x: number, y: number): Vec2;
        vec2(vec: Vec2): Vec2;
        vec2(arg1?: number | Vec2, arg2?: number): Vec2;

        waitForSelector<El = HTMLElement>(
            selector: string,
            timeout: number,
            doc?: Document,
        ): Promise<El | null>;
        findChildByTag<El = HTMLElement>(
            children: HTMLElement[] | HTMLCollection,
            tag: string,
        ): El | null;
        findParentElById(el: HTMLElement, id: string): HTMLElement | null;
        findChild<El = HTMLElement>(
            children: HTMLElement[] | HTMLCollection,
            query: (child: HTMLElement) => unknown,
        ): El | null;
        findParent<El = HTMLElement>(
            el: HTMLElement | null | undefined,
            query: (node: HTMLElement) => boolean,
        ): El | null;

        qrInit(): void;
        qrReady: Sub;
    }
}

window.SimpleLinearFn = SimpleLinearFn;
window.Color = Color;

window.Vec2 = Vec2;
window.vec2 = vec2;

window.waitForSelector = waitForSelector;
window.findChildByTag = findChildByTag;
window.findParentElById = findParentElById;
window.findChild = findChild;
window.findParent = findParent;

window.qrReady = new Sub();

window.qrInit = function (): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const renderer = new QrRenderer(canvas);

    const saveEl = document.getElementById('save') as HTMLButtonElement;
    if (!saveEl) {
        throw new Error('Save button element not found');
    }
    const textEl = document.getElementById('input') as HTMLInputElement;
    if (!textEl) {
        throw new Error('Input element not found');
    }
    const ecLevelEl = document.getElementById('ec_level') as HTMLSelectElement;
    if (!ecLevelEl) {
        throw new Error('EC level select element not found');
    }
    const fgColorInputEl = document.getElementById(
        'fgc_input',
    ) as HTMLInputElement;
    if (!fgColorInputEl) {
        throw new Error('Foreground color input element not found');
    }
    const bgColorInputEl = document.getElementById(
        'bgc_input',
    ) as HTMLInputElement;
    if (!bgColorInputEl) {
        throw new Error('Background color input element not found');
    }
    const styleSelectEl = document.getElementById(
        'style_select',
    ) as HTMLSelectElement;
    if (!styleSelectEl) {
        throw new Error('Style select element not found');
    }

    {
        const style = storage.get('style');
        if (style) {
            styleSelectEl.value = style;
            renderer.style = style;
        }
    }

    {
        const fgColor = storage.get('fg_color');
        if (fgColor) {
            const c = Color.fromHex(fgColor);
            if (c) {
                renderer.fgColor = c;
                document.documentElement.style.setProperty(
                    '--c-fg',
                    '#' + c.toHex(),
                );
                fgColorInputEl.value = c.toHex().toUpperCase();
            }
        }
        const bgColor = storage.get('bg_color');
        if (bgColor) {
            const c = Color.fromHex(bgColor);
            if (c) {
                renderer.bgColor = c;
                document.documentElement.style.setProperty(
                    '--c-bg',
                    '#' + c.toHex(),
                );
                bgColorInputEl.value = c.toHex().toUpperCase();
            }
        }
    }

    const code = new Qr('H', textEl.value);
    const render = (): void => {
        renderer.draw(code);
    };
    textEl.addEventListener('input', () => {
        code.setData(textEl.value);
        render();
    });
    ecLevelEl.addEventListener('change', () => {
        code.setEcLevel(ecLevelEl.value as any);
        render();
    });
    {
        const fgColor = Color.fromHex(fgColorInputEl.value);
        if (fgColor) {
            renderer.fgColor = fgColor;
        }
        fgColorInputEl.addEventListener('input', (event) => {
            console.log('fg color input');
            const el = event.target as HTMLInputElement;
            el.value = el.value.toUpperCase().slice(0, 8);
            const c = Color.fromHex(el.value);
            if (!c) {
                return;
            }
            document.documentElement.style.setProperty(
                '--c-fg',
                '#' + c.toHex(),
            );
            renderer.fgColor = c;
            storage.set('fg_color', c.toHex());
            render();
        });
        const bgColor = Color.fromHex(bgColorInputEl.value);
        if (bgColor) {
            renderer.bgColor = bgColor;
        }
        bgColorInputEl.addEventListener('input', (event) => {
            const el = event.target as HTMLInputElement;
            el.value = el.value.toUpperCase().slice(0, 8);
            const c = Color.fromHex(el.value);
            if (!c) {
                return;
            }
            document.documentElement.style.setProperty(
                '--c-bg',
                '#' + c.toHex(),
            );
            renderer.bgColor = c;
            storage.set('bg_color', c.toHex());
            render();
        });
    }

    styleSelectEl.addEventListener('change', () => {
        const style = styleSelectEl.value;
        renderer.style = style;
        storage.set('style', style);
        render();
    });

    saveEl.addEventListener('click', () => {
        const imageUrl = canvas.toDataURL('image/png');
        downloadDataUrl(imageUrl, 'qr-code.png');
    });

    window.addEventListener('resize', render);
    render();
    window.qrReady.trigger();
};
window.qrInit();
