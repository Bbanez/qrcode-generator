import { Qr } from './qr';

const QUIET_ZONE_MODULES = 4;

const VERTEX_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SOURCE = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_qr;
uniform vec2 u_canvasSize;
uniform vec2 u_textureSize;
uniform float u_quietZone;
out vec4 outColor;

void main() {
    float qrSize = u_textureSize.x + u_quietZone * 2.0;
    float moduleSize = min(u_canvasSize.x, u_canvasSize.y) / qrSize;
    vec2 qrPixelSize = vec2(moduleSize * qrSize);
    vec2 offset = floor((u_canvasSize - qrPixelSize) * 0.5);
    vec2 pixel = vec2(v_uv.x, 1.0 - v_uv.y) * u_canvasSize;
    vec2 local = pixel - offset;

    if (
        local.x < 0.0 || local.y < 0.0 ||
        local.x >= qrPixelSize.x || local.y >= qrPixelSize.y
    ) {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec2 moduleCoord = floor(local / moduleSize) - vec2(u_quietZone);
    if (
        moduleCoord.x < 0.0 || moduleCoord.y < 0.0 ||
        moduleCoord.x >= u_textureSize.x || moduleCoord.y >= u_textureSize.y
    ) {
        outColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }

    vec2 sampleUv = (moduleCoord + 0.5) / u_textureSize;
    float mask = texture(u_qr, sampleUv).r;
    float color = mask;
    outColor = vec4(vec3(color), 1.0);
}
`;

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
        const info = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
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
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
        const info = gl.getProgramInfoLog(program) ?? 'Unknown program link error';
        gl.deleteProgram(program);
        throw new Error(info);
    }
    return program;
}

function createQrTextureData(code: Qr): Uint8Array {
    const size = code.bits.data.length;
    const textureData = new Uint8Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            textureData[y * size + x] = code.bits.data[y][x] ? 0 : 255;
        }
    }
    return textureData;
}

class QrRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private texture: WebGLTexture;
    private vao: WebGLVertexArrayObject;
    private uCanvasSize: WebGLUniformLocation;
    private uTextureSize: WebGLUniformLocation;
    private uQuietZone: WebGLUniformLocation;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', {
            antialias: false,
            alpha: false,
        });
        if (!gl) {
            throw new Error('WebGL2 is not supported in this browser');
        }
        this.gl = gl;
        this.program = createProgram(gl, VERTEX_SOURCE, FRAGMENT_SOURCE);

        const vao = gl.createVertexArray();
        const buffer = gl.createBuffer();
        const texture = gl.createTexture();
        if (!vao || !buffer || !texture) {
            throw new Error('Failed to initialize WebGL resources');
        }
        this.vao = vao;
        this.texture = texture;

        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,
                1, -1,
                -1, 1,
                -1, 1,
                1, -1,
                1, 1,
            ]),
            gl.STATIC_DRAW,
        );

        gl.useProgram(this.program);
        const aPosition = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        const uQr = gl.getUniformLocation(this.program, 'u_qr');
        const uCanvasSize = gl.getUniformLocation(this.program, 'u_canvasSize');
        const uTextureSize = gl.getUniformLocation(this.program, 'u_textureSize');
        const uQuietZone = gl.getUniformLocation(this.program, 'u_quietZone');
        if (!uQr || !uCanvasSize || !uTextureSize || !uQuietZone) {
            throw new Error('Failed to resolve shader uniforms');
        }
        this.uCanvasSize = uCanvasSize;
        this.uTextureSize = uTextureSize;
        this.uQuietZone = uQuietZone;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(uQr, 0);
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
        const size = code.bits.data.length;
        const textureData = createQrTextureData(code);

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
            size,
            size,
            0,
            gl.RED,
            gl.UNSIGNED_BYTE,
            textureData,
        );
        gl.uniform2f(this.uCanvasSize, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.uTextureSize, size, size);
        gl.uniform1f(this.uQuietZone, QUIET_ZONE_MODULES);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

async function main(): Promise<void> {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const renderer = new QrRenderer(canvas);
    const input = document.getElementById('input') as HTMLInputElement;
    if (!input) {
        throw new Error('Input element not found');
    }
    const code = new Qr('H', input.value);
    const render = (): void => {
        renderer.draw(code);
    };
    input.addEventListener('input', () => {
        code.setData(input.value);
        render();
    });
    const ecLevelEl = document.getElementById('ec-level') as HTMLSelectElement;
    if (!ecLevelEl) {
        throw new Error('EC level select element not found');
    }
    ecLevelEl.addEventListener('change', () => {
        code.setEcLevel(ecLevelEl.value as any);
        render();
    });
    window.addEventListener('resize', render);
    render();
}
main().catch((err) => {
    console.error(err);
});
