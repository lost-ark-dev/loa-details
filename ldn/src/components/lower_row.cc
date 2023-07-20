#include "lower_row.h"
#include "../ldn.h"

LowerRow::LowerRow() {
    damage_tab_btn.text = "Damage";
    damage_tab_btn.active = true;
    party_syn_btn.text = "PDBuff";
    damage_tab_btn.scale = 0.5;
    party_syn_btn.scale = 0.5;
    row.cell_size = 70;
    row.components.push_back(&damage_tab_btn);
    row.components.push_back(&party_syn_btn);

    damage_tab_btn.setOnClick([this](){
        damage_tab_btn.active = true;
        party_syn_btn.active = false;
        Ldn::g_ldn->active_tab = "damage";
    });
        party_syn_btn.setOnClick([this](){
        damage_tab_btn.active = false;
        party_syn_btn.active = true;
        Ldn::g_ldn->active_tab = "pdbuff";
    });
}

bool LowerRow::canFocus() {
    return false;
}
void LowerRow::onPress(RenderContext* ctx) {

}
void LowerRow::onFocus(bool focus) {

}
void LowerRow::render(RenderContext* ctx) {
    damage_tab_btn.size.y = size.y;
    party_syn_btn.size.y = size.y;

    row.position= position;
    row.background = vec4f(0, 0, 0, 1);
    row.size = size;
    row.render(ctx);
}