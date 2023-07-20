#ifndef LDN_FORMAT_H
#define LDN_FORMAT_H

#include <iomanip>
#include <sstream>
#include <string>
class FormatUtils {
public:
  static std::string format(double val) {
    std::stringstream ss;
    ss << std::fixed << std::setprecision(1) << val;
    return ss.str();
  }
  static std::string formatNumber(size_t n) {
    if (n < 1000)
      return std::to_string(n);
    if (n < 1000000) {
      return FormatUtils::format((double)n / 1000) + "k";
    }
    if (n < 1000000000) {
      return FormatUtils::format((double)n / 1000000) + "m";
    }
    return FormatUtils::format((double)n / 1000000000) + "b";
  };
  static std::string formatTime(size_t durr) {
    size_t mins = std::floor(durr) / 60;
    size_t secs = durr % 60;
    std::string min_str = mins == 0 ? "00" : mins < 10 ? "0"+std::to_string(mins) : std::to_string(mins);
    std::string secs_str = secs == 0 ? "00" : secs < 10 ? "0"+std::to_string(secs) : std::to_string(secs);
    return min_str + ":" + secs_str;
  }
};

#endif