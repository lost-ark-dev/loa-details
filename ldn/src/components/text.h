#ifndef LDN_TEXT_C_H
#define LDN_TEXT_C_H
#include "../rendering/component.h"
#include "../utils/unicode_utils.h"


class Text : public Component {
public:
   Text(std::string content) : data(content) {}
   Text() : data("") {}
   void setData(const std::string& newData);
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   float scale = 1;
   std::string type = "normal";
   Vec4f color = vec4fs(1);
   bool center = false;
   float getWidth(RenderContext* ctx);
private:
   std::string data;
};
#endif