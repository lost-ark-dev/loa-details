export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.ceil(time)));
}
