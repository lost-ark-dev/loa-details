// turns integer into comma splitted string
// ex: 123456 => 123,456
export function numberFormat(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

// returns an array with 2 values based on its abbreviation
// ex: 123456 => [123, "k"]
export function abbreviateNumber(n) {
  if (n < 1e3) return [n, ""];
  if (n >= 1e3 && n < 1e6) return [+(n / 1e3).toFixed(1), "k"];
  if (n >= 1e6 && n < 1e9) return [+(n / 1e6).toFixed(1), "m"];
  if (n >= 1e9 && n < 1e12) return [+(n / 1e9).toFixed(1), "b"];
  if (n >= 1e12) return [+(n / 1e12).toFixed(1), "t"];
}

// takes milliseconds in numbers and returns string with minutes:seconds
// ex: 60000 => 01:00
export function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
