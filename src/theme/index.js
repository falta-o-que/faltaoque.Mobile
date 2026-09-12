import tokens from './tokens.json';

const primitive = tokens['primary/secondary/tertiary/Mode 1'];
const standard = tokens['santard colors/Mode 1'];
const semantic = tokens['semantic colors/Mode 1'];
const pantry = tokens['pantry colors/Mode 1'];
const tags = tokens['tags/Mode 1'];

const readValue = (token) => token?.['$value'];
const readScale = (scale) =>
  Object.fromEntries(Object.entries(scale).map(([key, token]) => [key, readValue(token)]));

const tagColors = Object.fromEntries(
  Object.entries(tags).map(([key, token]) => [
    key,
    readValue(token) === '{Green.Green}'
      ? readValue(primitive.Green.Green)
      : readValue(token),
  ]),
);
tagColors.outros = readValue(standard.White[200]);

export const theme = {
  colors: {
    primary: readScale(primitive.Green),
    secondary: readScale(primitive.RedOrange),
    tertiary: readScale(primitive.Yellow),
    orange: readScale(primitive.Orange),
    mustard: readScale(primitive.MostardYellow),
    white: readScale(standard.White),
    black: readScale(standard.Black),
    informative: readScale(semantic.Informative),
    warning: readScale(semantic.Warning),
    danger: readScale(semantic.Danger),
    success: readScale(semantic.Success),
    pantry: Object.fromEntries(Object.entries(pantry).map(([key, token]) => [key, readValue(token)])),
    tags: tagColors,
  },
  fonts: {
    families: {
      poppins: {
        regular: 'Poppins_400Regular',
        medium: 'Poppins_500Medium',
        bold: 'Poppins_700Bold',
      },
      inter: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        bold: 'Inter_700Bold',
      },
    },
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
    sizes: readScale(primitive.fontSize),
  },
};

export default theme;
