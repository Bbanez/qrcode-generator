import { Color } from './utils/color';
import VERTEX_SOURCE from './shaders/qr.vert';
import FRAGMENT_SOURCE from './shaders/qr.frag';
import type { Qr } from './qr';
import type { Mat } from './math/mat';

const QUIET_ZONE_MODULES = 4;

export class QrRenderer {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private texture: WebGLTexture;
    private maskTexture: WebGLTexture;
    private vao: WebGLVertexArrayObject;
    private uCanvasSize: WebGLUniformLocation;
    private uTextureSize: WebGLUniformLocation;
    private uQuietZone: WebGLUniformLocation;
    private bgColorLoc: WebGLUniformLocation;
    private fgColorLoc: WebGLUniformLocation;
    private dotsLoc: WebGLUniformLocation;

    bgColor = new Color(0, 0, 0, 255);
    fgColor = new Color(255, 255, 255, 255);
    style = 'square';

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', {
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        if (!gl) {
            throw new Error('WebGL2 is not supported in this browser');
        }
        this.gl = gl;
        this.program = createProgram(gl, VERTEX_SOURCE, FRAGMENT_SOURCE);
        const vao = gl.createVertexArray();
        const buffer = gl.createBuffer();
        const texture = gl.createTexture();
        const maskTexture = gl.createTexture();
        if (!vao || !buffer || !texture || !maskTexture) {
            throw new Error('Failed to initialize WebGL resources');
        }
        this.vao = vao;
        this.texture = texture;
        this.maskTexture = maskTexture;
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW,
        );
        gl.useProgram(this.program);
        const aPosition = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
        const locs = {
            uQr: gl.getUniformLocation(this.program, 'u_qr'),
            // uMaskTx: gl.getUniformLocation(this.program, 'u_mask_tx'),
            uCanvasSize: gl.getUniformLocation(this.program, 'u_canvasSize'),
            uTextureSize: gl.getUniformLocation(this.program, 'u_textureSize'),
            bgColorLoc: gl.getUniformLocation(this.program, 'u_bgColor'),
            fgColorLoc: gl.getUniformLocation(this.program, 'u_fgColor'),
            uQuietZone: gl.getUniformLocation(this.program, 'u_quietZone'),
            dotsLoc: gl.getUniformLocation(this.program, 'u_dots'),
        };
        for (const [key, loc] of Object.entries(locs)) {
            if (!loc) {
                throw new Error(`Failed to resolve uniform ${key}`);
            }
        }
        this.uCanvasSize = locs.uCanvasSize as WebGLUniformLocation;
        this.uTextureSize = locs.uTextureSize as WebGLUniformLocation;
        this.uQuietZone = locs.uQuietZone as WebGLUniformLocation;
        this.bgColorLoc = locs.bgColorLoc as WebGLUniformLocation;
        this.fgColorLoc = locs.fgColorLoc as WebGLUniformLocation;
        this.dotsLoc = locs.dotsLoc as WebGLUniformLocation;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(locs.uQr, 0);
        // gl.uniform1i(locs.uMaskTx, 1);
        gl.clearColor(0, 0, 0, 1);
    }

    resize(): void {
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
        const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    draw(code: Qr): void {
        this.resize();
        const gl = this.gl;
        const size = code.bits.size();
        const textureData = createTextureData(code.bits);
        const maskTxData = createTextureData(code.maskData);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R8,
            size.x,
            size.y,
            0,
            gl.RED,
            gl.UNSIGNED_BYTE,
            textureData,
        );
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R8,
            size.x,
            size.y,
            0,
            gl.RED,
            gl.UNSIGNED_BYTE,
            maskTxData,
        );
        gl.uniform2f(this.uCanvasSize, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.uTextureSize, size.x, size.y);
        gl.uniform4f(
            this.fgColorLoc,
            this.fgColor.rn,
            this.fgColor.gn,
            this.fgColor.bn,
            this.fgColor.an,
        );
        gl.uniform4f(
            this.bgColorLoc,
            this.bgColor.rn,
            this.bgColor.gn,
            this.bgColor.bn,
            this.bgColor.an,
        );
        gl.uniform1f(this.uQuietZone, QUIET_ZONE_MODULES);
        gl.uniform1i(this.dotsLoc, this.style === 'dots' ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

function compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Failed to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info =
            gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
        gl.deleteShader(shader);
        throw new Error(info);
    }
    return shader;
}

function createProgram(
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string,
): WebGLProgram {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentSource,
    );
    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error('Failed to create program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info =
            gl.getProgramInfoLog(program) ?? 'Unknown program link error';
        gl.deleteProgram(program);
        throw new Error(info);
    }
    return program;
}

function createTextureData(m: Mat): Uint8Array {
    const size = m.size();
    const textureData = new Uint8Array(size.x * size.y);
    for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
            textureData[y * size.x + x] = m.data[y][x] ? 0 : 255;
        }
    }
    return textureData;
}
