#include "row.h"
#include "box.h"
#include <iostream>

bool Row::canFocus() { return false; }
void Row::onPress(RenderContext *ctx) {}
void Row::onFocus(bool focus) {}
void Row::render(RenderContext *ctx) {
  if (background.w != 0) {
    Box b;
    b.position = position;
    b.size = size;
    b.color = background;
    b.render(ctx);
  }
  Vec2f size_remaining = size;
  float c_size = cell_size;
  if (c_size == 0)
    c_size = size.x / components.size() ;
  float offset = 0;
  if(push_center && (c_size * components.size()) < size.x)
    offset = (size.x - (c_size * components.size())) / 2;
  if (align == Left) {
    for (auto *child : components) {
      child->position.y = position.y;
      child->position.x = position.x + offset;
      child->size.x = c_size;
      if (set_y_size)
        child->size.y = size.y;
      child->render(ctx);
      size_remaining.x -= child->size.x;

      if (size_remaining.x <= 0)
        break;
      offset += c_size;
    }
  } else {
    offset = c_size;
    for (int i = components.size() - 1; i >= 0; i--) {
      auto *child = components[i];
      child->position.y = position.y;
      child->position.x = (position.x + size.x) - offset;
      child->size.x = c_size;
      child->render(ctx);
      size_remaining.x -= child->size.x;

      if (size_remaining.x <= 0)
        break;
      offset += c_size;
    }
  }
}
