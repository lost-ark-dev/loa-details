#ifndef LDN_STATIC_DATA_H
#define LDN_STATIC_DATA_H

#include <nlohmann/json.hpp>
#include <map>
#include <string>
#include "../rendering/la.h"

class StaticData {
public:
    void init();
    nlohmann::json classes;
    std::map<std::string, Vec4f> colors;
};
#endif