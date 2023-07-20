#ifndef LDN_DATA_MANAGER
#define LDN_DATA_MANAGER

#include "connection.h"
#include "static_data.h"
#include <map>
#include <string>
#include <vcruntime.h>
#include <vector>

struct Hits {
  size_t casts = 0;
  size_t total = 0;
  size_t crits = 0;
  size_t front_attacks = 0;
  size_t front_attacks_total = 0;
  size_t back_attacks = 0;
  size_t back_attacks_total = 0;
  size_t counters = 0;
  static Hits parseHits(nlohmann::json hits_entry) {
    Hits hits;
    hits.casts = hits_entry["casts"];
    hits.total = hits_entry["total"];
    hits.crits = hits_entry["crit"];
    hits.front_attacks = hits_entry["frontAttack"];
    hits.back_attacks_total = hits_entry["totalBackAttack"];
    hits.front_attacks_total = hits_entry["totalFrontAttack"];
    hits.back_attacks = hits_entry["backAttack"];
    hits.counters = hits_entry["counter"];
    return hits;
  }
};

struct DamageInfo {
  size_t damageDealt = 0;
  size_t totalDamageDealt = 0;
  size_t rdpsDamageReceived = 0;
  size_t rdpsDamageReceivedSupp = 0;
  size_t dps;
};
struct Skill {
  std::string name;
  std::string icon;
  size_t id;
  Hits hits;
  DamageInfo damageInfo;
};

struct Boss {
  size_t max_hp = 0, current_hp = 0;
  std::string id;
  std::string name;
};
class Buff {
public:
    enum class BuffType {
        Buff,
        Debuff
    };
    Buff(){};
    Buff(nlohmann::json& j);
    size_t class_id;
    size_t id;
    size_t skill_id;
    std::string icon;
    std::string class_name;
    BuffType type;
    std::string name;
    std::string skill_name;
    std::string description;
};
class BuffGroup {
public:
    std::map<std::string, Buff> buffs;
};
class Player {
public:
  Player();
  Player(nlohmann::json &entry);
  std::string name;
  std::string id;
  int classId;
  bool isEster = false;
  Hits hits;
  DamageInfo damageInfo;
  std::map<size_t, Skill> skills;
  float damagePercent = 0;
  float damagePercentTop = 0;
  std::vector<std::string> getDataPoints(const std::string type = "damage");
  std::vector<std::string> getBuffRow(std::map<std::string, BuffGroup>& groups);
  std::string getName(StaticData* data);
  nlohmann::json debuffed_dmg, buffed_dmg;
};
class DataPoint {
public:
  std::map<std::string, Player> players;
  DamageInfo damageInfo;
  Boss boss;
  std::map<std::string, BuffGroup> buffs;
  uint64_t fight_start_time = 0;
  uint64_t fight_duration = 0;
  std::vector<std::string> getBuffHeaders(int what = 0);
};
class DataManager {
  uint64_t last_poll = 0;
  bool valid = false;
  bool paused = false;
  bool from_path = false;
  nlohmann::json loaded_json;
public:
  SocketConnection *connection = nullptr;
  StaticData* static_data = nullptr;
  DataPoint dataPoint;
  bool poll();
  bool isValid();
  void initFromPath(std::string path);
  void calculateBuffs(nlohmann::json& j);
};
#endif