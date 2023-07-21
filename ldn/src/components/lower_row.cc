#include "lower_row.h"
#include "../ldn.h"

LowerRow::LowerRow() {
  damage_tab_btn.text = "Damage";
  party_syn_btn.text = "PDBuff";
  damage_tab_btn.scale = 0.5;
  party_syn_btn.scale = 0.5;
  rdps_button.scale = 0.5;
  tank_button.scale = 0.5;
  rdps_button.text = "RDPS";
  tank_button.text = "Tank";
  row.cell_size = 70;
  row.components.push_back(&damage_tab_btn);
  row.components.push_back(&rdps_button);
  row.components.push_back(&tank_button);
  row.components.push_back(&party_syn_btn);

  damage_tab_btn.setOnClick(
      [this]() { set_active(&damage_tab_btn, "damage"); });
  party_syn_btn.setOnClick([this]() { set_active(&party_syn_btn, "pdbuff"); });
  rdps_button.setOnClick([this]() { set_active(&rdps_button, "rdps"); });
  tank_button.setOnClick([this]() { set_active(&tank_button, "tank"); });
  set_active(&damage_tab_btn, "damage");
}

bool LowerRow::canFocus() { return false; }
void LowerRow::onPress(RenderContext *ctx) {}
void LowerRow::onFocus(bool focus) {}
void LowerRow::render(RenderContext *ctx) {
  damage_tab_btn.size.y = size.y;
  party_syn_btn.size.y = size.y;
  rdps_button.size.y = size.y;
  tank_button.size.y = size.y;

  row.position = position;
  row.background = vec4f(0, 0, 0, 1);
  row.size = size;
  row.render(ctx);
}
void LowerRow::set_active(Button *btn, const std::string &name) {
  if (active_tab)
    active_tab->active = false;
  btn->active = true;
  Ldn::g_ldn->active_tab = name;
  active_tab = btn;
}