#ifndef LDN_COLOR_UTIL_H
#define LDN_COLOR_UTIL_H
#include "../rendering/la.h"
#include <stdint.h>
class ColorUtils {
public:
    static Vec4f fromRGBA(uint8_t r, uint8_t g, uint8_t b, float alpha) {
        return vec4f((float) r / 255, (float) g / 255, (float)b / 255, alpha);
    }
    static Vec4f fromHEX(uint32_t val) {
        uint8_t* ptr = (uint8_t*) &val;
        return fromRGBA(ptr[0], ptr[1], ptr[2], (float)ptr[3] / 255);
    }
};
#endif