#ifndef DEC_UNICODE_UTILS
#define DEC_UNICODE_UTILS
#include <string>
#include <vector>
class UnicodeUtils {
 public:
  static std::vector<int32_t> utf8_to_codepoint(std::string raw) {
    std::vector<int32_t> points;
    std::string u = raw;
    int l = u.length();
    while (l > 0) {
      uint8_t u0 = u[0];
      if (u0 >= 0 && u0 <= 127) {
        points.push_back((int32_t)u0);
        l -= 1;
        u = u.substr(1);
        continue;
      }
      if (l < 2)
        break;
      uint8_t u1 = u[1];
      if (u0 >= 192 && u0 <= 223) {
        points.push_back((u0 - 192) * 64 + (u1 - 128));
        l -= 2;
        u = u.substr(2);
        continue;
      }
      if ((uint8_t)u[0] == 0xed && (u[1] & 0xa0) == 0xa0)
        break;
      if (l < 3)
        break;
      uint8_t u2 = u[2];
      if (u0 >= 224 && u0 <= 239) {
        points.push_back((u0 - 224) * 4096 + (u1 - 128) * 64 + (u2 - 128));
        l -= 3;
        u = u.substr(3);
        continue;
      }
      if (l < 4)
        break;
      uint8_t u3 = u[3];
      if (u0 >= 240 && u0 <= 247) {
        points.push_back((u0 - 240) * 262144 + (u1 - 128) * 4096 +
                         (u2 - 128) * 64 + (u3 - 128));
        l -= 4;
        u = u.substr(4);
      }
    }
    return points;
  }
  static std::string fa_to_str(int32_t value) {
    std::vector<int32_t> vals = {value};
    return unicode_to_utf8(vals);
  }
  static std::string unicode_to_utf8(std::vector<int32_t>& in) {
    std::string out = "";
    for (int32_t cp : in) {
      if (cp <= 0x7F) {
        out += (char)cp;
        continue;
      }
      if (cp <= 0x07FF) {
        out += (char)(((cp >> 6) & 0x1F) | 0xC0);
        out += (char)(((cp >> 0) & 0x3F) | 0x80);
        continue;
      }
      if (cp <= 0xFFFF) {
        out += (char)(((cp >> 12) & 0x0F) | 0xE0);
        out += (char)(((cp >> 6) & 0x3F) | 0x80);
        out += (char)(((cp >> 0) & 0x3F) | 0x80);
        continue;
      }
      if (cp <= 0x10FFFF) {
        // 4-byte unicode
        out += (char)(((cp >> 18) & 0x07) | 0xF0);
        out += (char)(((cp >> 12) & 0x3F) | 0x80);
        out += (char)(((cp >> 6) & 0x3F) | 0x80);
        out += (char)(((cp >> 0) & 0x3F) | 0x80);
        continue;
      }
    }
    return out;
  }
};

#endif