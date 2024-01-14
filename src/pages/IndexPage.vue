<template>
  <q-scroll-area style="height: calc(100vh - 32px - 56px)">
    <div class="changelog-page">
      <h5>About</h5>
      <p>
        LOA Details allows you to track real-time stats of the game Lost Ark and
        view and parse its logged data.
        <br />
        <br />
        This app is a clone from the
        <a
          @click="openLinkInBrowser('https://github.com/karaeren/loa-details')"
          class="custom-link"
          >original interface</a
        >
        from
        <a
          @click="openLinkInBrowser('https://github.com/karaeren')"
          class="custom-link"
          >karaeren</a
        >
        It has been modified to work as a standalone program, without the need
        of any 3rd party logger. The packet sniffing part has been made from
        scratch by
        <a
          @click="openLinkInBrowser('https://github.com/Herysia')"
          class="custom-link"
          >Herysia</a
        >
        and
        <a
          @click="openLinkInBrowser('https://github.com/Mathicha')"
          class="custom-link"
          >Mathi</a
        >, however, we can't help but thank
        <a
          @click="openLinkInBrowser('https://github.com/Shalzuth')"
          class="custom-link"
          >Shalzuth</a
        >
        for his work on
        <a
          @click="
            openLinkInBrowser('https://github.com//shalzuth/LostArkLogger')
          "
          class="custom-link"
          >LostArkLogger</a
        >.
      </p>

      <p>
        Refer to the
        <a
          class="custom-link"
          @click="openLinkInBrowser('https://discord.gg/C3fr3EBXbS')"
        >
          Discord Server</a
        >
        for full change log.
      </p>

      <h5>Changelog</h5>
      <h6 id="1-4-21">1.4.21</h6>
      <ul>
        <li>
          Fix shared damage not being excluded from live view (g1 valtan, g3
          kyangel, ?)
        </li>
      </ul>
      <h6 id="1-4-20">1.4.20</h6>
      <ul>
        <li>Support for game update - 10/01/2024 (Brel Hell)</li>
      </ul>
      <h6 id="1-4-19">1.4.19</h6>
      <ul>
        <li>Support for game update - 13/12/2023 (Voldis)</li>
      </ul>
      <h6 id="1-4-18">1.4.18</h6>
      <ul>
        <li>Fix slayer icon</li>
        <li>
          Fix missing self buff for Souleater (may result in some other buffs
          showing, lemme know if you see buffs that shouldn't be there)
        </li>
      </ul>
      <h6 id="1-4-17">1.4.17</h6>
      <ul>
        <li>Support for game update - 15/11/2023 (Soul Eater)</li>
        <li>
          Changed icon format to website's one as the one used before isn't
          updated by sg anymore (might make a slight visual difference)
        </li>
      </ul>
      <h6 id="1-4-16">1.4.16</h6>
      <ul>
        <li>Support for game update - 25/10/2023 (Chaos Gate)</li>
      </ul>
      <h6 id="1-4-15">1.4.15</h6>
      <ul>
        <li>Fix counter tracking not working correctly</li>
      </ul>
      <h6 id="1-4-14">1.4.14</h6>
      <ul>
        <li>Support for game update - 11/10/2023 (Monster Bash)</li>
      </ul>
      <h6 id="1-4-13">1.4.13</h6>
      <ul>
        <li>Support for game update - 20/09/2023 (Weekly maintenance)</li>
      </ul>
      <h6 id="1-4-12">1.4.12</h6>
      <ul>
        <li>Fix invalid projectileId</li>
      </ul>
      <h6 id="1-4-11">1.4.11</h6>
      <ul>
        <li>Game update - 13/09/2023 - Round 2</li>
      </ul>
      <h6 id="1-4-10">1.4.10</h6>
      <ul>
        <li>Hotfix - 13/09/2023 - opcodes update</li>
      </ul>
      <h6 id="1-4-9">1.4.9</h6>
      <ul>
        <li>Support for Game update - 13/09/2023 - Jump for the endgame</li>
      </ul>
      <h6 id="1-4-8">1.4.8</h6>
      <ul>
        <li>
          Fix some skills not tracked properly (traps), including Sorceress
          Frost Call with Rule enhancement
        </li>
      </ul>
      <h6 id="1-4-7">1.4.7</h6>
      <ul>
        <li>Support for Game update - 16/08/2023 - Aeromancer</li>
      </ul>
      <h6 id="1-4-6">1.4.6</h6>
      <ul>
        <li>Fix issue with summons</li>
      </ul>
      <h6 id="1-4-5">1.4.5</h6>
      <ul>
        <li>Support for Game update - 02/08/2023</li>
      </ul>
      <h6 id="1-4-4">1.4.4</h6>
      <ul>
        <li>Fix issue with summons</li>
      </ul>
      <h6 id="1-4-3">1.4.3</h6>
      <ul>
        <li>Update missing data for 12/07/2023 (icons & names)</li>
      </ul>
      <h6 id="1-4-2">1.4.2</h6>
      <ul>
        <li>Support for game update 12/07/2023 - Kakul hell</li>
        <li>syn%/rdps math fixes on directional buffs (blade & gl)</li>
        <li>Add new option to toggle always on top (by @raphlau)</li>
      </ul>
      <h6 id="1-4-1">1.4.1</h6>
      <ul>
        <li>
          Fix for settings "Include Esther in Total damage": when it is turned
          off, player damage % will ignore esther damage (while still showing
          esther in the list)
        </li>
        <li>Backend integration improvements</li>
      </ul>
      <h6 id="1-4-0">1.4.0</h6>
      <ul>
        <li>Support for game update 21/06/2023 - Ark Pass Season 4</li>
        <li>rDPS part 2 (see below)</li>
        <li>
          Added stats query for rdps: If the query failed, it'll display a
          warning message near the player (requires network connection) Rdps now
          takes into account:
          <ul>
            Additions
            <li>Crit rate overcap for crit synergies</li>
            <li>Spec scaling on supports identities</li>
            <li>Atk power scaling for support atk power</li>
            <li>
              Few math fixes (still working on the doc explaining the maths)
            </li>
          </ul>
          <ul>
            Still not working
            <li>Flash orbs</li>
            <li>Defense reduction bracelet (the crit one should work)</li>
          </ul>
        </li>
        <li>
          Added columns with their respective settings:
          <ul>
            <li>sSyn%: Synergy applied to player from the support(s)</li>
            <li>dSyn%: Synergy applied to player from the dps(s)</li>
            <li>Syn%: Is the sum of the 2</li>
          </ul>
        </li>
        <li>Added Kayangel icon & names in encounter list (log view)</li>
        <li>
          Allow for an offline way to start the meter, it'll just display the
          error for 10s and skip: this allow ppl without internet to start it,
          or do disable updates by blocking with a firewall for ex
        </li>
      </ul>
      <h6 id="1-3-2">1.3.2</h6>
      <ul>
        <li>Support for game update 14/06/2023 - June (Elgacia)</li>
      </ul>
      <h6 id="1-3-1">1.3.1</h6>
      <ul>
        <li>
          Fix some "self" buffs applied on target that were processed for the
          whole party (Ex: Sharshooter Death Strike of Mark of Death)
        </li>
      </ul>
      <h6 id="1-3-0">1.3.0</h6>
      <ul>
        <li>
          Support more casts for skills (focus was primarly to show arcana cards
          casts, but it may include more unlogged casts)
        </li>
        <li>
          Current boss name is included when talking a screenshot of live view
        </li>
        <li>
          Added a warning message when localplayer data is missing (which means
          most buff related feature will might show wrong data)
        </li>
        <li>Add button to dismiss "reset transition" notification</li>
        <li>
          rDPS - 1st step towards rdps (This is an experimental feature, don't
          trust the values too much there - Aka limitations and potential
          bugs/mistakes)
          <ul>
            Features
            <li>
              DMG tab: Added syn% column, which represent the % of synergies
              applied to your base dmg
            </li>
            <li>
              DMG tab: Visually display the dmg portion gained from synergies
              (with a darker background)
            </li>
            <li>
              rDps tab: show and rank players per rDps. rDps naming is inspired
              from RPGLogs metric. It is
              rDps=DamageDone-DamageRecvFromSynergies+DamageGivenWithSynergies,
              and roughly means how much you contributed to the raid damage wise
            </li>
          </ul>
          <ul>
            Limitations
            <li>
              Spec scaling buff (Serenade of Courage) from bard uses base values
              (5,10,15%) instead of scaling with spec. Because we don't have
              spec stat yet
            </li>
            <li>
              Support atk power buffs part that gives +15% of caster's base atk
              power is ignored. Because we don't know base atk. power yet
            </li>
            <li>
              Yearning "Dexterity" buff is ignored. Because we don't know weapon
              quality yet (and therefore skill damage % that scales additively
              with yearning)
            </li>
            <li>
              Crit chance overcap isn't handled yet. Because we don't have crit
              stat yet
            </li>
            <li>
              Defense reduction is approximated to 50% of the value, because i
              managed to reverse defense formula for players, but it doesn't
              seem to work with npcs
            </li>
          </ul>
          <ul>
            Maths
            <li>
              The way those values are calculated will be explained further in
              the next steps of rdps
            </li>
          </ul>
          <ul></ul>
        </li>
        <li>
          Fix slayer identity "Burst" buff not being displayed in self buff /
          skill breakdown
        </li>
        <li>
          Removed obsolete columns "HBuf%", "HDebuf%", "DBuf%", "DDebuf%" as
          Syn% is more relevant. Might wanna split dps and support in 2 columns?
          Lemme know what you think
        </li>
      </ul>
      <h6 id="1-2-9">1.2.9</h6>
      <ul>
        <li>
          You like our work? There is now a way to
          <a
            class="custom-link"
            @click="openLinkInBrowser('https://patreon.com/Herysia')"
            >support us</a
          >
          !
        </li>
        <li>Slightly changed main page</li>
      </ul>
      <h6 id="1-2-8">1.2.8</h6>
      <ul>
        <li>Support for game update 10/05/2023 - May (Slayer)</li>
      </ul>
      <h6 id="1-2-7">1.2.7</h6>
      <ul>
        <li>Fix previous commit that broke more than it fixed (yh i'm dumb)</li>
        <li>
          Esther is now counted in Total Damage and Total DPS (can be disabled
          in settings->include esther in total damage (only show when display
          esther is enabled))
        </li>
      </ul>
      <h6 id="1-2-6">1.2.6</h6>
      <ul>
        <li>Add basic wiki that includes how to read data</li>
        <li>Add changelogs to the main view</li>
        <li>Damage % is now properly calculated when esthers are displayed</li>
      </ul>
      <h6 id="1-2-5">1.2.5</h6>
      <ul>
        <li>
          UI now saving horizontal/vertical scroll position when navigating
          within a session (resets when going back to session list)
        </li>
      </ul>
      <h6 id="1-2-4">1.2.4</h6>
      <ul>
        <li>Fix esther not displayed in live</li>
      </ul>
      <h6 id="1-2-3">1.2.3</h6>
      <p>
        <strong><strong>Esther update</strong></strong>
      </p>
      <ul>
        <li>Esther will now be displayed in &quot;dmg&quot; tab</li>
        <li>
          Can be toggle on/off in
          <code
            >settings-&gt;damage meter-&gt;functionality-&gt;display
            esther</code
          >
        </li>
        <li>
          Color can be customized in
          <code
            >settings-&gt;damage meter-&gt;functionality-&gt;esther color</code
          >
        </li>
      </ul>
      <p><strong>meter-core (mostly for devs)</strong></p>
      <ul>
        <li>
          guess player is only called on skill start (it&#39;ll prevent some
          unknown projectiles to be considered as player -&gt; happened while
          you were inside shandi&#39;s world in g6 brel for ex)
        </li>
        <li>StatusEffect expiration fixes</li>
        <li>Esther support</li>
        <li>upgrade to typescript 5</li>
        <li>
          build config has been modified as i realized tsup bundle wasn&#39;t
          only type checking called methods
        </li>
      </ul>
      <p><strong>meter-data</strong></p>
      <ul>
        <li>esther support</li>
      </ul>
      <h6 id="1-2-2">1.2.2</h6>
      <p>
        <strong><strong>Shield tracking update</strong></strong> by @Henjuro
      </p>
      <ul>
        <li>
          4 new tabs:
          <ul>
            <li>SHIELD D: Shield done (to you and other players)</li>
            <li>SHIELD G: Shield gotten (from you and other players)</li>
            <li>
              ESHIELD D: Effective shield done - shield done that has been
              consumed by damage
            </li>
            <li>
              ESHIELD G: Effective shield gotten - shield gotten that has been
              consumed by damage
            </li>
          </ul>
        </li>
        <li>You can toggle those tabs on and off in the settings</li>
        <li>
          <p>
            You can see overall value for each metric in the 1st column, and
            details per skills/source in the others
          </p>
        </li>
        <li>
          <p>
            Those values will be available for all logs made after 1.2.0 after
            reparse
          </p>
        </li>
      </ul>
      <p><strong>Regarding the rising number of tabs &amp; columns</strong></p>
      <p>
        We are aware that live version is starting to be overloaded, but that
        this data is still interesting to see, and some of you might want to
        only enable some features for parse. We are currently reworking the
        settings format and will include a way to enable each settings
        independently for live &amp; parse with that update
      </p>
      <h6 id="1-2-1">1.2.1</h6>
      <ul>
        <li>
          Hotfixed meter live view not showing for some users (settings issue)
        </li>
      </ul>
      <h6 id="1-2-0">1.2.0</h6>
      <p>
        <strong><strong>New log format</strong></strong>
      </p>
      <ul>
        <li>Binary log format, allow for more data in a smaller space</li>
        <li>No more intermediate format when live parsing</li>
        <li>No more loa-details-log-parser</li>
        <li>
          The log file now contains content similar to raw packets, so it&#39;ll
          allow more data to be extracted from older logs when we add new
          features/fixes
        </li>
      </ul>
      <p><strong>loa-details</strong></p>
      <ul>
        <li>
          Removed option to allow overkill -&gt; now it&#39;ll always ignore
          overkill
        </li>
        <li>
          Improved back/front attack display: now only show for hits that could
          have been back/front attack (unless the target can&#39;t be back/front
          attacked)
        </li>
        <li>Upgraded dependencies (especially electron to 24.1.2 (node 18))</li>
        <li>
          Removed now unused dependencies (loa-details-log-parser, uuid,
          plateform-folders, worker-farm, lodash)
        </li>
        <li>Fixed Artist not being considered as a support</li>
      </ul>
      <p><strong>For devs</strong></p>
      <ul>
        <li>
          You now can&#39;t look into log files by hand directly, you&#39;ll
          have to use meter-core and ReplayLogger class to parse log file into
          objects similar to packet objects. From that you can process it the
          same way it was done in LegacyLogger.
        </li>
        <li>
          But you can review all (known) packets with all their mapped fields
          using the log files, which may contain useful information that you
          lost with the previous format
        </li>
      </ul>
      <p>
        <strong>About old logs</strong> Old logs will just be ignored by loa
        details, you can delete them or save them in a folder if you want. Old
        log format won&#39;t be officially supported anymore, but you still
        could use the old version, if you edit it not to autoupdate.
      </p>
      <p>
        Parsed format hasn&#39;t changed yet, but it is planned to be reworked
        soon. You&#39;ll just have to reparsed you raw logs when it&#39;s
        released and won&#39;t lose your logs again.
      </p>
    </div>
  </q-scroll-area>
</template>

<script setup>
function openLinkInBrowser(link) {
  window.messageApi.send("window-to-main", {
    message: "open-link",
    value: link,
  });
}
</script>

<style>
.changelog-page ul,
.changelog-page p {
  margin-left: 32px;
  margin-bottom: 0;
  margin-top: 16px;
}
.changelog-page li ul,
.changelog-page li p {
  margin-left: 0px;
}
.changelog-page h5,
.changelog-page h6 {
  margin-left: 16px;
  margin-bottom: 0;
  margin-top: 16px;
}
.changelog-page h7 {
  margin-left: 32px;
}

.changelog-page {
  padding: 0 24px;
}

.custom-link {
  text-decoration: underline;
  color: #00bcd4;
  cursor: pointer;
}
</style>
