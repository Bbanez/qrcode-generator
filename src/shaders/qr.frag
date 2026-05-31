#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_qr;
uniform sampler2D u_mask_tx;
uniform vec2 u_canvasSize;
uniform vec2 u_textureSize;
uniform float u_quietZone;
uniform vec4 u_bgColor;
uniform vec4 u_fgColor;

out vec4 outColor;

float inverseLerp(float minValue, float maxValue, float v) {
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(inMin, inMax, v);
    return mix(outMin, outMax, t);
}

float sdfCircle(vec3 c, vec2 p) {
    float x = p.x - c.x;
    float y = p.y - c.y;
    float d = x * x + y * y;
    float r2 = c.z * c.z;
    if (d > r2) {
        return 1.0;
    }
    return remap(r2 - d, 0.0, r2, 0.0, 1.0);
}

float sdfCircleAbs(vec3 c, vec2 p) {
    float x = p.x - c.x;
    float y = p.y - c.y;
    float d = x * x + y * y;
    float r2 = c.z * c.z;
    if (d > r2) {
        return 0.0;
    }
    return 1.0;
}

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
        outColor = u_bgColor;
        return;
    }
    vec2 sampleUv = (moduleCoord + 0.5) / u_textureSize;
    float qr_value = texture(u_qr, sampleUv).r;
    float mask_value = texture(u_mask_tx, sampleUv).r;
    vec3 color = vec3(qr_value);
    if (qr_value < 0.5) {
        float d = sdfCircleAbs(vec3(moduleSize * 0.5, moduleSize * 0.5, moduleSize * 0.5), mod(local, moduleSize));
        color = mix(u_bgColor.rgb, u_fgColor.rgb, d);
    } else {
        color = u_bgColor.rgb;
    }
    outColor = vec4(color, 1.0);
}
