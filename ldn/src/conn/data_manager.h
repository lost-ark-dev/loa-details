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
  double rdpsDamageReceived = 0;
  double rdpsDamageReceivedSupp = 0;
  double rdpsDamageGiven = 0;
  size_t dps;
  size_t rDps;
};
struct TankInfo {
  size_t damage_taken = 0;
  size_t top_damage_taken = 0;
  size_t shield_done = 0;
  size_t top_shield_done = 0;
  size_t e_shield_done = 0;
  size_t top_e_shield_done= 0;
};
struct Skill {
  std::string name;
  std::string icon;
  size_t id;
  Hits hits;
  DamageInfo damage_info;
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
        Debuff,
        Other,
    };
    Buff(){};
    Buff(nlohmann::json& j);
    size_t class_id;
    size_t id;
    size_t skill_id;
    std::string icon;
    std::string class_name;
    BuffType type;
    std::string category_type;
    std::string name;
    std::string setname;
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
  TankInfo tankinfo;
  std::map<size_t, Skill> skills;
  float damagePercent = 0;
  float damagePercentTop = 0;
  float rDamagePercent = 0;
  float rDamagePercentTop = 0;
  float tankPercent = 0;
  float tankPercentTop = 0;
  float shieldGivenPercent = 0;
  float shieldGivenPercentTop = 0;
  float eShieldGivenPercent = 0;
  float eShieldGivenPercentTop = 0;
  std::vector<std::string> getDataPoints(uint64_t time, const std::string& type = "damage");
  float getOrderValue(const std::string& tab);
  std::vector<std::string> getBuffRow(std::map<std::string, BuffGroup>& groups);
  std::string getName(StaticData* data, bool render_name = true);
  nlohmann::json debuffed_dmg, buffed_dmg;
  size_t rDps();
};
class DataPoint {
public:
  std::map<std::string, Player> players;
  DamageInfo damageInfo;
  TankInfo tankInfo;
  Boss boss;
  std::map<std::string, BuffGroup> buffs;
  std::map<std::string, BuffGroup> self_buffs;
  uint64_t fight_start_time = 0;
  uint64_t fight_duration = 0;
  std::vector<std::string> getBuffHeaders(int what = 0);
  std::vector<std::vector<std::string>> getHeaderImages(int what = 0);
};
class DataManager {
  uint64_t last_poll = 0;
  size_t paused_for = 0;
  size_t paused_at = 0;
  bool valid = false;
  bool paused = false;
  bool from_path = false;
  nlohmann::json loaded_json;
public:
  SocketConnection *connection = nullptr;
  StaticData* static_data = nullptr;
  DataPoint data_point;
  bool poll();
  bool isValid();
  void initFromPath(std::string path);
  void calculateBuffs(nlohmann::json& j);
  bool togglePause();
};
#endif