#ifndef LDN_COMPONENT
#define LDN_COMPONENT
#include "render_context.h"
#include "la.h"
class Component {
 public:
  virtual bool canFocus() = 0;
  virtual void onPress(RenderContext* ctx) = 0;
  virtual void onFocus(bool focus) = 0;
  virtual void render(RenderContext* ctx) = 0;
  Vec2f position = vec2fs(0), size = vec2fs(0);
  Component* parent = nullptr;
};
#endif