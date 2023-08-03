#include "header.h"

#include "../ldn.h"
#include "../utils/format_utils.h"
#include "../utils/color_util.h"
#include "../utils/unicode_utils.h"
#include "box.h"
#include "text.h"
#include <format>
#include <iomanip>
#include <sstream>
#include <vector>

Header::Header() {
  background.color = ColorUtils::fromRGBA(22, 22, 22, 0.75);
  closeOpenButton.setOnClick([this]() {
    minimsed = !minimsed;
    closeOpenButton.text = minimsed ? UnicodeUtils::fa_to_str(0xe145) : UnicodeUtils::fa_to_str(0xe15b);
    Ldn::g_ldn->setMinimised(minimsed);
  });
  closeOpenButton.text = UnicodeUtils::fa_to_str(0xe15b);
  Ldn::g_ldn->button_list.push_back(&closeOpenButton);

  screenshotButton.setOnClick([this]() { Ldn::g_ldn->initScreenshot(); });
  screenshotButton.text = UnicodeUtils::fa_to_str(0xec08);
  Ldn::g_ldn->button_list.push_back(&screenshotButton);

  passThroughButton.setOnClick([this]() { Ldn::g_ldn->enablePassthrough(); });
  passThroughButton.text = UnicodeUtils::fa_to_str(0xf6e2);

  pauseButton.setOnClick([this]() { if(Ldn::g_ldn->manager.togglePause())
                                      pauseButton.text = UnicodeUtils::fa_to_str(0xe037);
                                    else
                                      pauseButton.text = UnicodeUtils::fa_to_str(0xe034);
                                  });
  pauseButton.text =  UnicodeUtils::fa_to_str(0xe034);
}
bool Header::canFocus() { return false; }
void Header::onPress(RenderContext *ctx) {}
void Header::onFocus(bool focus) {}
void Header::render(RenderContext *ctx) {
  for(auto* btn : (std::vector<Button*>({&closeOpenButton, &screenshotButton, &passThroughButton, &pauseButton}))) {
    btn->size.x = 30 * ctx->xscale;
  }
  closeOpenButton.position.y = 7 * ctx->yscale;
  screenshotButton.position.y = 7 * ctx->yscale;
  pauseButton.position.y = 7 * ctx->yscale;
  passThroughButton.position.y = 4 * ctx->yscale;
  background.size = size;
  background.position = position;
  background.render(ctx);
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
        size.x - closeOpenButton.size.x - (1 * ctx->xscale) - screenshotButton.size.x - pauseButton.size.x;
    screenshotButton.render(ctx);

    passThroughButton.size.y = ctx->atlas->effective_atlas_height;
    passThroughButton.position.x = size.x - closeOpenButton.size.x - (4 * ctx->xscale) -
                                   screenshotButton.size.x -
                                   passThroughButton.size.x - pauseButton.size.x;
    pauseButton.position.x = size.x - closeOpenButton.size.x - pauseButton.size.x;
    pauseButton.size.y = ctx->atlas->effective_atlas_height;
    pauseButton.text = (Ldn::g_ldn->manager.isPaused() ? UnicodeUtils::fa_to_str(0xe037) : UnicodeUtils::fa_to_str(0xe034));
    if (Ldn::g_ldn->pass_through_enabled)
      passThroughButton.text_color = vec4f(0.3, 0.85, 0.1, 1);
    else
      passThroughButton.text_color = vec4fs(1);
    passThroughButton.render(ctx);
    pauseButton.render(ctx);
  }

  closeOpenButton.size.y = ctx->atlas->effective_atlas_height;
  closeOpenButton.position.x = size.x - closeOpenButton.size.x ;
  closeOpenButton.render(ctx);
}