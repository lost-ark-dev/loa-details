#version 330 core
uniform vec2 resolution;
layout(location = 0) in vec2 position;
layout(location = 1) in vec2 size;
vec2 camera_project(vec2 point) {
  return 2 * (point) * (1 / resolution);
}
out vec2 uv;

void main() {
vec2 uvIn = vec2(float(gl_VertexID & 1),
              float((gl_VertexID >> 1) & 1));
    uv = uvIn;
    vec2 r = camera_project(uvIn * size + position);
    r.y *= -1;
   gl_Position = vec4(r, 0.0f, 1.0f);
}
