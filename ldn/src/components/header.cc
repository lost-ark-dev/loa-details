#include "header.h"

#include "../ldn.h"
#include "../utils/format_utils.h"
#include "box.h"
#include "text.h"
#include <format>
#include <iomanip>
#include <sstream>

Header::Header() {
  closeOpenButton.setOnClick([this]() {
    minimsed = !minimsed;
    closeOpenButton.text = minimsed ? "+" : "-";
    Ldn::g_ldn->setMinimised(minimsed);
  });
  closeOpenButton.text = "-";
  closeOpenButton.size.x = 32 * 1.5;
  Ldn::g_ldn->button_list.push_back(&closeOpenButton);

  screenshotButton.setOnClick([this]() { Ldn::g_ldn->initScreenshot(); });
  screenshotButton.text = "S";
  screenshotButton.size.x = 32 * 1.5;
  Ldn::g_ldn->button_list.push_back(&screenshotButton);

  passThroughButton.setOnClick([this]() { Ldn::g_ldn->enablePassthrough(); });
  passThroughButton.text = "P";
  passThroughButton.size.x = 32 * 1.5;

  pauseButton.setOnClick([this]() { if(Ldn::g_ldn->manager.togglePause())
                                      pauseButton.text = ">";
                                    else
                                      pauseButton.text = "||";
                                  });
  pauseButton.text = "||";
  pauseButton.scale = 0.8;
  pauseButton.size.x = 32 * 1.5;
}
bool Header::canFocus() { return false; }
void Header::onPress(RenderContext *ctx) {}
void Header::onFocus(bool focus) {}
void Header::render(RenderContext *ctx) {
  Vec2f render_position = position;
  render_position.x += 10;
  time_passed_text.type = "bold";
  time_passed_text.setData(FormatUtils::formatTime(time_passed / 1000));
  time_passed_text.color = vec4fs(1);
  time_passed_text.position = render_position;
  time_passed_text.size = size;
  time_passed_text.position.y += size.y * 0.1;
  time_passed_text.render(ctx);

  if (!minimsed) {
    auto tm_w = time_passed_text.getWidth(ctx);

    version_text.setData("LDN version 0.0.1");
    version_text.scale = 0.5;
    version_text.color = vec4f(0.7, 0.7, 0.7, 1);
    version_text.position = render_position;
    version_text.position.x += tm_w + 5;
    version_text.position.y += size.y * 0.2;
    version_text.size = size;
    version_text.render(ctx);
    boss_name.scale = 0.5;
    boss_name.color = vec4f(0.7, 0.7, 0.7, 1);
    boss_name.position = render_position;
    boss_name.position.x += tm_w + 15 + version_text.getWidth(ctx);
    boss_name.position.y += size.y * 0.2;
    boss_name.size = size;
    boss_name.render(ctx);

    total_dmg_text.setData("Total DMG " + FormatUtils::formatNumber(total_dmg));
    total_dmg_text.scale = 0.5;
    total_dmg_text.color = vec4f(0.7, 0.7, 0.7, 1);
    total_dmg_text.position = render_position;
    total_dmg_text.position.x += tm_w + 5;
    total_dmg_text.position.y += size.y * 0.5;
    total_dmg_text.size = size;
    total_dmg_text.render(ctx);

    total_dps_text.setData("Total DPS " + FormatUtils::formatNumber(total_dps));
    total_dps_text.scale = 0.5;
    total_dps_text.color = vec4f(0.7, 0.7, 0.7, 1);
    total_dps_text.position = render_position;
    total_dps_text.position.x += tm_w + 15 + total_dmg_text.getWidth(ctx);
    total_dps_text.position.y += size.y * 0.5;
    total_dps_text.size = size;
    total_dps_text.render(ctx);

    screenshotButton.size.y = ctx->atlas->effective_atlas_height;
    screenshotButton.position.x =
        size.x - closeOpenButton.size.x - 10 - screenshotButton.size.x - pauseButton.size.x;
    screenshotButton.position.y = 5;
    screenshotButton.render(ctx);

    passThroughButton.size.y = ctx->atlas->effective_atlas_height;
    passThroughButton.position.x = size.x - closeOpenButton.size.x - 15 -
                                   screenshotButton.size.x -
                                   passThroughButton.size.x - pauseButton.size.x;
    pauseButton.position.x = size.x - closeOpenButton.size.x - 5 - pauseButton.size.x;
    pauseButton.size.y = ctx->atlas->effective_atlas_height;
    passThroughButton.position.y = 5;
    pauseButton.position.y = 9;
    if (Ldn::g_ldn->pass_through_enabled)
      passThroughButton.text_color = vec4f(0.3, 0.85, 0.1, 1);
    else
      passThroughButton.text_color = vec4fs(1);
    passThroughButton.render(ctx);
    pauseButton.render(ctx);
  }

  closeOpenButton.size.y = ctx->atlas->effective_atlas_height;
  closeOpenButton.position.x = size.x - closeOpenButton.size.x - 5;
  closeOpenButton.position.y = 5;
  closeOpenButton.render(ctx);
}