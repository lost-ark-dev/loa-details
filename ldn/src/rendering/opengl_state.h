#ifndef DEC_OPENGL_STATE
#define DEC_OPENGL_STATE

#include <filesystem>
#include <vector>
#include "../utils/file_util.h"

void init_irc_colors();

#include "shader.h"
class GLFWwindow;
struct SimpleEntry {
  Vec2f pos;
  Vec2f size;
};

struct ColorEntry {
  Vec2f pos;
  Vec2f size;
  Vec4f color;
};

struct ShaderVar {
  uint32_t count;
  uint32_t size;
  uint16_t type;
  void* offset;
};
struct RenderChar {
  Vec2f pos;
  Vec2f size;
  Vec2f uv_pos;
  Vec2f uv_size;
  Vec4f fg_color;
  Vec4f bg_color;
  float hasColor;
};
class ShaderInstance {
 public:
  GLuint vao, vbo;
  ShaderInstance(std::string vert_path,
                 std::string frag_path,
                 uint32_t size,
                 std::vector<ShaderVar> entries,
                 std::filesystem::path cwd);
  Shader shader;
  void bindVertexArray();
  void bindBuffer();
};

class OpenGLState {
 public:
  OpenGLState(GLFWwindow* window, std::filesystem::path cwd);

  ShaderInstance* image_shader;
  ShaderInstance* text_shader;
  ShaderInstance* box_shader;
  void setResolution(uint32_t w, uint32_t h);

 private:
  GLFWwindow* m_window;
  std::filesystem::path cwd;
};

#endif