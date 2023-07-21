#include "static_data.h"
#include "../utils/file_util.h"



const char *DEFAULT_COLORS =
    R"config({"Warrior":{"color":"#000000","defaultColor":"#000000"},"Berserker":{"color":"#ee2e48","defaultColor":"#ee2e48"},"Destroyer":{"color":"#7b9aa2","defaultColor":"#7b9aa2"},"Gunlancer":{"color":"#E1907E","defaultColor":"#E1907E"},"Paladin":{"color":"#ff9900","defaultColor":"#ff9900"},"Female Warrior":{"color":"#000000","defaultColor":"#000000"},"Slayer":{"color":"#3c484f","defaultColor":"#3c484f"},"Mage":{"color":"#000000","defaultColor":"#000000"},"Arcanist":{"color":"#b38915","defaultColor":"#b38915"},"Summoner":{"color":"#22aa99","defaultColor":"#22aa99"},"Bard":{"color":"#674598","defaultColor":"#674598"},"Sorceress":{"color":"#66aa00","defaultColor":"#66aa00"},"Martial Artist (Female)":{"color":"#000000","defaultColor":"#000000"},"Wardancer":{"color":"#aaaa11","defaultColor":"#aaaa11"},"Scrapper":{"color":"#990099","defaultColor":"#990099"},"Soulfist":{"color":"#316395","defaultColor":"#316395"},"Glaivier":{"color":"#f6da6a","defaultColor":"#f6da6a"},"Martial Artist (Male)":{"color":"#000000","defaultColor":"#000000"},"Striker":{"color":"#994499","defaultColor":"#994499"},"Assassin":{"color":"#000000","defaultColor":"#000000"},"Deathblade":{"color":"#a91a16","defaultColor":"#a91a16"},"Shadowhunter":{"color":"#0099c6","defaultColor":"#0099c6"},"Reaper":{"color":"#109618","defaultColor":"#109618"},"Gunner (Male)":{"color":"#000000","defaultColor":"#000000"},"Sharpshooter":{"color":"#dd4477","defaultColor":"#dd4477"},"Deadeye":{"color":"#4442a8","defaultColor":"#4442a8"},"Artillerist":{"color":"#33670b","defaultColor":"#33670b"},"Machinist":{"color":"#3b4292","defaultColor":"#3b4292"},"Gunner (Female)":{"color":"#000000","defaultColor":"#000000"},"Gunslinger":{"color":"#6bcec2","defaultColor":"#6bcec2"},"Specialist":{"color":"#000000","defaultColor":"#000000"},"Artist":{"color":"#a34af0","defaultColor":"#a34af0"},"Aeromancer":{"color":"#084ba3","defaultColor":"#084ba3"},"Alchemist":{"color":"#3a945e","defaultColor":"#3a945e"}})config";

void StaticData::init() {

  auto classes_in = FileUtils::read_bin("meter-data/databases/PCData.json");
  classes =  nlohmann::json::parse(classes_in.data(), classes_in.data()+classes_in.size());
  nlohmann::json color_json = nlohmann::json::parse(DEFAULT_COLORS);
  for (auto &entry : color_json.items()) {
    std::string key = entry.key();
    nlohmann::json &item = entry.value();
    std::string color_str = item["defaultColor"];
    Vec4f target_color;
    for (unsigned int i = 0; i < 3; i ++) {
      std::string byteString = color_str.substr(1 + (i *2 ), 2);
      uint8_t number = (uint8_t)strtol(byteString.c_str(), NULL, 16);
      float f = (float)number / 255;
      if(i == 0)
        target_color.x = f;
      else if (i == 1)
        target_color.y = f;
      else if (i == 2)
        target_color.z = f;
    }
    target_color.w = 0.7;
    colors[key] = target_color;
  }
}