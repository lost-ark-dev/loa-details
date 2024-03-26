#ifndef LDN_BUTTON_H
#define LDN_BUTTON_H
#include "../rendering/component.h"
#include "image.h"
#include <functional>

using ClickListener = std::function<void()>;
class Button : public Component {
public:
   Button();
   ~Button();
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   bool active = false;
   Image* image = nullptr;
   std::string text;
   Vec4f text_color = vec4fs(1);
   Vec4f active_color = vec4fs(1);
   void setOnClick(const ClickListener& onclick);
   float scale = 1;
private:
    bool has_callback = false;
    ClickListener listener;

};
#endif