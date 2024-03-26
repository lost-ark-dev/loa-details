#ifndef LDN_METER_ROW
#define LDN_METER_ROW
#include "row.h"
#include "../ldn.h"
#include "text.h"
#include <vector>

class MeterRow : public Component {
public:
   ~MeterRow() {
      if(entries.size())  {
         for(auto* entry: entries) {
            delete entry;
         }
      }
   }
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   void setRows(std::vector<std::string> values, float cell_size = 0);
      std::string name;
   Vec4f color = vec4fs(0);
   float filled = 0.6;
private:
   Row row;
   std::vector<Text*> entries;

};

#endif