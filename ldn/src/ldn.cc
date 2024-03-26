#include "ldn.h"
#include "../third-party/glfw/include/GLFW/glfw3native.h"
#include "../third-party/png/lodepng.h"
#include "components/header.h"
#include "components/image.h"
#include "components/lower_row.h"
#include "rendering/component.h"
#include "rendering/la.h"
#include "rendering/render_context.h"
#include "window_events.h"
#include <filesystem>
#include <stdint.h>
#include <string>
#include <vcruntime_string.h>
#include <vector>

Ldn *Ldn::g_ldn = nullptr;
Ldn::Ldn() : opengl_state(nullptr, "") {}
void Ldn::run(bool should_connect, std::string path_or_port) {
  Ldn::g_ldn = this;
  auto cwd = std::filesystem::current_path();
  static_data.init();
  glfwInit();
  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
  glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
  glfwWindowHint(GLFW_DECORATED, false);
  glfwWindowHint(GLFW_FLOATING, true);
  glfwWindowHint(GLFW_TRANSPARENT_FRAMEBUFFER, 1);
  window =
      glfwCreateWindow(window_width, window_height, "LDN", nullptr, nullptr);

  glfwMakeContextCurrent(window);
  glfwSwapInterval(1);
  glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
  glfwSetWindowFocusCallback(window, window_focus_callback);
  glfwSetMouseButtonCallback(window, mouse_button_callback);
  glfwSetCursorPosCallback(window, cursor_position_callback);
  opengl_state = OpenGLState(window, cwd);

  float xscale, yscale;
  glfwGetWindowContentScale(window, &xscale, &yscale);
  window_scale_x = xscale;
  window_scale_y = yscale;


  std::vector<std::string> fontPaths;
  for (const auto &r : {"Roboto-Regular.ttf", "Roboto-Bold.ttf", "fa-solid-900.ttf", "MaterialIcons-Regular.ttf"}) {
    std::filesystem::path p = cwd / "ldn" / "assets" / "fonts" / r;
    fontPaths.push_back(p.generic_string());
  }
  font_atlas = FontAtlas(22, fontPaths, xscale, yscale);

  manager.connection = &connection;
  manager.static_data = &static_data;
  if (should_connect)
    connection.connect(path_or_port);
  else
    manager.initFromPath(path_or_port);
  run_loop();
}
void Ldn::run_loop() {
  RenderContext ctx;
  ctx.atlas = &font_atlas;
  ctx.gl_state = &opengl_state;
  Header header;
  this->header_component = dynamic_cast<Component *>(&header);
  MeterHeaderRow header_row;
  MeterHeaderRow second_header_row;
  Box header_row_fill;
  LowerRow lower_row;
  header_row_fill.color = vec4f(0, 0, 0, 1);
  const float small_header = font_atlas.effective_atlas_height * 0.7;
  const float big_header = font_atlas.effective_atlas_height * 1.4;
  header_row_fill.size.y = small_header;
  header_row.size.y = small_header;
  second_header_row.size.y = small_header;
  header_row.position.y = 64;
  second_header_row.position.y = 64 + small_header;
  header_row_fill.position.y = 64;
  second_header_row.scale = 0.45;
  list.position.y = 64 + small_header;
  lower_row.size.y = font_atlas.effective_atlas_height;
  lower_row.position.x = 0;
  glViewport(0, 0, window_width, window_height);
  std::string last_tab = active_tab;
  std::vector<Row *> image_rows;
  while (!glfwWindowShouldClose(window)) {
    glClearColor(80 / 255, 80 / 255, 80 /255, 0.6);
    glClear(GL_COLOR_BUFFER_BIT);

    opengl_state.setResolution(window_width, window_height);
    ctx.w = window_width;
    ctx.h = window_height;
    ctx.xscale = window_scale_x;
    ctx.yscale = window_scale_y;

    if (minimised || dragging_window || resizing) {
      if (!dragging_window && !resizing) {
        if (manager.poll()) {
          header.time_passed = manager.data_point.fight_duration;
        }
        header.size = vec2f(window_width, window_height);
        header.render(&ctx);
      }
      glfwSwapBuffers(window);
      glfwWaitEventsTimeout(1);
      continue;
    }
    bool custom_header =
        active_tab == "pdbuff" || active_tab == "self_buff_dmg";
    bool new_header = active_tab != last_tab;
    if (new_header) {
      if (custom_header) {
        list.position.y = 64 + big_header;
        header_row_fill.size.y = big_header;
      } else {
        if (image_rows.size()) {
          for (auto *e : image_rows)
            delete e;
          image_rows.clear();
        }
        list.position.y = 64 + small_header;
        header_row_fill.size.y = small_header;
        if (active_tab == "damage") {
          header_row.reset();
        } else if (active_tab == "rdps") {
          header_row.setRows({"RDamage", "rD%", "rDPS", "Recv", "Given",
                              "Recv/s", "Given/s", "Syn%", "sSyn%", "dSyn%"});
        } else if (active_tab == "tank") {
          header_row.setRows({"Tanked", "T%", "TPS"});
        } else if (active_tab == "shield_given") {
          header_row.setRows({"Shielded", "S%", "SPS"});
        } else if (active_tab == "eshield_given") {
          header_row.setRows({"Prevented", "S%", "SPS"});
        }
      }
      last_tab = active_tab;
    }
    if (manager.poll(new_header)) {
      DataPoint &dp = manager.data_point;
      header.time_passed = dp.fight_duration;
      list.clear();
      if (custom_header) {
        header_row.setRows(
            dp.getBuffHeaders(active_tab == "self_buff_dmg" ? 2 : 0));
        std::vector<Component *> images;
        auto strings =
            dp.getHeaderImages(active_tab == "self_buff_dmg" ? 1 : 0);
        if (image_rows.size()) {
          for (auto *e : image_rows)
            delete e;
          image_rows.clear();
        }
        for (auto &entry : strings) {
          Row *row = new Row();
          row->size.y = second_header_row.size.y;
          row->cell_size = row->size.y;
          row->set_y_size = true;
          row->push_center = true;
          for (auto &e : entry) {
            row->components.push_back(image_cache.getImage(e));
          }
          image_rows.push_back(row);
          images.push_back(row);
        }
        second_header_row.setRows(images);
        for (auto &entry : dp.players) {
          Player &p = entry.second;
          if (p.isEster)
            continue;
          list.addRow(
              p.id, p.getName(&static_data, render_names), p.damagePercentTop,
              static_data
                  .colors[static_data.classes[std::to_string(p.classId)]],
              p.getBuffRow(active_tab == "self_buff_dmg" ? dp.self_buffs
                                                         : dp.buffs));
        }
      } else {
        for (auto &entry : dp.players) {
          Player &p = entry.second;
          if ((active_tab == "tank" || active_tab == "shield_given" ||
               active_tab == "eshield_given") &&
              p.isEster)
            continue;
          list.addRow(
              p.id, p.getName(&static_data, render_names),
              p.getOrderValue(active_tab),
              static_data
                  .colors[static_data.classes[std::to_string(p.classId)]],
              p.getDataPoints(dp.fight_duration, active_tab));
        }
      }
      if (dp.boss.name.length())
        header.boss_name.setData(dp.boss.name);
      else
        header.boss_name.setData("");
      header.total_dmg = dp.damageInfo.damageDealt;
      auto fight_time = dp.fight_duration / 1000;
      if (fight_time > 0)
        header.total_dps = dp.damageInfo.damageDealt / fight_time;
      else
        header.total_dps = 0;
    }
    header.size = vec2f(window_width, 64);
    header.render(&ctx);
    list.size.x = window_width;
    if (custom_header)
      list.size.y =
          window_height - (64 + big_header) - 36;
    else
      list.size.y =
          window_height - (64 + small_header) - 36;

    header_row_fill.size.x = window_width * 0.3;
    header_row.position.x = window_width * 0.3;
    second_header_row.position.x = window_width * 0.3;
    header_row.size.x = window_width * 0.7;
    second_header_row.size.x = window_width * 0.7;
    lower_row.size.x = window_width;
    lower_row.position.y = window_height - font_atlas.effective_atlas_height;
    header_row_fill.render(&ctx);

    header_row.render(&ctx);
    list.render(&ctx);
    lower_row.render(&ctx);
    if (custom_header)
      second_header_row.render(&ctx);
    glfwSwapBuffers(window);
    if (should_take_screenshot)
      takeScreenshot();
    else if (screenshot_flag && !should_take_screenshot)
      should_take_screenshot = true;
    glfwWaitEventsTimeout(1);
  }
}
void Ldn::set_window_size(uint32_t w, uint32_t h) {
  window_width = w;
  window_height = h;
}
void Ldn::setMinimised(bool val) {
  minimised = val;
  uint32_t target_w = old_width;
  uint32_t target_h = old_height;
  if (val) {
    old_height = window_height;
    old_width = window_width;
    target_w = 150;
    target_h = 60;
  }
  glfwSetWindowSize(window, target_w, target_h);
  glfwSetWindowAttrib(window, GLFW_RESIZABLE, !minimised);
}

// this function probably took the longest to write out of all, holy fuck
// windows sucks
void Ldn::takeScreenshot() {
  std::vector<unsigned char> pixels(window_width * window_height * 4);
  glReadPixels(0, 0, window_width, window_height, GL_RGBA, GL_UNSIGNED_BYTE,
               pixels.data());

  std::vector<unsigned char> flipped_pixels(window_width * window_height * 4);
  for (int y = 0; y < window_height; y++)
    std::copy(pixels.begin() + window_width * (window_height - 1 - y) * 4,
              pixels.begin() + window_width * (window_height - y) * 4,
              flipped_pixels.begin() + window_width * y * 4);

  for (size_t i = 0; i < flipped_pixels.size(); i += 4) {
    std::swap(flipped_pixels[i], flipped_pixels[i + 2]);
  }
  BITMAPINFO bmi = {0};
  bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
  bmi.bmiHeader.biWidth = window_width;
  bmi.bmiHeader.biHeight = window_height;
  bmi.bmiHeader.biPlanes = 1;
  bmi.bmiHeader.biBitCount = 32;
  bmi.bmiHeader.biCompression = BI_RGB;
  bmi.bmiHeader.biSizeImage = 0;
  bmi.bmiHeader.biXPelsPerMeter = 0;
  bmi.bmiHeader.biYPelsPerMeter = 0;
  bmi.bmiHeader.biClrUsed = 0;
  bmi.bmiHeader.biClrImportant = 0;

  HANDLE hDIB = GlobalAlloc(GMEM_MOVEABLE,
                            sizeof(BITMAPINFOHEADER) + flipped_pixels.size());
  char *lpbitmap = (char *)GlobalLock(hDIB);
  memcpy(lpbitmap, &bmi, sizeof(BITMAPINFOHEADER));
  size_t offset = sizeof(BITMAPINFOHEADER);
  for (int i = 0; i < window_height; ++i) {
    memcpy(lpbitmap + offset,
           flipped_pixels.data() + ((window_height - i - 1) * window_width * 4),
           window_width * 4);
    offset += window_width * 4;
  }

  if (OpenClipboard(glfwGetWin32Window(window))) {
    EmptyClipboard();
    SetClipboardData(CF_DIB, hDIB);
    CloseClipboard();
  }

  GlobalUnlock(hDIB);
  render_names = true;
  screenshot_flag = false;
  should_take_screenshot = false;
}
void Ldn::enablePassthrough() {
  glfwSetWindowAttrib(window, GLFW_MOUSE_PASSTHROUGH, true);
  pass_through_enabled = true;
  focused = false;
}
void Ldn::initScreenshot() {
  if (screenshot_flag)
    return;
  render_names = false;
  screenshot_flag = true;
}