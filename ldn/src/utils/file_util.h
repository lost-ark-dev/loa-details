#ifndef FILE_UTILS_H
#define FILE_UTILS_H

#include <fstream>
#include <sstream>
#include <vector>

class FileUtils {
public:
  static std::string file_to_string(std::string path) {
    std::ifstream stream(path);
    std::stringstream ss;
    ss << stream.rdbuf();
    stream.close();
    return ss.str();
  }
  static std::vector<uint8_t> read_bin(std::string path) {
    std::ifstream stream(path, std::ios::binary | std::ios::in);
    stream.seekg(0, stream.end);
    size_t size = stream.tellg();
    stream.seekg(0, stream.beg);
    std::vector<uint8_t> buffer(size);
    stream.read((char *)&buffer[0], size);
    stream.close();
    return buffer;
  }
  static bool string_to_file(std::string path, std::string content) {
    std::ofstream stream(path);
    if (!stream.is_open())
      return false;
    stream << content;
    stream.close();
    return true;
  }
};
#endif
