#include "meter_header_row.h"

bool MeterHeaderRow::canFocus() { return false; }
void MeterHeaderRow::onPress(RenderContext *ctx) {}
void MeterHeaderRow::onFocus(bool focus) {}
void MeterHeaderRow::render(RenderContext *ctx) {

    for (auto &e : entries) {
        e->size.y = size.y;
    }
  row.position = position;
  row.size = size;
  row.background = vec4f(0, 0, 0, 1);
  row.align = Row::Align::Right;
  row.render(ctx);
}
MeterHeaderRow::MeterHeaderRow() { reset(); }
void MeterHeaderRow::reset() {
  setRows({"Damage", "D%", "DPS", "CRIT", "F.A.", "B.A.", "Syn%", "sSyn%",
           "dSyn%", "CNTR"});
}
void MeterHeaderRow::setRows(std::vector<std::string> values, float cell_size) {
  row.cell_size = cell_size;
  if (entries.size()) {
    row.components.clear();
    for (auto *e : entries) {
      delete e;
    }
    entries.clear();
  }
  for (auto &e : values) {
    entries.push_back(new Text(e));
  }
  for (auto *x : entries) {
    Text* e = dynamic_cast<Text*>(x);
    e->scale = scale;
    e->center = true;
    row.components.push_back(e);
  }
}
void MeterHeaderRow::setRows(std::vector<Component *> values, float cell_size) {
  row.cell_size = cell_size;
  if (entries.size()) {
    row.components.clear();
    entries.clear();
  }
  for (auto &e : values) {
    entries.push_back(e);
  }
  for (auto *e : entries) {
    row.components.push_back(e);
  }
}