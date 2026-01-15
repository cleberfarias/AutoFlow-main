import manifest from '../integrations/manifest';

const KEY_RECENTS = 'integrations:recents';
const KEY_FAVS = 'integrations:favorites';

export function getRecentServices() {
  try { return JSON.parse(localStorage.getItem(KEY_RECENTS) || '[]'); } catch (e) { return []; }
}

export function pushRecent(id: string) {
  const list = getRecentServices().filter((x:any)=>x!==id);
  list.unshift(id);
  const trimmed = list.slice(0,5);
  localStorage.setItem(KEY_RECENTS, JSON.stringify(trimmed));
}

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(KEY_FAVS) || '[]'); } catch (e) { return []; }
}

export function toggleFavorite(id: string) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx === -1) favs.unshift(id);
  else favs.splice(idx,1);
  localStorage.setItem(KEY_FAVS, JSON.stringify(favs));
}

export function listCategories() {
  const cats = Array.from(new Set(manifest.services.map(s=>s.category)));
  return cats;
}

export default {
  manifest,
  getRecentServices,
  pushRecent,
  getFavorites,
  toggleFavorite,
  listCategories
};
