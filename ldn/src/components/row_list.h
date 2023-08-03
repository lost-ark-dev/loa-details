#ifndef LDN_ROW_LIST_H
#define LDN_ROW_LIST_H
#include "../rendering/component.h"

#include <map>
#include <vector>
class MeterRow;
class RowList : public Component {
public:
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   void addRow(std::string identifer, std::string name, float fill, Vec4f color, std::vector<std::string> rows);
   void removeRow(std::string identifer);
   void updateName(std::string identifier, std::string name);
   void updateFill(std::string identifier, float fill);
   void updateColor(std::string identifier, Vec4f color);
   void updateRows(std::string identifier, std::vector<std::string> rows);
   void setOrder(std::vector<std::string> values);
   void clear();
   float rowHeight = 25;
private:
    std::map<std::string, MeterRow*> rows;
    std::vector<MeterRow*> ordered;

};
#endif