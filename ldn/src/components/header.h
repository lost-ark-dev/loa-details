#ifndef LDN_HEADER_H
#define LDN_HEADER_H
#include "../rendering/component.h"
#include "button.h"
#include "image.h"
#include "header.h"
#include "text.h"
#include "button.h"
#include <vector>

class Header : public Component {
public:
    Header();
    bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   size_t time_passed = 0;
   size_t total_dmg = 0, total_dps = 0;
   Text time_passed_text, total_dps_text, total_dmg_text, version_text, boss_name;
   Button closeOpenButton, screenshotButton;
   bool minimsed = false;
};
#endif