#ifndef LDN_LOWER_ROW_H
#define LDN_LOWER_ROW_H
#include "../rendering/component.h"
#include "button.h"
#include "row.h"
#include <iostream>

class LowerRow : public Component {
public:
  LowerRow();
  bool canFocus() override;
  void onPress(RenderContext *ctx) override;
  void onFocus(bool focus) override;
  void render(RenderContext *ctx) override;

private:
  Row row;
  Button damage_tab_btn, party_syn_btn, rdps_button, tank_button,
      shield_given_btn, e_shield_gotten_btn, self_damage_buff_btn;
  Button reset_session;
  Button *active_tab = nullptr;
  void set_active(Button *btn, const std::string &name);
};
#endif