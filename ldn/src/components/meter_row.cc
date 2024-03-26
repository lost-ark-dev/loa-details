#include "meter_row.h"
#include "box.h"

bool MeterRow::canFocus() {
    return true;
}
void MeterRow::onPress(RenderContext* ctx) {

}
void MeterRow::onFocus(bool focus) {

}
void MeterRow::render(RenderContext* ctx) {
    Box background_box;
    background_box.size = size;
    background_box.size.x *= filled;
    background_box.position = position;
    background_box.color = color;
    background_box.render(ctx);

    row.align = Row::Align::Right;
    row.position.y = position.y;
    row.size.y= size.y;
    row.position.x = position.x + (size.x * 0.3);
    row.size.x = size.x * 0.7;
    row.render(ctx);

    Text name_r(name);
    name_r.position = position;
    name_r.position.x += 5; // padding
    name_r.type = "bold";
    name_r.size = size;
    name_r.size.x = size.x * 0.3;
    name_r.color = vec4fs(1);
    name_r.scale = 0.6;
    name_r.render(ctx);

}

void MeterRow::setRows(std::vector<std::string> values, float cell_size){
    row.cell_size = cell_size;
    if(entries.size()) {
        row.components.clear();
        for(auto* e : entries) {
            delete e;
        }
        entries.clear();
    }
       for(auto& e : values) {
        entries.push_back(new Text(e));
    }
    for(auto* e : entries) {
        e->scale = 0.6;
        e->center = true;
        row.components.push_back(e);
    }
}