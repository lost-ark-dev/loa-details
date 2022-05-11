<template>
  <br />
  <b>Changelog (for the last 5 versions)</b>
  <br />
  <b>0.1.9</b>
  <ul>
    <li>
      Logs are now saved under "Documents\LOA Details\Logs" and they won't get
      deleted once you update.
    </li>
    <li>
      Support for Korea and Russia clients. (This is based on main branch, I
      haven't tested if they work!)
    </li>
    <li>
      Compact design improvements: Now shows pause button, total damage dealt
      and taken.
    </li>
    <li>
      Fixed a bug where damage overlay got bugged if you manually minimized
      before auto-minimize kicked in.
    </li>
    <li>
      You can now change auto minimize time (default is 60 seconds, min:15s,
      max:180s)
    </li>
    <li>Now you can scroll on damage meter table.</li>
    <li>Added a changelog page on the home page.</li>
  </ul>

  <br />
  <b>0.1.8</b>
  <ul>
    <li>Fixed a bug where it showed an error box when app was closed.</li>
    <li>Added pause/resume for fights.</li>
    <li>
      Fixed skill images with colon not appearing (wardancer skills etc..)
    </li>
    <li>You can right click a skill to go back to damage meter display.</li>
    <li>
      When session is reset, damage meter goes back to default (damage meter,
      display damage mode).
    </li>
    <li>DPS column is now abbreviated (ex: 728,327 > 728k)</li>
  </ul>

  <br />
  <b>0.1.7</b>
  <ul>
    <li>
      Player skill damages are now relative to their max skill damage instead of
      total damage
    </li>
    <li>Skills now have skill images.</li>
    <li>Player bar has an animation now.</li>
    <li>
      New updater, finally you won't have to close the application and re-open
      it etc...
    </li>
  </ul>
</template>
