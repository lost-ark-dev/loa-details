#include "box.h"

bool Box::canFocus() {
    return false;
}
void Box::onPress(RenderContext* ctx) {

}
void Box::onFocus(bool focus) {

}
void Box::render(RenderContext* ctx) {
     ShaderInstance* m_shader = ctx->gl_state->box_shader;
    m_shader->shader.use();
    m_shader->bindVertexArray();
    m_shader->bindBuffer();
    auto p = ctx->normalize(position);
    ColorEntry entry = {vec2f(p.x, -p.y - size.y), size, color};
    glBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(ColorEntry), &entry);
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 6, (GLsizei)1);
}
