#ifndef LDN_LDN_H
#define LDN_LDN_H
#include "conn/connection.h"
#include "rendering/component.h"
#include "rendering/font_atlas.h"
#include "rendering/opengl_state.h"
#include "../third-party/glfw/include/GLFW/glfw3.h"
#include <vector>
#include "components/text.h"
#include "components/box.h"
#include "components/meter_header_row.h"
#include "components/row_list.h"
#include "conn/data_manager.h"
#include "conn/static_data.h"
#include "utils/image_cache.h"



class Ldn {
public:
    void run(bool should_connect, std::string path);
    Ldn();
    void set_window_size(uint32_t w, uint32_t h);
    std::vector<Component*> button_list;
    static Ldn* g_ldn;
    RowList list;
    std::string active_tab = "damage";
    void setMinimised(bool val);
    bool main_mouse_button_pressed = false;
    bool dragging_window = false, resizing = false;
    Component* header_component = nullptr;
    double last_mouse_x, last_mouse_y;
    uint32_t window_height = 720;
    uint32_t window_width = 1280;
    GLFWcursor* active_cursor = nullptr;
    ImageCache image_cache;
    SocketConnection connection;
    DataManager manager;
    void takeScreenshot();
    void initScreenshot();
    void enablePassthrough();
    bool focused = true;
    bool pass_through_enabled = false;
    bool render_names = true;
    bool screenshot_flag = false;
    bool should_take_screenshot = false;
private:
    void run_loop();
    FontAtlas font_atlas;
    OpenGLState opengl_state;
    StaticData static_data;
    GLFWwindow* window = nullptr;

    uint32_t old_width = 720;
    uint32_t old_height = 1280;

    bool minimised = false;
};
#endif