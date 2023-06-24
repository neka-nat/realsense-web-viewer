export const vertexShader = `
precision highp float;
// Run a vertex shader instance for each depth data point to create
// 3D model of the data (pointcloud).

////////////////////////////////////////////////////////////////////
// Parameters of the currently used camera, see
// https://github.com/IntelRealSense/librealsense/blob/master/doc/projection.md
// and the documentation at
// https://w3c.github.io/mediacapture-depth/#synchronizing-depth-and-color-video-rendering

// The possible values for u_depth_distortion_model and
// u_color_distortion_model.
// https://github.com/IntelRealSense/librealsense/blob/master/doc/projection.md#distortion-models
#define DISTORTION_NONE 0
#define DISTORTION_MODIFIED_BROWN_CONRADY 1
#define DISTORTION_INVERSE_BROWN_CONRADY 2

// Matrix that represents the transformation to be done between the
// depth data 3D position to the color data 3D position.
uniform mat4 u_depth_to_color;
// Used to convert the raw depth data into meters.
// Corresponds to \`rs_get_device_depth_scale()\` in librealsense.
uniform float u_depth_scale;
// Center of projection of the depth camera data.
uniform vec2 u_depth_offset;
// Focal length of the depth data.
uniform vec2 u_depth_focal_length;
// See the comment for the DISTORTION_* constants
uniform int u_depth_distortion_model;
// If the depth distortion model is not DISTORTION_NONE, set these
// to numbers that describe the distortion.
uniform float u_depth_distortion_coeffs[5];
// Center of projection of the color data.
uniform vec2 u_color_offset;
// Focal length of the color data.
uniform vec2 u_color_focal_length;
// See the comment for the DISTORTION_* constants
uniform int u_color_distortion_model;
// If the color distortion model is not DISTORTION_NONE, set these
// to numbers that describe the distortion.
uniform float u_color_distortion_coeffs[5];
////////////////////////////////////////////////////////////////////

// All of the depth data.
uniform sampler2D u_depth_texture;
// Width and height of the depth data.
uniform vec2 u_depth_texture_size;
// Width and height of the color data.
uniform vec2 u_color_texture_size;

// Coordinate in the color texture for the vertex processed in the
// vertex shader that will be passed to the fragment shader.
varying vec2 v_color_texture_coord;

// Convert the index of the depth data (ranged from [0, 0] to
// [u_depth_texture_size.x, u_depth_texture_size.y]) into a position
// in 3D space. The \`depth\` parameter needs to be in meters.
// This should be equivalent to what \`rs_deproject_pixel_to_point()\`
// in librealsense does.
vec4 depth_deproject(vec2 index, float depth) {
    vec2 position2d = (index - u_depth_offset) / u_depth_focal_length;
    if(u_depth_distortion_model == DISTORTION_INVERSE_BROWN_CONRADY) {
        float r2 = dot(position2d, position2d);
        float f = 1.0
                + u_depth_distortion_coeffs[0] * r2
                + u_depth_distortion_coeffs[1] * r2 * r2
                + u_depth_distortion_coeffs[4] * r2 * r2 * r2;
        float ux = position2d.x * f
                 + 2.0 * u_depth_distortion_coeffs[2] * position2d.x * position2d.y
                 + u_depth_distortion_coeffs[3] * (r2 + 2.0 * position2d.x * position2d.x);
        float uy = position2d.y * f
                 + 2.0 * u_depth_distortion_coeffs[3] * position2d.x * position2d.y
                 + u_depth_distortion_coeffs[2] * (r2 + 2.0 * position2d.y * position2d.y);
        position2d = vec2(ux, uy);
  }
  return vec4(position2d * depth, depth, 1.0);
}

// Convert the 3D position of the color data into an index to the
// color data array. In an ideal world, the output would be ranged
// from [0, 0] to [u_color_texture_size.x, u_color_texture_size.y].
// Since the RGB camera often has a smaller field of view than the
// depth camera, the result could be outside of this range, meaning
// that the RGB data for that 3D coordinate are missing.
//
// This should be equivalent to what \`rs_project_point_to_pixel()\`
// in librealsense does.
vec2 color_project(vec4 position3d) {
    vec2 position2d = position3d.xy / position3d.z;
    if(u_color_distortion_model == DISTORTION_MODIFIED_BROWN_CONRADY) {
        float r2 = dot(position2d, position2d);
        float f = 1.0
                + u_color_distortion_coeffs[0] * r2
                + u_color_distortion_coeffs[1] * r2 * r2
                + u_color_distortion_coeffs[4] * r2 * r2 * r2;
        position2d = position2d * f;
        float dx = position2d.x
                 + 2.0 * u_color_distortion_coeffs[2] * position2d.x * position2d.y
                 + u_color_distortion_coeffs[3] * (r2 + 2.0 * position2d.x * position2d.x);
        float dy = position2d.y
                 + 2.0 * u_color_distortion_coeffs[3] * position2d.x * position2d.y
                 + u_color_distortion_coeffs[2] * (r2 + 2.0 * position2d.y * position2d.y);
        position2d = vec2(dx, dy);
    }
    return position2d * u_color_focal_length + u_color_offset;
}

void main() {
    // Get the texture coordinates in range from [0, 0] to [1, 1]
    vec2 depth_texture_coord = position.xy
                             / u_depth_texture_size;
    // The values of R, G and B should be equal, so we can just
    // select any of them.
    vec4 texel = texture2D(u_depth_texture,
                            depth_texture_coord);
    float depth = texel.r * 256.0 + texel.g;
    // For example, a value of 1.5 means the current point is 1.5
    // meters away.
    float depth_scaled = u_depth_scale * depth;
    // X and Y are the position within the depth texture (adjusted
    // so that it matches the position of the RGB texture), Z is
    // the depth.
    vec4 point_position = depth_deproject(position.xy,
                                          depth_scaled);
    gl_Position = projectionMatrix * modelViewMatrix * point_position;
    gl_PointSize = 2.0;

    // 3D position of the color pixel.
    vec4 color_position = u_depth_to_color * point_position;
    // 2D index of the color pixel.
    vec2 color_index = color_project(color_position);
    // 2D position in the color texture. In the ideal case, this
    // would be ranged [0, 0] to [1, 1], but since we don't always
    // have RGB data, it can be outside of the range, meaning that
    // we just don't have the necessary data.
    v_color_texture_coord = color_index / u_color_texture_size;
}
`;
