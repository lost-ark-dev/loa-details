#include "row_list.h"
#include "meter_row.h"

bool RowList::canFocus() { return true; }
void RowList::onPress(RenderContext *ctx) {}
void RowList::onFocus(bool focus) {}
void RowList::render(RenderContext *ctx) {
    float offset = 0;

    sort(ordered.begin(), ordered.end(), [](auto* a, auto* b) {
        return b->filled < a->filled;
    });

    for (auto row : ordered) {
        row->position = position;
        row->position.y += offset;
        row->size.x = size.x;
        row->size.y = rowHeight;
        row->render(ctx);
        offset+= rowHeight;
        if(offset > size.y)
            break;
    }
}
void RowList::addRow(std::string identifier, std::string name, float fill, Vec4f color, std::vector<std::string> values) {
    if(rows.count(identifier))
        return; // todo handle this
    MeterRow* r = new MeterRow();
    r->color = color;
    r->filled = fill;
    r->setRows(values);
    r->name = name;
    rows[identifier] = r;
    ordered.push_back(r);
}
void RowList::removeRow(std::string identifier) {
    if(!rows.count(identifier))
        return;
    MeterRow* r= rows[identifier];
    rows.erase(identifier);
    ordered.erase(std::remove(ordered.begin(), ordered.end(), r), ordered.end());
    delete r;
}
 void RowList::updateName(std::string identifier, std::string name){
    if(!rows.count(identifier))
        return;
    rows[identifier]->name = name;
 }
void RowList::updateFill(std::string identifier, float fill) {
    if(!rows.count(identifier))
        return;
    rows[identifier]->filled = fill;
}
void RowList::updateColor(std::string identifier, Vec4f color) {
    if(!rows.count(identifier))
        return;
    rows[identifier]->color = color;
}
void RowList::updateRows(std::string identifier, std::vector<std::string> newValues) {
    if(!rows.count(identifier))
        return;
    rows[identifier]->setRows(newValues);
}
void RowList::clear() {
    ordered.clear();
    for(auto& entry : rows){
        delete entry.second;
    }
    rows.clear();
}