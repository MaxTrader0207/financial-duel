// card-recipes.js — new cards drawn from the parts library (art-parts.js) as 「主體零件＋代表物」 recipes.
// Adding a ★1–★3 card: write one line here instead of hand-drawing a picture, e.g.
//   new_card_id: { subject: { part: 'samurai' }, props: [{ part: 'candles' }], caption: '黃金交叉' },
// subject / props take { part, x, y, s, flip, c (accent colour), t (text on the prop) }; sky: plain | sun | moon | night | rain;
// rays: true for the ★3 sunburst. A card with no hand-made picture and no recipe still gets one: autoRecipe() picks the
// subject from its race / name and the 代表物 from its attribute.
import { compose, autoRecipe } from './art-parts.js';

export const RECIPES = {
};

/* the picture for a card without a hand-made one (card-art.js / ur-art.js) */
export const recipeArt = m => compose(m.cat, RECIPES[m.id] || autoRecipe(m));
