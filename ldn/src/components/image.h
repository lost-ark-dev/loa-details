#ifndef LDN_IMAGE_H
#define LDN_IMAGE_H
#include "../rendering/component.h"
#include <stdint.h>
#include <vector>

class Image :public Component {
public:
   bool canFocus() override;
   void onPress(RenderContext* ctx) override;
   void onFocus(bool focus) override;
   void render(RenderContext* ctx) override;
   void load(std::vector<uint8_t>& encoded_data);
   bool center = true;
 private:
    void decode(RenderContext* ctx);
    std::vector<uint8_t> encoded_data, decoded_data;
    bool was_decoded = false;
    uint32_t native_width, native_height;
    GLuint tex_id;
    bool was_loaded = false;
    bool failed = false;

};
#endif