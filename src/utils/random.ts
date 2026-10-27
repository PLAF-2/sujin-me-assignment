/** Stable pseudo-random number in [0, 1) for an index, so motion varies per letter but not per render. */
export const seededRandom = (i: number, salt = 0) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
