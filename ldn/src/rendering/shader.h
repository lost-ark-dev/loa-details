#ifndef SHADER_H
#define SHADER_H

#include <iostream>
#include <string>
#include <vector>
#include "glad.h"
#include "la.h"

class Shader {
 public:
  GLuint pid;
  std::vector<GLuint> shader_ids;
  Shader(std::string vertex,
         std::string fragment,
         std::vector<std::string> others);
  Shader() {}

  void set2f(std::string name, float x, float y);
  void set4f(std::string name, float x, float y, float z, float w);
  void set1f(std::string name, float v);

  void use();

 private:
  GLuint compileSimple(GLuint type, std::string path);
  void checkCompileErrors(GLuint shader, std::string type);
  const std::string shaderTypeString(GLuint shader);
};

#endif
