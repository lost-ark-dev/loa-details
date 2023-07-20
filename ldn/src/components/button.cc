#include "button.h"
#include "box.h"
#include "text.h"
#include "../ldn.h"

bool Button::canFocus() {
    return true;
}
void Button::onPress(RenderContext* ctx) {
    if(has_callback)
        listener();
}
void Button::onFocus(bool focus) {

}
void Button::render(RenderContext* ctx) {
    Vec2f render_size = size;
    if(active)
        render_size.y -= 4;
    if(image){
        image->position = position;
        image->size = render_size;
        image->render(ctx);
    }
    if(text.length()) {
        Text text_r(text);
        text_r.center = true;
        text_r.color = text_color;
        text_r.position = position;
        text_r.size =render_size;
        text_r.scale = scale;
        text_r.render(ctx);
    }
    if(active) {
        Box box;
        box.position = position;
        box.position.y = (position.y + size.y -2);
        box.size = size;
        box.size.y = 2;
        box.color = active_color;
        box.render(ctx);
    }
}
void Button::setOnClick(const ClickListener& onclick) {
    listener = onclick;
    has_callback = true;    
}
Button::Button() {
    Ldn::g_ldn->button_list.push_back(this);
}
Button::~Button() {
    Ldn::g_ldn->button_list.erase(std::remove(Ldn::g_ldn->button_list.begin(), Ldn::g_ldn->button_list.end(), this), Ldn::g_ldn->button_list.end());
}