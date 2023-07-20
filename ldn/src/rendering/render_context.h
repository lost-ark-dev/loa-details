#ifndef LDN_RENDER_CONTEXT
#define LDN_RENDER_CONTEXT
#include "font_atlas.h"
#include "la.h"
#include "opengl_state.h"
#include <stdint.h>
struct RenderContext {
    FontAtlas* atlas;
    OpenGLState* gl_state;
    uint32_t w, h;
    Vec2f normalize(Vec2f in) {
        Vec2f a = in;
        a.x -= (float)w /2;
        a.y -= (float)h /2;
        return a;
    }
};
#endif