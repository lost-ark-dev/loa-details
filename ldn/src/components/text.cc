#include "text.h"

bool Text::canFocus() { return false; }
void Text::onPress(RenderContext *ctx) {}
void Text::onFocus(bool focus) {}
void Text::render(RenderContext *ctx) {
  Vec2f render_pos = position;
  Vec2f size_remaining = size;
  std::vector<RenderChar> entries;
  auto *shader = ctx->gl_state->text_shader;
  shader->shader.use();
  shader->bindVertexArray();
  ctx->atlas->bindTexture();
  shader->bindBuffer();
  auto cps = UnicodeUtils::utf8_to_codepoint(data);

  if (center) {
    float len = 0;
    for (auto const point : cps) {
      auto advance = ctx->atlas->getAdvance(point, type, scale);
      len += advance;
    }
    if (len < size.x) {
      render_pos.x += ((size.x) - len) / 2;
    }
  }
  for (auto const point : cps) {
    auto advance = ctx->atlas->getAdvance(point, type, scale);
    if (size_remaining.x < advance)
      break;
    auto normalised = ctx->normalize(render_pos);
    auto rendered = ctx->atlas->render(point, normalised.x, normalised.y, color,
                                       type, scale);
    entries.push_back(rendered);
    size_remaining.x -= advance;
    render_pos.x += advance;
  }
  if (entries.size()) {
    glBufferSubData(
        GL_ARRAY_BUFFER, 0, sizeof(RenderChar) * entries.size(),
        &entries[0]); // be sure to use glBufferSubData and not glBufferData
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 6, (GLsizei)entries.size());
  }
}
void Text::setData(const std::string& newData) { data = newData; }
float Text::getWidth(RenderContext *ctx) {
  float w = 0;
  auto cps = UnicodeUtils::utf8_to_codepoint(data);
  for (auto const point : cps) {
    auto advance = ctx->atlas->getAdvance(point, type, scale);
    w += advance;
  }
  return w;
}