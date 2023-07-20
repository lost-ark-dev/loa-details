#ifndef LDN_BOX_C_H
#define LDN_BOX_C_H
#include "../rendering/component.h"


class Box : public Component {
public:

   void setData(std::string newData);
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   Vec4f color = vec4fs(1);
private:

};
#endif