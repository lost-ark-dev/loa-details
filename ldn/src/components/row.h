#ifndef LDN_ROW_C_H
#define LDN_ROW_C_H
#include "../rendering/component.h"
#include <vector>


class Row : public Component {
public:
   enum Align {
      Left,
      Right
   };
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   Vec4f background = vec4fs(0);
   std::vector<Component*> components;
   float cell_size = 0;
   Align align = Left;
private:

};
#endif