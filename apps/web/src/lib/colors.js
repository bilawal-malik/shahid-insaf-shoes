export const COLOR_HEX = {
  Black: '#1d1d1d',
  Brown: '#6b4423',
  Tan: '#d2a679',
  White: '#f8f8f8',
  Blue: '#2b4268',
  Navy: '#172744',
  Grey: '#9aa1ac',
  Gray: '#9aa1ac',
  Maroon: '#6d2a2a',
  Green: '#3f6b4f',
};

export function colorHex(name) {
  return COLOR_HEX[name] || '#cbd2dc';
}
