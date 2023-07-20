#ifndef LDN_METER_HEADER_ROW
#define LDN_METER_HEADER_ROW
#include "row.h"
#include "text.h"
#include <vector>

class MeterHeaderRow : public Component {
public:
   MeterHeaderRow();
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   void setRows(std::vector<std::string> values, float cell_size = 0);
   void setRows(std::vector<Component*> values, float cell_size = 0);
   float scale = 0.6;
   void reset();
private:
   Row row;
   std::vector<Component*> entries;
};

#endif