#include "data_manager.h"
#include "../utils/file_util.h"
#include "../utils/format_utils.h"
#include "static_data.h"
#include <chrono>
#include <iostream>
#include <string>
#include <vcruntime.h>
#include <vector>

using json = nlohmann::json;
bool DataManager::poll() {

  using namespace std::chrono;
  uint64_t now =
      duration_cast<milliseconds>(system_clock::now().time_since_epoch())
          .count();
  if (last_poll > 0 && now - last_poll < 500 && !from_path)
    return false;

  json root = connection->getLatestData();

  if (!from_path) {
    if (!root.contains("type"))
      return false;

    if (root["type"] != "data") {
      std::string d = root["data"];
      std::cout << "received data: " << d << "\n";
      if (d == "new-zone") {
        DataPoint p;
        dataPoint = p;
        paused = false;
        std::cout << "unpausing zone\n";

      } else {
        std::cout << "pausing\n";
        paused = true;
      }
      return true;
    }
  }
  json raw = from_path ? loaded_json : root["data"];
  if (!raw.contains("startedOn")) {
    std::cout << "unpausing\n";
    return false;
  }
  if (paused && !from_path &&
      dataPoint.fight_start_time < raw["fightStartedOn"]) {
    std::cout << "unpausing new fight\n";
    paused = false;
  }

  size_t total_dmg = 0;
  size_t top_damage = 0;
  size_t top_damage_rdps = 0;

  DataPoint point;
  point.fight_start_time = raw["fightStartedOn"];
  if (point.fight_start_time != 0 && !paused) {

    point.fight_duration = now - point.fight_start_time;
  } else if (paused) {
    point.fight_duration = dataPoint.fight_duration;
  }
  if (raw.contains("currentBoss")) {
    json boss_entry = raw["currentBoss"];
    point.boss.current_hp = boss_entry["currentHp"];
    point.boss.max_hp = boss_entry["maxHp"];
    point.boss.id = boss_entry["id"];
    point.boss.name = boss_entry["name"];
  }
  json damageStatistics = raw["damageStatistics"];
  point.damageInfo.damageDealt = damageStatistics["totalDamageDealt"];
  point.tankInfo.damageTaken = damageStatistics["totalDamageTaken"];
  point.tankInfo.topDamageTaken = damageStatistics["topDamageTaken"];
  for (json &entity : raw["entities"]) {
    if (entity["isPlayer"] ||
        (entity.contains("isEsther") && entity["isEsther"])) {
      Player p(entity);
      if (p.damageInfo.damageDealt == 0)
        continue;
      if (p.isEster) {
        point.damageInfo.damageDealt += p.damageInfo.damageDealt;
      }
      total_dmg += p.damageInfo.damageDealt;
      if (p.damageInfo.damageDealt > top_damage)
        top_damage = p.damageInfo.damageDealt;
      if (p.rDps() > top_damage_rdps)
        top_damage_rdps = p.rDps();
      point.players[p.id] = p;
    }
  }
  if (total_dmg)
    for (auto &p : point.players) {
      p.second.damagePercent =
          (float)p.second.damageInfo.damageDealt / total_dmg;
      auto t = point.fight_duration / 1000;
      p.second.damageInfo.dps =
          p.second.damageInfo.damageDealt / (t == 0 ? 1 : t);
      p.second.damagePercentTop =
          (float)p.second.damageInfo.damageDealt / top_damage;
      p.second.rDamagePercent = (float)p.second.rDps() / total_dmg;
      p.second.rDamagePercentTop = (float)p.second.rDps() / top_damage_rdps;
      p.second.damageInfo.rDps = p.second.rDps() / (t == 0 ? 1 : t);

      p.second.tankPercent =
          (float)p.second.tankinfo.damageTaken / point.tankInfo.damageTaken;
      p.second.tankPercentTop =
          (float)p.second.tankinfo.damageTaken / point.tankInfo.topDamageTaken;
    }
  dataPoint = point;
  last_poll = now;
  calculateBuffs(raw);
  return true;
}
bool DataManager::isValid() { return valid; }

Player::Player() {}
Player::Player(json &j) {
  name = j["name"];
  id = j["id"];
  isEster = j.contains("isEsther") && j["isEsther"];
  if (j["isPlayer"])
    classId = j["classId"];
  json hits_entry = j["hits"];
  hits = Hits::parseHits(hits_entry);
  json damageEntry = j["damageInfo"];
  damageInfo.damageDealt = damageEntry["damageDealt"];
  damageInfo.rdpsDamageReceived = damageEntry["rdpsDamageReceived"];
  damageInfo.rdpsDamageReceivedSupp = damageEntry["rdpsDamageReceivedSupp"];
  damageInfo.rdpsDamageGiven = damageEntry["rdpsDamageGiven"];
  tankinfo.damageTaken = j["damageTaken"];
  debuffed_dmg = j["damageDealtDebuffedBy"];
  buffed_dmg = j["damageDealtBuffedBy"];
  for (json &skill : j["skills"]) {
    Skill entry;
    entry.name = skill["name"];
    entry.icon = skill["icon"];
    entry.id = skill["id"];
    entry.hits = Hits::parseHits(skill["hits"]);
    entry.damageInfo.damageDealt = skill["damageInfo"]["damageDealt"];
    skills[entry.id] = entry;
  }
}
std::vector<std::string> Player::getDataPoints(uint64_t time,
                                               const std::string &type) {
  size_t t = time / 1000;
  if (type == "tank") {
    return {FormatUtils::formatNumber(tankinfo.damageTaken),
            FormatUtils::format(tankPercent * 100) + "%",
            FormatUtils::formatNumber(tankinfo.damageTaken / (t == 0 ? 1 : t))};
  }
  if (type == "rdps") {
    return {FormatUtils::formatNumber(rDps()),
            FormatUtils::format(rDamagePercent * 100) + "%",
            FormatUtils::formatNumber(damageInfo.rDps),
            FormatUtils::formatNumber(damageInfo.rdpsDamageReceived),
            FormatUtils::formatNumber(damageInfo.rdpsDamageGiven),
            FormatUtils::formatNumber(damageInfo.rdpsDamageReceived /
                                      (t == 0 ? 1 : t)),
            FormatUtils::formatNumber(damageInfo.rdpsDamageGiven /
                                      (t == 0 ? 1 : t)),
            FormatUtils::format(
                ((float)damageInfo.rdpsDamageReceived /
                 (damageInfo.damageDealt - damageInfo.rdpsDamageReceived)) *
                100) +
                "%",
            FormatUtils::format(
                ((float)damageInfo.rdpsDamageReceivedSupp /
                 (damageInfo.damageDealt - damageInfo.rdpsDamageReceived)) *
                100) +
                "%",
            FormatUtils::format(
                ((float)(damageInfo.rdpsDamageReceived -
                         damageInfo.rdpsDamageReceivedSupp) /
                 (damageInfo.damageDealt - damageInfo.rdpsDamageReceived)) *
                100) +
                "%"};
  }

  return {
      FormatUtils::formatNumber(damageInfo.damageDealt),
      FormatUtils::format(damagePercent * 100) + "%",
      FormatUtils::formatNumber(damageInfo.dps),
      FormatUtils::format(((float)hits.crits / hits.total) * 100) + "%",
      hits.front_attacks_total > 0
          ? FormatUtils::format(
                ((float)hits.front_attacks / hits.front_attacks_total) * 100) +
                "%"
          : "0%",
      hits.back_attacks_total > 0
          ? FormatUtils::format(
                ((float)hits.back_attacks / hits.back_attacks_total) * 100) +
                "%"
          : "0%",
      FormatUtils::format(
          ((float)damageInfo.rdpsDamageReceived /
           (damageInfo.damageDealt - damageInfo.rdpsDamageReceived)) *
          100) +
          "%",
      FormatUtils::format(
          ((float)damageInfo.rdpsDamageReceivedSupp /
           (damageInfo.damageDealt - damageInfo.rdpsDamageReceived)) *
          100) +
          "%",
      FormatUtils::format(
          ((float)(damageInfo.rdpsDamageReceived -
                   damageInfo.rdpsDamageReceivedSupp) /
           (damageInfo.damageDealt - damageInfo.rdpsDamageReceived)) *
          100) +
          "%",
      std::to_string(hits.counters)};
}
void DataManager::initFromPath(std::string path) {
  std::string content = FileUtils::file_to_string(path);
  loaded_json = json::parse(content);
  from_path = true;
  paused = true;
  size_t a = loaded_json["fightStartedOn"];
  size_t b = loaded_json["lastCombatPacket"];
  dataPoint.fight_duration = b - a;
}
std::string Player::getName(StaticData *data) {
  if (isEster)
    return name;
  std::string class_name = data->classes[std::to_string(classId)];
  return name + " (" + class_name + ")";
}
void DataManager::calculateBuffs(json &j) {
  json &buffs = j["damageStatistics"]["buffs"];
  json &debuffs = j["damageStatistics"]["debuffs"];
  std::map<std::string, BuffGroup> &targets = dataPoint.buffs;
  for (auto &ee : buffs.items()) {
    json &e = ee.value();
    std::string category = e["buffcategory"];
    size_t target_type = e["target"];
    int buff_type = e["bufftype"];
    if (target_type == 1 && e["category"] == "buff" && (135 & buff_type) != 0 &&
        (category == "classskill" || category == "identity" ||
         category == "ability")) {
      Buff buff(e);
      size_t group_id = e["uniquegroup"];
      std::string class_name =
          static_data->classes[std::to_string(buff.class_id)];
      buff.class_name = class_name;
      std::string key =
          class_name + "_" +
          (group_id == 0 ? buff.skill_name : std::to_string(group_id));
      targets[key].buffs[ee.key()] = buff;
    }
  }
  for (auto &ee : debuffs.items()) {
    json &e = ee.value();
    std::string category = e["buffcategory"];
    size_t target_type = e["target"];
    int buff_type = e["bufftype"];
    if (target_type == 1 && e["category"] == "debuff" &&
        (135 & buff_type) != 0 &&
        (category == "classskill" || category == "identity" ||
         category == "ability")) {
      Buff buff(e);
      size_t group_id = e["uniquegroup"];
      std::string class_name =
          static_data->classes[std::to_string(buff.class_id)];
      buff.class_name = class_name;
      std::string key =
          class_name + "_" +
          (group_id == 0 ? buff.skill_name : std::to_string(group_id));
      targets[key].buffs[ee.key()] = buff;
    }
  }
  return;
}
std::vector<std::string> DataPoint::getBuffHeaders(int what) {
  std::vector<std::string> entries;
  for (auto &entry : buffs) {
    std::string name = "";
    for (auto &buff_entry : entry.second.buffs) {
      auto &buff = buff_entry.second;
      if (what == 0) {
        name = buff.class_name;
      } else {
        name = buff.icon;
      }
      break;
    }
    if (name.find("Party: ") == 0)
      name = name.substr(7);
    entries.push_back(name);
  }
  return entries;
}
Buff::Buff(json &j) {
  class_id = j["source"]["skill"]["classid"];
  skill_id = j["source"]["skill"]["id"];
  skill_name = j["source"]["skill"]["name"];
  type = j["category"] == "debuff" ? BuffType::Debuff : BuffType::Buff;
  name = j["source"]["name"];
  description = j["source"]["desc"];
  icon = j["source"]["icon"];
}
std::vector<std::string>
Player::getBuffRow(std::map<std::string, BuffGroup> &groups) {
  std::vector<std::string> entries;

  for (auto &entry : groups) {
    std::string final;
    float group_hits = 0;
    for (auto &buff : entry.second.buffs) {
      Buff &b = buff.second;
      std::string id = buff.first;
      if (b.type == Buff::BuffType::Buff) {
        if (buffed_dmg.contains(id)) {
          size_t am = buffed_dmg[id];
          group_hits += (float)am / damageInfo.damageDealt;
        }
      } else {
        if (debuffed_dmg.contains(id)) {
          size_t am = debuffed_dmg[id];
          group_hits += (float)am / damageInfo.damageDealt;
        }
      }
    }
    if (group_hits > 0) {
      final = FormatUtils::format(group_hits * 100) + "%";
    } else
      final = "-";
    entries.push_back(final);
  }

  return entries;
}
size_t Player::rDps() {
  return damageInfo.damageDealt - damageInfo.rdpsDamageReceived +
         damageInfo.rdpsDamageGiven;
}
float Player::getOrderValue(const std::string &tab) {
  if (tab == "rdps")
    return rDamagePercentTop;
  if (tab == "tank")
    return tankPercentTop;
  return damagePercentTop;
}