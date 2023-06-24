export const fragmentShader = `
precision mediump float;
uniform sampler2D u_color_texture;
varying vec2 v_color_texture_coord;

void main() {
    if (v_color_texture_coord.x <= 1.0
        && v_color_texture_coord.x >= 0.0
        && v_color_texture_coord.y <= 1.0
        && v_color_texture_coord.y >= 0.0) {

        //gl_FragColor = texture2D(u_color_texture, v_color_texture_coord);
        gl_FragColor = vec4(0, 0, 0, 1.0);
    } else {
        gl_FragColor = vec4(0, 0, 0, 1.0);
    }
}
`;
