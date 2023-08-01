#include "lower_row.h"
#include "../ldn.h"

LowerRow::LowerRow() {
  damage_tab_btn.text = "Damage";
  party_syn_btn.text = "PBDMG";
  rdps_button.text = "RDPS";
  tank_button.text = "Tank";
  self_damage_buff_btn.text = "SBDMG";
  shield_given_btn.text = "SHIELD D";
  e_shield_gotten_btn.text = "ESHIELD D";
  reset_session.text = "Reset Session";
  reset_session.scale = 0.5;
  reset_session.active = true;
  self_damage_buff_btn.scale = 0.5;
  damage_tab_btn.scale = 0.5;
  e_shield_gotten_btn.scale = 0.5;
  party_syn_btn.scale = 0.5;
  shield_given_btn.scale = 0.5;
  rdps_button.scale = 0.5;
  tank_button.scale = 0.5;
  row.cell_size = 75;
  row.components.push_back(&damage_tab_btn);
  row.components.push_back(&rdps_button);
  row.components.push_back(&tank_button);
  row.components.push_back(&party_syn_btn);
  row.components.push_back(&shield_given_btn);
  row.components.push_back(&e_shield_gotten_btn);
  row.components.push_back(&self_damage_buff_btn);

  damage_tab_btn.setOnClick(
      [this]() { set_active(&damage_tab_btn, "damage"); });
  party_syn_btn.setOnClick([this]() { set_active(&party_syn_btn, "pdbuff"); });
  rdps_button.setOnClick([this]() { set_active(&rdps_button, "rdps"); });
  tank_button.setOnClick([this]() { set_active(&tank_button, "tank"); });
  shield_given_btn.setOnClick(
      [this]() { set_active(&shield_given_btn, "shield_given"); });
  e_shield_gotten_btn.setOnClick(
      [this]() { set_active(&e_shield_gotten_btn, "eshield_given"); });
  self_damage_buff_btn.setOnClick(
      [this]() { set_active(&self_damage_buff_btn, "self_buff_dmg"); });
  reset_session.setOnClick([this]() {
      Ldn::g_ldn->connection.sendReset();
  });
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
  shield_given_btn.size.y = size.y;
  e_shield_gotten_btn.size.y = size.y;
  self_damage_buff_btn.size.y = size.y;
  reset_session.size.y = size.y;

  row.position = position;
  row.background = vec4f(0, 0, 0, 1);
  row.size = size;
  row.size.x -= 95;
  reset_session.position = position;
  reset_session.size.x = 95;
  reset_session.position.x += (size.x - 105);

  row.render(ctx);
  reset_session.render(ctx);
}
void LowerRow::set_active(Button *btn, const std::string &name) {
  if (active_tab)
    active_tab->active = false;
  btn->active = true;
  Ldn::g_ldn->active_tab = name;
  active_tab = btn;
}