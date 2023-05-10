<template>
  <q-scroll-area style="height: calc(100vh - 4px - 32px - 66px)">
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

.changelog-page {
  padding: 0 24px;
}

.custom-link {
  text-decoration: underline;
  color: #00bcd4;
  cursor: pointer;
}
</style>
