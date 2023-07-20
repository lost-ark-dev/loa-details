#ifndef LDN_LOWER_ROW_H
#define LDN_LOWER_ROW_H
#include "../rendering/component.h"
#include "row.h"
#include "button.h"
#include <iostream>

class LowerRow : public Component {
public:
    LowerRow();
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
private:
    Row row;
    Button damage_tab_btn, party_syn_btn;

};
#endif