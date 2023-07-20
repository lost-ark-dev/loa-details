#ifndef LDN_WINDOW_EVENTS
#define LDN_WINDOW_EVENTS
#include "ldn.h"
#include "rendering/component.h"
void framebuffer_size_callback(GLFWwindow *window, int width, int height) {
  glViewport(0, 0, width, height);

  Ldn::g_ldn->set_window_size(width, height);
};
bool hit_test(Component *entry, double xpos, double ypos) {
  auto &pos = entry->position;
  auto &size = entry->size;
  return xpos >= pos.x && xpos <= pos.x + size.x && ypos >= pos.y &&
         ypos <= pos.y + size.y;
}
void mouse_button_callback(GLFWwindow *window, int button, int action,
                           int mods) {
  if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_PRESS) {
    Ldn::g_ldn->main_mouse_button_pressed = true;
    double xpos, ypos;
    glfwGetCursorPos(window, &xpos, &ypos);
    Ldn::g_ldn->last_mouse_x = xpos;
    Ldn::g_ldn->last_mouse_y = ypos;
    auto &hitlist = Ldn::g_ldn->button_list;
    for (auto *entry : hitlist) {
      if (hit_test(entry, xpos, ypos)) {
        entry->onPress(nullptr);
        break;
      }
    }
  } else if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_RELEASE) {
    Ldn::g_ldn->main_mouse_button_pressed = false;
    Ldn::g_ldn->dragging_window = false;
    Ldn::g_ldn->resizing = false;
  }
}
void cursor_position_callback(GLFWwindow *window, double xpos, double ypos) {
  if ((Ldn::g_ldn->main_mouse_button_pressed &&
       hit_test(Ldn::g_ldn->header_component, xpos, ypos)) ||
      Ldn::g_ldn->dragging_window) {
    Ldn::g_ldn->dragging_window = true;
    int winx, winy;
    glfwGetWindowPos(window, &winx, &winy);
    auto diff_x = xpos - Ldn::g_ldn->last_mouse_x;
    auto diff_y = ypos - Ldn::g_ldn->last_mouse_y;
    winx += diff_x;
    winy += diff_y;
    glfwSetWindowPos(window, winx, winy);
  } else {
    auto width = Ldn::g_ldn->window_width;
    auto height = Ldn::g_ldn->window_height;
    if (xpos >= width - 15 && ypos >= height - 15 ||
        (Ldn::g_ldn->main_mouse_button_pressed) || Ldn::g_ldn->resizing) {

      if ((Ldn::g_ldn->main_mouse_button_pressed && xpos >= width - 15 &&
           ypos >= height - 15) ||
          Ldn::g_ldn->resizing) {
        Ldn::g_ldn->resizing = true;
        auto diff_x = xpos - width;
        auto diff_y = ypos - height;
        width += diff_x;
        height += diff_y;
        glfwSetWindowSize(window, width, height);
        return;
      } else if (xpos >= width - 15 && ypos >= height - 15) {
        if (!Ldn::g_ldn->active_cursor) {
          GLFWcursor *mouseCursor =
              glfwCreateStandardCursor(GLFW_RESIZE_NWSE_CURSOR);
          glfwSetCursor(window, mouseCursor);
          Ldn::g_ldn->active_cursor = mouseCursor;
          return;
        }
      }

    } else if (!Ldn::g_ldn->main_mouse_button_pressed) {
      auto &hitlist = Ldn::g_ldn->button_list;
      for (auto *entry : hitlist) {
        if (hit_test(entry, xpos, ypos)) {
          if (Ldn::g_ldn->active_cursor)
            return;
          GLFWcursor *mouseCursor =
              glfwCreateStandardCursor(GLFW_POINTING_HAND_CURSOR);
          glfwSetCursor(window, mouseCursor);
          Ldn::g_ldn->active_cursor = mouseCursor;
          return;
        }
      }
    }
    if (Ldn::g_ldn->active_cursor) {
      glfwDestroyCursor(Ldn::g_ldn->active_cursor);
      Ldn::g_ldn->active_cursor = nullptr;
    }
  }
}

#endif