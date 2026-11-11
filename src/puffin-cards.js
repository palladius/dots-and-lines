/**
 * 🃏 Puffin Cards & Multi-Hall of Fame Family Insights Engine (`src/puffin-cards.js`)
 *
 * Cross-Game MTG-Inspired Collectible Cards (`<game_id>:<slug>`), 4-Tier Rarity Merit Gate
 * (`common` 65%, `uncommon` 25%, `rare` 8.5%, `mythic` 1.5%), Veo 3.1 Animated Puffin Card Back
 * (`assets/cards/card-back.png` + `assets/cards/card-back.mp4`), and Multi-Game Insights Explorer.
 */

export const PUFFIN_CARD_BACK = Object.freeze({
  id: 'v1_carlesso_deckmaster',
  title: 'Puffin Cards — Carlesso Deckmaster (V1)',
  subtitle: 'Triptych of Ale, Seby & Papino Riccardo with Crowned Viking Puffin',
  image_url: 'assets/cards/card-back.png',
  video_url: 'assets/cards/card-back.mp4',
  audio_url: 'assets/cards/card-back-fanfare.mp3',
  variants: Object.freeze([
    {
      id: 'v1',
      label: 'V1 • Carlesso Deckmaster (Mahogany & Sapphire)',
      image_url: 'assets/cards/card-back-v1.png',
    },
    {
      id: 'v2',
      label: 'V2 • Byzantine Gold Mosaic & Gothic Trefoil',
      image_url: 'assets/cards/card-back-v2.png',
    },
    {
      id: 'v3',
      label: 'V3 • Cosmic Ring of Fire Portal',
      image_url: 'assets/cards/card-back-v3.png',
    },
    {
      id: 'v4',
      label: 'V4 • Royal Heraldic Triple-Shield',
      image_url: 'assets/cards/card-back-v4.png',
    },
  ]),
});

export const MTG_RARITY_INFO = Object.freeze({
  common: {
    id: 'common',
    label: 'Common',
    labelIt: 'Comune',
    gem: '⚫',
    borderHex: '#334155',
    accentHex: '#94A3B8',
    probability: 0.65,
    probabilityPct: '65.0%',
    veoMode: 'none',
    veoBadge: null,
    meritRule: 'Qualsiasi partita completata (score > 0)',
  },
  uncommon: {
    id: 'uncommon',
    label: 'Uncommon',
    labelIt: 'Non Comune',
    gem: '⚪',
    borderHex: '#C0C0C0',
    accentHex: '#E2E8F0',
    probability: 0.25,
    probabilityPct: '25.0%',
    veoMode: 'none',
    veoBadge: null,
    meritRule: 'Qualsiasi partita completata (score > 0)',
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    labelIt: 'Rara (Oro • Veo Muta)',
    gem: '🟡',
    borderHex: '#FACC15',
    accentHex: '#FDE047',
    probability: 0.085,
    probabilityPct: '8.5%',
    veoMode: 'silent',
    veoBadge: '🔇✨ Veo 3.1 Muta',
    meritRule: 'Richiede difficoltà Media/Difficile o punteggio >= 1500 (o 98ª Partita)',
  },
  mythic: {
    id: 'mythic',
    label: 'Mythic Rare',
    labelIt: 'Mitica (Arancio Holo • Veo + Musica)',
    gem: '🟠',
    borderHex: '#FF6D00',
    accentHex: '#FB923C',
    probability: 0.015,
    probabilityPct: '1.5%',
    veoMode: 'musical',
    veoBadge: '🎵🔥 Veo 3.1 + Musica',
    meritRule: 'Richiede modalità Difficile/Nightmare, Boss sconfitto, Record >= 3000 o 98ª Partita',
  },
});

export function normalizeCardRarity(raw) {
  const clean = String(raw || '').trim().toLowerCase();
  if (['mythic', 'mythic_rare', 'legendary', 'ur', 'ultra_rare', 'orange'].includes(clean)) {
    return 'mythic';
  }
  if (['rare', 'epic', 'ssr', 'super_super_rare', 'gold'].includes(clean)) {
    return 'rare';
  }
  if (['uncommon', 'sr', 'super_rare', 'silver'].includes(clean)) {
    return 'uncommon';
  }
  return 'common';
}

export function normalizeCardId(rawCardId, fallbackGameId = 'tubature') {
  const str = String(rawCardId || '').trim().toLowerCase();
  if (!str) {
    return `${String(fallbackGameId || 'tubature').trim().toLowerCase()}:unknown`;
  }
  if (str.includes(':')) {
    const [g, ...rest] = str.split(':');
    const cleanG = g.trim() || String(fallbackGameId || 'tubature').trim().toLowerCase();
    const cleanSlug = rest.join(':').trim().replace(/\s+/g, '_');
    return `${cleanG}:${cleanSlug}`;
  }
  if (str.includes('__')) {
    const [g, ...rest] = str.split('__');
    return `${g.trim()}:${rest.join('__').trim()}`;
  }
  const cleanG = String(fallbackGameId || 'tubature').trim().toLowerCase();
  const cleanSlug = str.replace(/\s+/g, '_');
  return `${cleanG}:${cleanSlug}`;
}

export function cardIdToFirestoreDocId(cardId) {
  return normalizeCardId(cardId).replace(/:/g, '__');
}

const TUBATURE_BASE = 'https://palladius.github.io/tubature';

export const PUFFIN_CARDS_CATALOG = Object.freeze([
  // ─── TUBATURE (22 Real Cauldron Goodies from palladius/tubature) ───
  {
    card_id: 'tubature:ruby',
    game_id: 'tubature',
    slug: 'ruby',
    number: 1,
    title: 'Ruby',
    emoji: '💎',
    rarity: 'common',
    category: 'Goodie Creatura — Base',
    description: 'Rubino scintillante forgiato nelle condotte sotterranee del castello.',
    image_url: `${TUBATURE_BASE}/assets/goodies/ruby2.png`,
    audio_url: null,
    stats: { atk: 2, def: 3 },
  },
  {
    card_id: 'tubature:dragon',
    game_id: 'tubature',
    slug: 'dragon',
    number: 2,
    title: 'Dragon',
    emoji: '🐉',
    rarity: 'common',
    category: 'Goodie Creatura — Base',
    description: 'Draghetto guardiano delle caldare a vapore: scalda l’acqua di tutto il dungeon!',
    image_url: `${TUBATURE_BASE}/assets/goodies/dragon.png`,
    audio_url: null,
    stats: { atk: 4, def: 2 },
  },
  {
    card_id: 'tubature:unicorn',
    game_id: 'tubature',
    slug: 'unicorn',
    number: 3,
    title: 'Unicorn',
    emoji: '🦄',
    rarity: 'common',
    category: 'Goodie Creatura — Base',
    description: 'Unicorno arcobaleno che purifica ogni tubo arrugginito con un colpo di corno.',
    image_url: `${TUBATURE_BASE}/assets/goodies/unicorn.png`,
    audio_url: null,
    stats: { atk: 3, def: 3 },
  },
  {
    card_id: 'tubature:hotwheel',
    game_id: 'tubature',
    slug: 'hotwheel',
    number: 4,
    title: 'Hotwheel',
    emoji: '🏎️',
    rarity: 'common',
    category: 'Goodie Artefatto — Base',
    description: 'Macchinina turbo lanciata a tutta velocità lungo i tubi curvi del labirinto!',
    image_url: `${TUBATURE_BASE}/assets/goodies/hotwheel.png`,
    audio_url: null,
    stats: { atk: 4, def: 1 },
  },
  {
    card_id: 'tubature:pizza',
    game_id: 'tubature',
    slug: 'pizza',
    number: 5,
    title: 'Pizza Cotto&Funghi',
    emoji: '🍕',
    rarity: 'common',
    category: 'Goodie Incantesimo — Famiglia',
    description: 'La pizza preferita dopo una lunga sessione di riparazione idraulica in famiglia!',
    image_url: `${TUBATURE_BASE}/assets/goodies/pizza.png`,
    audio_url: null,
    stats: { atk: 2, def: 4 },
  },
  {
    card_id: 'tubature:puffin',
    game_id: 'tubature',
    slug: 'puffin',
    number: 6,
    title: 'Puffin Mosaico',
    emoji: '🐧',
    rarity: 'common',
    category: 'Goodie Creatura — Famiglia',
    description: 'Il mitico Pulcinella di Mare in versione mosaico bizantino, mascotte di casa Carlesso.',
    image_url: `${TUBATURE_BASE}/assets/goodies/puffin.png`,
    audio_url: null,
    stats: { atk: 3, def: 4 },
  },
  {
    card_id: 'tubature:maialino',
    game_id: 'tubature',
    slug: 'maialino',
    number: 7,
    title: 'Majjal!',
    emoji: '🐷',
    rarity: 'common',
    category: 'Goodie Sonoro — Ferrara',
    description: 'Esclamazione tipica ferrarese quando il tubo scoppia all’ultimo secondo: "MAJJAL!"',
    image_url: `${TUBATURE_BASE}/assets/goodies/maialino.png`,
    audio_url: `${TUBATURE_BASE}/assets/sounds/good-quality/majjal.mp3`,
    stats: { atk: 3, def: 3 },
  },
  {
    card_id: 'tubature:e-le-fante',
    game_id: 'tubature',
    slug: 'e-le-fante',
    number: 8,
    title: 'E-Le-Fante',
    emoji: '🐘',
    rarity: 'common',
    category: 'Goodie Creatura — Lucilla',
    description: 'Con la sua proboscide gigante funziona come una pompa idraulica d’emergenza!',
    image_url: `${TUBATURE_BASE}/assets/goodies/e-le-fante.png`,
    audio_url: null,
    stats: { atk: 2, def: 5 },
  },
  {
    card_id: 'tubature:coccodrillo',
    game_id: 'tubature',
    slug: 'coccodrillo',
    number: 9,
    title: 'Coccodrillo Chill',
    emoji: '🐊',
    rarity: 'common',
    category: 'Goodie Creatura — Lucilla',
    description: 'Nuota beato nelle condotte principali aspettando che l’acqua arrivi a destinazione.',
    image_url: `${TUBATURE_BASE}/assets/goodies/coccodrillo.png`,
    audio_url: null,
    stats: { atk: 4, def: 3 },
  },
  {
    card_id: 'tubature:giraffa',
    game_id: 'tubature',
    slug: 'giraffa',
    number: 10,
    title: 'Giraffa Boxer',
    emoji: '🦒',
    rarity: 'common',
    category: 'Goodie Creatura — Lucilla',
    description: 'Collo lungo come un tubo verticale 8x8 e guantoni pronti a sbloccare ogni valvola.',
    image_url: `${TUBATURE_BASE}/assets/goodies/giraffa.png`,
    audio_url: null,
    stats: { atk: 4, def: 2 },
  },
  {
    card_id: 'tubature:rinoceronte',
    game_id: 'tubature',
    slug: 'rinoceronte',
    number: 11,
    title: 'Rinoceronte Cucciolo',
    emoji: '🦏',
    rarity: 'common',
    category: 'Goodie Creatura — Lucilla',
    description: 'Piccolo ma corazzato: nessuna pressione idraulica può scalfire la sua corazza.',
    image_url: `${TUBATURE_BASE}/assets/goodies/rinoceronte.png`,
    audio_url: null,
    stats: { atk: 3, def: 5 },
  },
  {
    card_id: 'tubature:alessandro',
    game_id: 'tubature',
    slug: 'alessandro',
    number: 12,
    title: 'Alessandro',
    emoji: '🧑',
    rarity: 'uncommon',
    category: 'Goodie Eroe — Famiglia',
    description: 'Il Cavaliere dei Draghi Rossi: risolve gli incroci 6x6 con intuizioni fulminee!',
    image_url: `${TUBATURE_BASE}/assets/goodies/alessandro.png`,
    audio_url: null,
    stats: { atk: 6, def: 5 },
  },
  {
    card_id: 'tubature:sebi',
    game_id: 'tubature',
    slug: 'sebi',
    number: 13,
    title: 'Sebi',
    emoji: '👦',
    rarity: 'uncommon',
    category: 'Goodie Eroe — Famiglia',
    description: 'Lo Speedster Blu: gira i tubi alla velocità della luce prima che scada il timer!',
    image_url: `${TUBATURE_BASE}/assets/goodies/sebi.png`,
    audio_url: null,
    stats: { atk: 5, def: 6 },
  },
  {
    card_id: 'tubature:salama',
    game_id: 'tubature',
    slug: 'salama',
    number: 14,
    title: 'Salama da Sugo',
    emoji: '🧆',
    rarity: 'uncommon',
    category: 'Goodie Reliquia — Ferrara',
    description: 'Sacro tesoro gastronomico estense: sprigiona +100 energia in tutto il calderone!',
    image_url: `${TUBATURE_BASE}/assets/goodies/salama.png`,
    audio_url: null,
    stats: { atk: 5, def: 5 },
  },
  {
    card_id: 'tubature:papino',
    game_id: 'tubature',
    slug: 'papino',
    number: 15,
    title: 'Papino',
    emoji: '👨',
    rarity: 'uncommon',
    category: 'Goodie Eroe — Famiglia',
    description: 'Architetto supremo delle Tubature e Paladino d’Oro del Puffin Login Ring.',
    image_url: `${TUBATURE_BASE}/assets/goodies/papino.png`,
    audio_url: null,
    stats: { atk: 6, def: 6 },
  },
  {
    card_id: 'tubature:wizard',
    game_id: 'tubature',
    slug: 'wizard',
    number: 16,
    title: 'Wizard',
    emoji: '🧙',
    rarity: 'uncommon',
    category: 'Goodie Creatura — Nerd',
    description: 'Mago arcano delle condotte: trasmuta l’acqua stagnante in puro elisir dorato.',
    image_url: `${TUBATURE_BASE}/assets/goodies/wizard.png`,
    audio_url: null,
    stats: { atk: 6, def: 4 },
  },
  {
    card_id: 'tubature:acquario',
    game_id: 'tubature',
    slug: 'acquario',
    number: 17,
    title: "Acquario d'Oro",
    emoji: '♒',
    rarity: 'rare',
    category: 'Goodie Costellazione — Nerd',
    description: 'Camus dell’Acquario benedice il flusso glaciale delle tubature a zero perdite!',
    image_url: `${TUBATURE_BASE}/assets/goodies/acquario.png`,
    audio_url: null,
    stats: { atk: 8, def: 7 },
  },
  {
    card_id: 'tubature:fratelli',
    game_id: 'tubature',
    slug: 'fratelli',
    number: 18,
    title: 'Ale & Sebi',
    emoji: '🫂',
    rarity: 'rare',
    category: 'Goodie Leggenda — Famiglia',
    description: 'Quando Ale e Seby uniscono le forze, nessun livello 8x8 può resistere!',
    image_url: `${TUBATURE_BASE}/assets/goodies/fratelli.png`,
    audio_url: null,
    stats: { atk: 8, def: 8 },
  },
  {
    card_id: 'tubature:tram',
    game_id: 'tubature',
    slug: 'tram',
    number: 19,
    title: 'Züri-Tram',
    emoji: '🚊',
    rarity: 'rare',
    category: 'Goodie Artefatto — Zürich',
    description: 'Il mitico tram bianco-blu VBZ di Zurigo: puntuale al millisecondo anche sott’acqua!',
    image_url: `${TUBATURE_BASE}/assets/goodies/tram.png`,
    audio_url: null,
    stats: { atk: 7, def: 8 },
  },
  {
    card_id: 'tubature:antigravity',
    game_id: 'tubature',
    slug: 'antigravity',
    number: 20,
    title: 'Antigravity',
    emoji: '🅰️',
    rarity: 'rare',
    category: 'Goodie Artefatto — Nerd',
    description: 'L’acqua scorre perfino in salita sfidando la fisica grazie al motore Antigravity!',
    image_url: `${TUBATURE_BASE}/assets/goodies/antigravity.png`,
    audio_url: null,
    stats: { atk: 8, def: 7 },
  },
  {
    card_id: 'tubature:motorino',
    game_id: 'tubature',
    slug: 'motorino',
    number: 21,
    title: 'Motorino nel Canale',
    emoji: '🛵',
    rarity: 'rare',
    category: 'Goodie Sonoro — Ferrara',
    description: 'Leggenda metropolitana ferrarese con audio originale: "Magnat al canal!"',
    image_url: `${TUBATURE_BASE}/assets/goodies/motorino.png`,
    video_url: 'assets/cards/front/tubature_motorino.mp4',
    video_muted: true,
    audio_url: `${TUBATURE_BASE}/assets/sounds/good-quality/magnat_al_canal.mp3`,
    stats: { atk: 8, def: 6 },
  },
  {
    card_id: 'tubature:schmoogle',
    game_id: 'tubature',
    slug: 'schmoogle',
    number: 22,
    title: 'Schmoogle',
    emoji: '👻',
    rarity: 'mythic',
    category: 'Goodie Mitico — Nerd',
    description:
      'Il leggendario spirito arcobaleno delle Tubature! Appare solo ai veri maestri idraulici in modalità Difficile.',
    image_url: `${TUBATURE_BASE}/assets/goodies/schmoogle.png`,
    video_url: 'assets/cards/front/tubature_schmoogle.mp4',
    video_muted: false,
    music_url: 'assets/cards/mythic-theme.mp3',
    audio_url: null,
    stats: { atk: 10, def: 10 },
  },

  // ─── PUPURABBU 3D (Saint Seiya & Labyrinth Collectibles) ───
  {
    card_id: 'pupurabbu-3d:gold_gemini_saga',
    game_id: 'pupurabbu-3d',
    slug: 'gold_gemini_saga',
    number: 1,
    title: 'Gemini Saga Gold Armor',
    emoji: '♊',
    rarity: 'mythic',
    category: 'Gold Saint — Pupurabbu 3D',
    description: 'Esplosione Galattica nel labirinto 3D! La carta più ambita del Santuario.',
    image_url: 'assets/avatars/saga.png',
    audio_url: null,
    stats: { atk: 10, def: 9 },
  },
  {
    card_id: 'pupurabbu-3d:gold_phoenix',
    game_id: 'pupurabbu-3d',
    slug: 'gold_phoenix',
    number: 2,
    title: 'Phoenix Ikki Reborn',
    emoji: '🦅',
    rarity: 'rare',
    category: 'Cosmos Knight — Pupurabbu 3D',
    description: 'Rinasce dalle ceneri del labirinto con ali di fuoco dorato.',
    image_url: 'assets/avatars/ale.png',
    audio_url: null,
    stats: { atk: 8, def: 7 },
  },
  {
    card_id: 'pupurabbu-3d:gold_pegasus',
    game_id: 'pupurabbu-3d',
    slug: 'gold_pegasus',
    number: 3,
    title: 'Pegasus Ryu Sei Ken',
    emoji: '🪽',
    rarity: 'uncommon',
    category: 'Cosmos Knight — Pupurabbu 3D',
    description: 'Fulmine di Pegasus che illumina i corridoi segreti del labirinto.',
    image_url: 'assets/avatars/seby.png',
    audio_url: null,
    stats: { atk: 6, def: 5 },
  },
  {
    card_id: 'pupurabbu-3d:common_ghigna',
    game_id: 'pupurabbu-3d',
    slug: 'common_ghigna',
    number: 4,
    title: 'Ghigna Furbetta',
    emoji: '😼',
    rarity: 'common',
    category: 'Creatura — Pupurabbu 3D',
    description: 'Sorriso sornione di chi ha appena trovato la scorciatoia verso le carote.',
    image_url: 'assets/avatars/guest.png',
    audio_url: null,
    stats: { atk: 3, def: 3 },
  },
  {
    card_id: 'pupurabbu-3d:common_pupurabbu_purple',
    game_id: 'pupurabbu-3d',
    slug: 'common_pupurabbu_purple',
    number: 5,
    title: 'Pupurabbu Viola Turbo',
    emoji: '🐰',
    rarity: 'common',
    category: 'Creatura — Pupurabbu 3D',
    description: 'Il coniglietto viola originale lanciato a 180 km/h tra i muri 3D!',
    image_url: 'assets/avatars/kate.png',
    audio_url: null,
    stats: { atk: 4, def: 3 },
  },
  {
    card_id: 'pupurabbu-3d:common_capybara',
    game_id: 'pupurabbu-3d',
    slug: 'common_capybara',
    number: 6,
    title: 'Capybara Zen Guard',
    emoji: '🦫',
    rarity: 'common',
    category: 'Creatura — Pupurabbu 3D',
    description: 'Imperturbabile guardiano del labirinto con un mandarino sulla testa.',
    image_url: 'assets/avatars/lucilla.png',
    audio_url: null,
    stats: { atk: 2, def: 5 },
  },

  // ─── PUFFIN SNAKE ───
  {
    card_id: 'puffin-snake:golden_apple_wyrm',
    game_id: 'puffin-snake',
    slug: 'golden_apple_wyrm',
    number: 1,
    title: 'Drago-Serpente della Mela d’Oro',
    emoji: '🐍',
    rarity: 'mythic',
    category: 'Serpente Mitico — Puffin Snake',
    description: 'Serpente leggendario lungo 25+ segmenti forgiato in modalità Hard.',
    image_url: 'assets/cards/front/puffin_snake_golden_apple_wyrm.png',
    video_url: 'assets/cards/front/puffin_snake_golden_apple_wyrm.mp4',
    video_muted: false,
    music_url: 'assets/cards/mythic-theme.mp3',
    audio_url: null,
    stats: { atk: 9, def: 9 },
  },
  {
    card_id: 'puffin-snake:turbo_emerald_viper',
    game_id: 'puffin-snake',
    slug: 'turbo_emerald_viper',
    number: 2,
    title: 'Vipera Smeraldo Turbo',
    emoji: '⚡',
    rarity: 'rare',
    category: 'Serpente Raro — Puffin Snake',
    description: 'Scatta sulla griglia 20x13 senza mai sfiorare i bordi incandescenti.',
    image_url: 'assets/cards/front/puffin_snake_turbo_emerald_viper.png',
    audio_url: null,
    stats: { atk: 7, def: 6 },
  },
  {
    card_id: 'puffin-snake:twin_dragon_coil',
    game_id: 'puffin-snake',
    slug: 'twin_dragon_coil',
    number: 3,
    title: 'Spira del Drago Rosso',
    emoji: '🍎',
    rarity: 'uncommon',
    category: 'Abilità — Puffin Snake',
    description: 'Doppia mela divorata in curva stretta a filo della propria coda!',
    image_url: 'assets/cards/front/puffin_snake_twin_dragon_coil.png',
    audio_url: null,
    stats: { atk: 5, def: 5 },
  },
  {
    card_id: 'puffin-snake:pixel_apple_sprout',
    game_id: 'puffin-snake',
    slug: 'pixel_apple_sprout',
    number: 4,
    title: 'Mela Pixel Croccante',
    emoji: '🍏',
    rarity: 'common',
    category: 'Tesoro — Puffin Snake',
    description: '+100 punti istantanei e un anello in più per il serpente di famiglia.',
    image_url: 'assets/cards/front/puffin_snake_pixel_apple_sprout.png',
    audio_url: null,
    stats: { atk: 3, def: 2 },
  },

  // ─── CARCHESS 3D ───
  {
    card_id: 'carchess3d:queen_h7_checkmate',
    game_id: 'carchess3d',
    slug: 'queen_h7_checkmate',
    number: 1,
    title: 'Scacco Matto di Regina in H7',
    emoji: '👑',
    rarity: 'mythic',
    category: 'Mossa Magistrale — CarChess 3D',
    description: 'Il bacio letale della Regina sulla casa h7: vittoria senza appello!',
    image_url: 'assets/cards/front/carchess3d_queen_h7_checkmate.png',
    video_url: 'assets/cards/front/carchess3d_queen_h7_checkmate.mp4',
    video_muted: false,
    music_url: 'assets/cards/mythic-theme.mp3',
    audio_url: null,
    stats: { atk: 10, def: 8 },
  },
  {
    card_id: 'carchess3d:grandmaster_knight_fork',
    game_id: 'carchess3d',
    slug: 'grandmaster_knight_fork',
    number: 2,
    title: 'Doppio di Cavallo Reale',
    emoji: '♞',
    rarity: 'rare',
    category: 'Tattica — CarChess 3D',
    description: 'Salto a L che minaccia contemporaneamente Re e Torre avversaria.',
    image_url: 'assets/cards/front/carchess3d_grandmaster_knight_fork.png',
    video_url: 'assets/cards/front/carchess3d_grandmaster_knight_fork.mp4',
    video_muted: true,
    audio_url: null,
    stats: { atk: 8, def: 6 },
  },
  {
    card_id: 'carchess3d:obsidian_rook_castle',
    game_id: 'carchess3d',
    slug: 'obsidian_rook_castle',
    number: 3,
    title: 'Arrocco della Torre d’Ossidiana',
    emoji: '🏰',
    rarity: 'uncommon',
    category: 'Difesa — CarChess 3D',
    description: 'Mette al sicuro il Re dietro una muraglia impenetrabile di pedoni.',
    image_url: 'assets/cards/front/carchess3d_obsidian_rook_castle.png',
    audio_url: null,
    stats: { atk: 4, def: 7 },
  },
  {
    card_id: 'carchess3d:wooden_pawn_vanguard',
    game_id: 'carchess3d',
    slug: 'wooden_pawn_vanguard',
    number: 4,
    title: 'Pedone Coraggioso in E4',
    emoji: '♟️',
    rarity: 'common',
    category: 'Apertura — CarChess 3D',
    description: 'Ogni grande partita di scacchi in famiglia inizia con un passo in e4.',
    image_url: 'assets/cards/front/carchess3d_wooden_pawn_vanguard.png',
    audio_url: null,
    stats: { atk: 2, def: 3 },
  },

  // ─── SMURFS & DRAGONS ───
  {
    card_id: 'smurfs-and-dragons:emerald_dragon_lord',
    game_id: 'smurfs-and-dragons',
    slug: 'emerald_dragon_lord',
    number: 1,
    title: 'Signore del Drago Smeraldo (Lv.42)',
    emoji: '🐉',
    rarity: 'mythic',
    category: 'Boss Mitico — Smurfs & Dragons',
    description: 'Sconfitto da Ale in modalità Nightmare senza perdere nemmeno una torre!',
    image_url: 'assets/cards/front/smurfs_emerald_dragon_lord.png',
    video_url: 'assets/cards/front/smurfs_emerald_dragon_lord.mp4',
    video_muted: false,
    music_url: 'assets/cards/mythic-theme.mp3',
    audio_url: null,
    stats: { atk: 10, def: 10 },
  },
  {
    card_id: 'smurfs-and-dragons:puffin_archer_battalion',
    game_id: 'smurfs-and-dragons',
    slug: 'puffin_archer_battalion',
    number: 2,
    title: 'Battaglione di 62 Puffin Archers',
    emoji: '🏹',
    rarity: 'rare',
    category: 'Armata — Smurfs & Dragons',
    description: 'Pioggia di frecce infuocate che oscura il cielo sopra il villaggio.',
    image_url: 'assets/ring/smurfs-and-dragons.png',
    audio_url: null,
    stats: { atk: 8, def: 7 },
  },
  {
    card_id: 'smurfs-and-dragons:arcane_sentinel_tower',
    game_id: 'smurfs-and-dragons',
    slug: 'arcane_sentinel_tower',
    number: 3,
    title: 'Torre Sentinella Arcana',
    emoji: '🗼',
    rarity: 'uncommon',
    category: 'Bastione — Smurfs & Dragons',
    description: 'Rallenta le orde di draghi con raggi di gelo incantato.',
    image_url: 'assets/ring/smurfs-and-dragons.png',
    audio_url: null,
    stats: { atk: 5, def: 6 },
  },
  {
    card_id: 'smurfs-and-dragons:forest_smurf_scout',
    game_id: 'smurfs-and-dragons',
    slug: 'forest_smurf_scout',
    number: 4,
    title: 'Esploratore della Foresta Blu',
    emoji: '🍄',
    rarity: 'common',
    category: 'Unità — Smurfs & Dragons',
    description: 'Raccoglie bacche magiche per potenziare le difese del castello.',
    image_url: 'assets/ring/smurfs-and-dragons.png',
    audio_url: null,
    stats: { atk: 3, def: 3 },
  },

  // ─── FAMILY MAHJONG 3D ───
  {
    card_id: 'family-mahjong-3d:imperial_jade_dragon',
    game_id: 'family-mahjong-3d',
    slug: 'imperial_jade_dragon',
    number: 1,
    title: 'Drago Imperiale di Giada',
    emoji: '🀄',
    rarity: 'mythic',
    category: 'Reliquia Mitica — Family Mahjong 3D',
    description: 'Sbloccato completando il layout Imperiale in modalità Hard senza indizi!',
    image_url: 'assets/avatars/kate.png',
    audio_url: null,
    stats: { atk: 9, def: 10 },
  },
  {
    card_id: 'family-mahjong-3d:combo_x9_phoenix_tile',
    game_id: 'family-mahjong-3d',
    slug: 'combo_x9_phoenix_tile',
    number: 2,
    title: 'Tessera della Fenice Combo x9',
    emoji: '🔥',
    rarity: 'rare',
    category: 'Combo Rara — Family Mahjong 3D',
    description: 'Nove coppie abbinate in meno di 20 secondi con precisione chirurgica.',
    image_url: 'assets/avatars/kate.png',
    audio_url: null,
    stats: { atk: 8, def: 7 },
  },
  {
    card_id: 'family-mahjong-3d:bamboo_wind_harmony',
    game_id: 'family-mahjong-3d',
    slug: 'bamboo_wind_harmony',
    number: 3,
    title: 'Armonia dei Quattro Venti',
    emoji: '🎋',
    rarity: 'uncommon',
    category: 'Spirito — Family Mahjong 3D',
    description: 'Est, Sud, Ovest e Nord si allineano sulla plancia 3D.',
    image_url: 'assets/avatars/kate.png',
    audio_url: null,
    stats: { atk: 5, def: 6 },
  },
  {
    card_id: 'family-mahjong-3d:ivory_lotus_tile',
    game_id: 'family-mahjong-3d',
    slug: 'ivory_lotus_tile',
    number: 4,
    title: 'Fiore di Loto d’Avorio',
    emoji: '🪷',
    rarity: 'common',
    category: 'Tessera — Family Mahjong 3D',
    description: 'Prima coppia libera in cima alla piramide di Mahjong.',
    image_url: 'assets/avatars/kate.png',
    audio_url: null,
    stats: { atk: 3, def: 4 },
  },

  // ─── KIDS JIGSAW PUZZLE ───
  {
    card_id: 'kids-jigsaw-puzzle:master_mosaic_dragon_64',
    game_id: 'kids-jigsaw-puzzle',
    slug: 'master_mosaic_dragon_64',
    number: 1,
    title: 'Mosaico Reale dei Draghi (64 Pezzi)',
    emoji: '🧩',
    rarity: 'mythic',
    category: 'Capolavoro Mitico — Kids Jigsaw',
    description: 'Completato a tempo di record senza mai usare l’anteprima guida!',
    image_url: 'assets/ring/kids-jigsaw-puzzle.png',
    audio_url: null,
    stats: { atk: 9, def: 9 },
  },
  {
    card_id: 'kids-jigsaw-puzzle:golden_corner_keystone',
    game_id: 'kids-jigsaw-puzzle',
    slug: 'golden_corner_keystone',
    number: 2,
    title: 'Quattro Angoli d’Oro',
    emoji: '✨',
    rarity: 'rare',
    category: 'Tattica — Kids Jigsaw',
    description: 'I quattro angoli incastrati nei primi 10 secondi di partita.',
    image_url: 'assets/ring/kids-jigsaw-puzzle.png',
    audio_url: null,
    stats: { atk: 7, def: 7 },
  },
  {
    card_id: 'kids-jigsaw-puzzle:magnetic_snap_trio',
    game_id: 'kids-jigsaw-puzzle',
    slug: 'magnetic_snap_trio',
    number: 3,
    title: 'Incastro Magnetico Triplo',
    emoji: '🧲',
    rarity: 'uncommon',
    category: 'Combo — Kids Jigsaw',
    description: 'Tre tessere consecutive che fanno CLACK con soddisfazione estrema.',
    image_url: 'assets/ring/kids-jigsaw-puzzle.png',
    audio_url: null,
    stats: { atk: 5, def: 5 },
  },
  {
    card_id: 'kids-jigsaw-puzzle:starter_wooden_piece',
    game_id: 'kids-jigsaw-puzzle',
    slug: 'starter_wooden_piece',
    number: 4,
    title: 'Primo Tassello del Castello',
    emoji: '🪵',
    rarity: 'common',
    category: 'Base — Kids Jigsaw',
    description: 'Il primo pezzo posizionato al centro del tavolo da gioco.',
    image_url: 'assets/ring/kids-jigsaw-puzzle.png',
    audio_url: null,
    stats: { atk: 3, def: 3 },
  },

  // ─── ALE FRENCH ───
  {
    card_id: 'ale-french:hibou_d_or_b1_laureate',
    game_id: 'ale-french',
    slug: 'hibou_d_or_b1_laureate',
    number: 1,
    title: "Hibou d'Or — Maestro di Francese",
    emoji: '🦉',
    rarity: 'mythic',
    category: 'Corona Bilingue — Ale French',
    description: '31 vocaboli francesi indovinati di fila con Nonna Lucilla e il Gufo Verde!',
    image_url: 'assets/avatars/lucilla.png',
    audio_url: null,
    stats: { atk: 9, def: 10 },
  },
  {
    card_id: 'ale-french:croissant_parisien_streak',
    game_id: 'ale-french',
    slug: 'croissant_parisien_streak',
    number: 2,
    title: 'Croissant Doré di Parigi',
    emoji: '🥐',
    rarity: 'rare',
    category: 'Premio — Ale French',
    description: 'Pronuncia perfetta e zero errori nei verbi irregolari.',
    image_url: 'assets/avatars/lucilla.png',
    audio_url: null,
    stats: { atk: 7, def: 8 },
  },
  {
    card_id: 'ale-french:accent_aigu_paladin',
    game_id: 'ale-french',
    slug: 'accent_aigu_paladin',
    number: 3,
    title: 'Paladino degli Accenti Acuti (é/è/ê)',
    emoji: '⚜️',
    rarity: 'uncommon',
    category: 'Grammatica — Ale French',
    description: 'Nessun accento circonflesso sfugge al suo occhio vigile.',
    image_url: 'assets/avatars/lucilla.png',
    audio_url: null,
    stats: { atk: 5, def: 6 },
  },
  {
    card_id: 'ale-french:bonjour_baguette',
    game_id: 'ale-french',
    slug: 'bonjour_baguette',
    number: 4,
    title: 'Bonjour Baguette!',
    emoji: '🥖',
    rarity: 'common',
    category: 'Base — Ale French',
    description: 'Il saluto mattutino che apre ogni avventura francofona.',
    image_url: 'assets/avatars/lucilla.png',
    audio_url: null,
    stats: { atk: 3, def: 4 },
  },

  // ─── CARLESSO FOTOQUAD & TRIBECCA ───
  {
    card_id: 'carlesso-fotoquad:quattro_ricordi_d_oro',
    game_id: 'carlesso-fotoquad',
    slug: 'quattro_ricordi_d_oro',
    number: 1,
    title: "Quattro Ricordi d'Oro (FotoQuad)",
    emoji: '📸',
    rarity: 'mythic',
    category: 'Album Mitico — FotoQuad',
    description: '4 foto di famiglia ricomposte in modalità Difficile con zero indizi!',
    image_url: 'assets/ring/carlesso-fotoquad.png',
    audio_url: null,
    stats: { atk: 10, def: 9 },
  },
  {
    card_id: 'carlesso-fotoquad:scatto_perfetto',
    game_id: 'carlesso-fotoquad',
    slug: 'scatto_perfetto',
    number: 2,
    title: 'Scatto Perfetto in 22 Mosse',
    emoji: '🖼️',
    rarity: 'rare',
    category: 'Ricordo Raro — FotoQuad',
    description: 'Occhio fotografico infallibile tra i quadranti mescolati.',
    image_url: 'assets/ring/carlesso-fotoquad.png',
    audio_url: null,
    stats: { atk: 7, def: 8 },
  },
  {
    card_id: 'tribecca:tribecca_crown_trio',
    game_id: 'tribecca',
    slug: 'tribecca_crown_trio',
    number: 1,
    title: 'Corona della Triade di TriBecca',
    emoji: '🔺',
    rarity: 'mythic',
    category: 'Triade Mitica — TriBecca',
    description: 'Connessione perfetta tra i tre vertici del rompicapo di famiglia.',
    image_url: 'assets/ring/tribecca.png',
    audio_url: null,
    stats: { atk: 9, def: 9 },
  },
  {
    card_id: 'tribecca:triangolo_brillante',
    game_id: 'tribecca',
    slug: 'triangolo_brillante',
    number: 2,
    title: 'Triangolo Brillante',
    emoji: '📐',
    rarity: 'common',
    category: 'Geometria — TriBecca',
    description: 'Prima combinazione triangolare risolta con eleganza.',
    image_url: 'assets/ring/tribecca.png',
    audio_url: null,
    stats: { atk: 4, def: 4 },
  },
]);

export const DEFAULT_DUMMY_USER_CARDS = Object.freeze([
  {
    id: 'riccardo__tubature__schmoogle',
    player_id: 'riccardo',
    card_id: 'tubature:schmoogle',
    game_id: 'tubature',
    rarity: 'mythic',
    count: 1,
    first_unlocked_at: '2026-11-07T15:12:30.000Z',
    last_unlocked_at: '2026-11-07T15:12:30.000Z',
    best_score_context: 4450,
  },
  {
    id: 'riccardo__tubature__motorino',
    player_id: 'riccardo',
    card_id: 'tubature:motorino',
    game_id: 'tubature',
    rarity: 'rare',
    count: 2,
    first_unlocked_at: '2026-11-06T19:00:00.000Z',
    last_unlocked_at: '2026-11-07T15:12:30.000Z',
    best_score_context: 4450,
  },
  {
    id: 'riccardo__tubature__papino',
    player_id: 'riccardo',
    card_id: 'tubature:papino',
    game_id: 'tubature',
    rarity: 'uncommon',
    count: 3,
    first_unlocked_at: '2026-11-05T18:00:00.000Z',
    last_unlocked_at: '2026-11-07T15:12:30.000Z',
    best_score_context: 4450,
  },
  {
    id: 'ale__tubature__fratelli',
    player_id: 'ale',
    card_id: 'tubature:fratelli',
    game_id: 'tubature',
    rarity: 'rare',
    count: 1,
    first_unlocked_at: '2026-11-07T15:20:10.000Z',
    last_unlocked_at: '2026-11-07T15:20:10.000Z',
    best_score_context: 3650,
  },
  {
    id: 'ale__tubature__maialino',
    player_id: 'ale',
    card_id: 'tubature:maialino',
    game_id: 'tubature',
    rarity: 'common',
    count: 3,
    first_unlocked_at: '2026-11-05T17:18:44.000Z',
    last_unlocked_at: '2026-11-07T15:20:10.000Z',
    best_score_context: 3650,
  },
  {
    id: 'ale__smurfs-and-dragons__emerald_dragon_lord',
    player_id: 'ale',
    card_id: 'smurfs-and-dragons:emerald_dragon_lord',
    game_id: 'smurfs-and-dragons',
    rarity: 'mythic',
    count: 1,
    first_unlocked_at: '2026-11-02T17:18:44.000Z',
    last_unlocked_at: '2026-11-02T17:18:44.000Z',
    best_score_context: 4850,
  },
  {
    id: 'seby__tubature__hotwheel',
    player_id: 'seby',
    card_id: 'tubature:hotwheel',
    game_id: 'tubature',
    rarity: 'common',
    count: 2,
    first_unlocked_at: '2026-11-06T16:10:00.000Z',
    last_unlocked_at: '2026-11-07T15:23:45.000Z',
    best_score_context: 2950,
  },
  {
    id: 'seby__tubature__sebi',
    player_id: 'seby',
    card_id: 'tubature:sebi',
    game_id: 'tubature',
    rarity: 'uncommon',
    count: 1,
    first_unlocked_at: '2026-11-07T15:23:45.000Z',
    last_unlocked_at: '2026-11-07T15:23:45.000Z',
    best_score_context: 2950,
  },
  {
    id: 'seby__pupurabbu-3d__gold_pegasus',
    player_id: 'seby',
    card_id: 'pupurabbu-3d:gold_pegasus',
    game_id: 'pupurabbu-3d',
    rarity: 'uncommon',
    count: 2,
    first_unlocked_at: '2026-11-02T18:06:35.000Z',
    last_unlocked_at: '2026-11-02T18:06:35.000Z',
    best_score_context: 2640,
  },
  {
    id: 'kate__family-mahjong-3d__imperial_jade_dragon',
    player_id: 'kate',
    card_id: 'family-mahjong-3d:imperial_jade_dragon',
    game_id: 'family-mahjong-3d',
    rarity: 'mythic',
    count: 1,
    first_unlocked_at: '2026-11-02T20:11:15.000Z',
    last_unlocked_at: '2026-11-02T20:11:15.000Z',
    best_score_context: 3920,
  },
  {
    id: 'lucilla__ale-french__hibou_d_or_b1_laureate',
    player_id: 'lucilla',
    card_id: 'ale-french:hibou_d_or_b1_laureate',
    game_id: 'ale-french',
    rarity: 'mythic',
    count: 1,
    first_unlocked_at: '2026-11-02T16:39:50.000Z',
    last_unlocked_at: '2026-11-02T16:39:50.000Z',
    best_score_context: 3100,
  },
  // ─── REAL UNLOCKED CARDS FROM FIRESTORE MATCHES (Riccardo, Ale, Seby) ───
  {
    id: 'riccardo__puffin-snake__golden_apple_wyrm',
    player_id: 'riccardo',
    card_id: 'puffin-snake:golden_apple_wyrm',
    game_id: 'puffin-snake',
    rarity: 'mythic',
    count: 1,
    first_unlocked_at: '2026-11-07T10:57:39.516Z',
    last_unlocked_at: '2026-11-07T10:57:39.516Z',
    best_score_context: 9800,
  },
  {
    id: 'riccardo__puffin-snake__turbo_emerald_viper',
    player_id: 'riccardo',
    card_id: 'puffin-snake:turbo_emerald_viper',
    game_id: 'puffin-snake',
    rarity: 'rare',
    count: 2,
    first_unlocked_at: '2026-11-07T10:48:26.697Z',
    last_unlocked_at: '2026-11-08T14:12:39.815Z',
    best_score_context: 4200,
  },
  {
    id: 'riccardo__puffin-snake__twin_dragon_coil',
    player_id: 'riccardo',
    card_id: 'puffin-snake:twin_dragon_coil',
    game_id: 'puffin-snake',
    rarity: 'uncommon',
    count: 1,
    first_unlocked_at: '2026-11-09T07:30:40.600Z',
    last_unlocked_at: '2026-11-09T07:30:40.600Z',
    best_score_context: 900,
  },
  {
    id: 'riccardo__kids-jigsaw-puzzle__golden_corner_keystone',
    player_id: 'riccardo',
    card_id: 'kids-jigsaw-puzzle:golden_corner_keystone',
    game_id: 'kids-jigsaw-puzzle',
    rarity: 'rare',
    count: 2,
    first_unlocked_at: '2026-11-07T17:19:10.655Z',
    last_unlocked_at: '2026-11-09T07:32:28.815Z',
    best_score_context: 137872,
  },
  {
    id: 'riccardo__kids-jigsaw-puzzle__magnetic_snap_trio',
    player_id: 'riccardo',
    card_id: 'kids-jigsaw-puzzle:magnetic_snap_trio',
    game_id: 'kids-jigsaw-puzzle',
    rarity: 'uncommon',
    count: 3,
    first_unlocked_at: '2026-11-07T17:17:40.335Z',
    last_unlocked_at: '2026-11-08T13:03:41.152Z',
    best_score_context: 137872,
  },
  {
    id: 'ale__puffin-snake__twin_dragon_coil',
    player_id: 'ale',
    card_id: 'puffin-snake:twin_dragon_coil',
    game_id: 'puffin-snake',
    rarity: 'uncommon',
    count: 2,
    first_unlocked_at: '2026-11-07T10:51:12.343Z',
    last_unlocked_at: '2026-11-08T16:24:20.786Z',
    best_score_context: 1100,
  },
  {
    id: 'ale__puffin-snake__pixel_apple_sprout',
    player_id: 'ale',
    card_id: 'puffin-snake:pixel_apple_sprout',
    game_id: 'puffin-snake',
    rarity: 'common',
    count: 4,
    first_unlocked_at: '2026-11-07T10:46:55.455Z',
    last_unlocked_at: '2026-11-07T14:48:58.893Z',
    best_score_context: 1000,
  },
  {
    id: 'ale__kids-jigsaw-puzzle__golden_corner_keystone',
    player_id: 'ale',
    card_id: 'kids-jigsaw-puzzle:golden_corner_keystone',
    game_id: 'kids-jigsaw-puzzle',
    rarity: 'rare',
    count: 1,
    first_unlocked_at: '2026-11-08T11:06:38.443Z',
    last_unlocked_at: '2026-11-08T11:06:38.443Z',
    best_score_context: 94814,
  },
  {
    id: 'ale__kids-jigsaw-puzzle__magnetic_snap_trio',
    player_id: 'ale',
    card_id: 'kids-jigsaw-puzzle:magnetic_snap_trio',
    game_id: 'kids-jigsaw-puzzle',
    rarity: 'uncommon',
    count: 2,
    first_unlocked_at: '2026-11-07T17:15:53.743Z',
    last_unlocked_at: '2026-11-08T16:56:50.300Z',
    best_score_context: 88275,
  },
  {
    id: 'ale__ale-french__accent_aigu_paladin',
    player_id: 'ale',
    card_id: 'ale-french:accent_aigu_paladin',
    game_id: 'ale-french',
    rarity: 'uncommon',
    count: 1,
    first_unlocked_at: '2026-11-08T08:54:33.722Z',
    last_unlocked_at: '2026-11-08T08:54:33.722Z',
    best_score_context: 12,
  },
  {
    id: 'seby__tubature__drago',
    player_id: 'seby',
    card_id: 'tubature:drago',
    game_id: 'tubature',
    rarity: 'rare',
    count: 1,
    first_unlocked_at: '2026-11-08T10:37:17.763Z',
    last_unlocked_at: '2026-11-08T10:37:17.763Z',
    best_score_context: 5475,
  },
  {
    id: 'seby__puffin-snake__pixel_apple_sprout',
    player_id: 'seby',
    card_id: 'puffin-snake:pixel_apple_sprout',
    game_id: 'puffin-snake',
    rarity: 'common',
    count: 2,
    first_unlocked_at: '2026-11-07T11:05:49.437Z',
    last_unlocked_at: '2026-11-07T14:43:50.961Z',
    best_score_context: 900,
  },
  {
    id: 'seby__kids-jigsaw-puzzle__magnetic_snap_trio',
    player_id: 'seby',
    card_id: 'kids-jigsaw-puzzle:magnetic_snap_trio',
    game_id: 'kids-jigsaw-puzzle',
    rarity: 'uncommon',
    count: 1,
    first_unlocked_at: '2026-11-08T17:46:25.601Z',
    last_unlocked_at: '2026-11-08T17:46:25.601Z',
    best_score_context: 51200,
  },
  {
    id: 'seby__kids-jigsaw-puzzle__starter_wooden_piece',
    player_id: 'seby',
    card_id: 'kids-jigsaw-puzzle:starter_wooden_piece',
    game_id: 'kids-jigsaw-puzzle',
    rarity: 'common',
    count: 1,
    first_unlocked_at: '2026-11-08T17:44:33.798Z',
    last_unlocked_at: '2026-11-08T17:44:33.798Z',
    best_score_context: 15058,
  },
]);

export function getPuffinCardsCatalog({ game_id, gameId, rarity } = {}) {
  const targetGame = String(game_id || gameId || '').trim().toLowerCase();
  const targetRarity = rarity ? normalizeCardRarity(rarity) : '';
  return PUFFIN_CARDS_CATALOG.filter((card) => {
    if (targetGame && targetGame !== 'all' && card.game_id.toLowerCase() !== targetGame) {
      return false;
    }
    if (targetRarity && card.rarity !== targetRarity) {
      return false;
    }
    return true;
  });
}

export function getCardById(rawCardId, fallbackGameId = 'tubature') {
  const cleanId = normalizeCardId(rawCardId, fallbackGameId);
  return (
    PUFFIN_CARDS_CATALOG.find((c) => c.card_id === cleanId) || {
      card_id: cleanId,
      game_id: cleanId.split(':')[0] || fallbackGameId,
      slug: cleanId.split(':')[1] || 'mystery',
      number: 99,
      title: cleanId.split(':')[1] || 'Carta Misteriosa',
      emoji: '🃏',
      rarity: 'common',
      category: 'Collezionabile',
      description: 'Carta speciale scoperta nel Puffin Login Ring.',
      image_url: PUFFIN_CARD_BACK.image_url,
      audio_url: null,
      stats: null,
    }
  );
}

/**
 * Resolves the Front Veo 3.1 Animation & Music policy for any card:
 * - `common` / `uncommon` -> Static illustration (`hasFrontVideo: false`, `veoMode: 'none'`)
 * - `rare` (🟡) -> SILENT Veo 3.1 animation (`hasFrontVideo: true`, `video_muted: true`, `veoMode: 'silent'`, `veoBadge: '🔇✨ Veo 3.1 Muta'`)
 * - `mythic` (🟠) -> MUSICAL Veo 3.1 animation (`hasFrontVideo: true`, `video_muted: false`, `music_url: 'assets/cards/mythic-theme.mp3'`, `veoMode: 'musical'`, `veoBadge: '🎵🔥 Veo 3.1 + Musica'`)
 */
export function resolveCardFrontMedia(card = {}) {
  const rarity = normalizeCardRarity(card?.rarity);
  const gameId = String(card?.game_id || '').trim().toLowerCase();

  if (rarity === 'rare') {
    const defaultRareVideo =
      gameId === 'tubature'
        ? 'assets/cards/front/tubature_motorino.mp4'
        : 'assets/cards/front/carchess3d_grandmaster_knight_fork.mp4';
    return {
      hasFrontVideo: true,
      veoMode: 'silent',
      video_url: card?.video_url || defaultRareVideo,
      video_muted: true,
      music_url: null,
      veoBadge: '🔇✨ Veo 3.1 Muta',
    };
  }

  if (rarity === 'mythic') {
    let defaultMythicVideo = 'assets/cards/front/carchess3d_queen_h7_checkmate.mp4';
    if (gameId === 'tubature') {
      defaultMythicVideo = 'assets/cards/front/tubature_schmoogle.mp4';
    } else if (gameId === 'puffin-snake') {
      defaultMythicVideo = 'assets/cards/front/puffin_snake_golden_apple_wyrm.mp4';
    } else if (gameId === 'smurfs-and-dragons' || gameId === 'family-mahjong-3d' || gameId === 'kids-jigsaw-puzzle') {
      defaultMythicVideo = 'assets/cards/front/smurfs_emerald_dragon_lord.mp4';
    }
    return {
      hasFrontVideo: true,
      veoMode: 'musical',
      video_url: card?.video_url || defaultMythicVideo,
      video_muted: false,
      music_url: card?.music_url || 'assets/cards/mythic-theme.mp3',
      veoBadge: '🎵🔥 Veo 3.1 + Musica',
    };
  }

  return {
    hasFrontVideo: false,
    veoMode: 'none',
    video_url: null,
    video_muted: true,
    music_url: null,
    veoBadge: null,
  };
}

export const JACKPOT_MATCH_INTERVAL = 98;
const PACK_COUNTER_STORAGE_KEY = 'puffin_pack_counters_v1';
const _memoryPackCounters = new Map();

function _readPackCountersMap() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(PACK_COUNTER_STORAGE_KEY);
      if (raw) return JSON.parse(raw) || {};
    }
  } catch {}
  return Object.fromEntries(_memoryPackCounters.entries());
}

function _writePackCountersMap(map) {
  for (const [k, v] of Object.entries(map || {})) {
    _memoryPackCounters.set(k, v);
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PACK_COUNTER_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {}
}

export function getGamePackCounter(playerId = 'guest', gameId = 'tubature') {
  const key = `${String(playerId || 'guest').trim().toLowerCase()}__${String(gameId || 'tubature').trim().toLowerCase()}`;
  const map = _readPackCountersMap();
  return Math.max(0, Number(map[key]) || 0);
}

export function setGamePackCounter(playerId = 'guest', gameId = 'tubature', count = 0) {
  const key = `${String(playerId || 'guest').trim().toLowerCase()}__${String(gameId || 'tubature').trim().toLowerCase()}`;
  const map = _readPackCountersMap();
  const cleanCount = Math.max(0, Math.floor(Number(count) || 0));
  map[key] = cleanCount;
  _writePackCountersMap(map);
  return cleanCount;
}

export function incrementGamePackCounter(playerId = 'guest', gameId = 'tubature', step = 1) {
  const prev = getGamePackCounter(playerId, gameId);
  return setGamePackCounter(playerId, gameId, prev + Math.max(1, Math.floor(Number(step) || 1)));
}

/**
 * Evaluates the MTG 4-Tier Rarity Drop (`common` 65%, `uncommon` 25%, `rare` 8.5%, `mythic` 1.5%),
 * enforces the Anti-Farming Merit Gate, AND supports the 98th-Match Jackpot / Pity Guarantee:
 * - In `strict98Mode: true` (or when simulating 97 Commons -> 98th Rare/Mythic), matches `1..97`
 *   yield Common (`common`) cards from that game's pack, and Match #98 (`matchNumber % 98 === 0`)
 *   guarantees a Rare (`rare`) or Mythic Rare (`mythic`) jackpot card of that game!
 * - Even in normal RNG mode, every 98th match (`matchNumber > 0 && matchNumber % 98 === 0`) is a
 *   guaranteed Rare / Mythic Rare Pity Jackpot!
 */
export function rollPuffinCardDrop({
  game_id = 'tubature',
  score = 0,
  difficulty = '',
  extra = {},
  matchNumber = null,
  strict98Mode = false,
  rareScoreThreshold = 1500,
  mythicScoreThreshold = 3000,
  rng = Math.random,
} = {}) {
  const cleanGame = String(game_id || 'tubature').trim().toLowerCase();
  const numScore = Number(score) || 0;
  const diffStr = String(difficulty || extra?.difficulty || extra?.mode || extra?.level || '')
    .trim()
    .toLowerCase();

  const numMatch = matchNumber !== null && matchNumber !== undefined ? Number(matchNumber) : 0;
  const isJackpot98 = numMatch > 0 && numMatch % JACKPOT_MATCH_INTERVAL === 0;

  const isHardDiff = /(hard|nightmare|difficile|turbo|b1_advanced|boss|expert|master|8x8)/i.test(diffStr);
  const isMedDiff =
    isHardDiff || /(medium|medio|normal|sr|ssr|6x6|7x7)/i.test(diffStr);

  const qualifiesForMythic =
    isJackpot98 ||
    isHardDiff ||
    numScore >= mythicScoreThreshold ||
    Boolean(extra?.new_record || extra?.boss);
  const qualifiesForRare =
    isJackpot98 || qualifiesForMythic || isMedDiff || numScore >= rareScoreThreshold;

  const r = Math.max(0, Math.min(0.999999, Number(rng())));
  let rolledRarity = 'common';

  if (isJackpot98) {
    // 98th Match Jackpot! Guarantees Rare or Mythic Rare (Super Rara)!
    const wantsMythic =
      isHardDiff || numScore >= mythicScoreThreshold || r >= 0.45;
    rolledRarity = wantsMythic ? 'mythic' : 'rare';
  } else if (strict98Mode) {
    // Matches 1..97 in strict 98-match mode: Common ("in 97 partite becchi solo la comune")
    rolledRarity = 'common';
  } else {
    if (r >= 0.985) {
      rolledRarity = 'mythic';
    } else if (r >= 0.9) {
      rolledRarity = 'rare';
    } else if (r >= 0.65) {
      rolledRarity = 'uncommon';
    }
  }

  let effectiveRarity = rolledRarity;
  let meritDowngraded = false;

  if (!isJackpot98) {
    if (rolledRarity === 'mythic' && !qualifiesForMythic) {
      effectiveRarity = qualifiesForRare ? 'rare' : 'uncommon';
      meritDowngraded = true;
    } else if (rolledRarity === 'rare' && !qualifiesForRare) {
      effectiveRarity = 'uncommon';
      meritDowngraded = true;
    }
  }

  let pool = getPuffinCardsCatalog({ game_id: cleanGame, rarity: effectiveRarity });
  if (pool.length === 0) {
    pool = getPuffinCardsCatalog({ game_id: cleanGame });
  }
  if (pool.length === 0) {
    pool = getPuffinCardsCatalog({ rarity: effectiveRarity });
  }

  const pickIdx = Math.min(pool.length - 1, Math.floor(Number(rng()) * pool.length));
  const chosenCard = pool[pickIdx] || PUFFIN_CARDS_CATALOG[0];

  return {
    rolledRarity,
    effectiveRarity: chosenCard.rarity,
    meritDowngraded,
    qualifiesForRare,
    qualifiesForMythic,
    matchNumber: numMatch || null,
    isJackpot98,
    card: chosenCard,
  };
}

/**
 * Generates a Game-Specific Booster Pack ("Pacco di `game_id`", e.g. `tubature` or `carchess3d`)
 * containing `packSize` (default 3) cards from that game's catalog so the player can pick 1 card
 * of their choice ("una carta a scelta di quel pacco") after finishing a match!
 */
export function rollGameBoosterPack({
  game_id = 'tubature',
  player_id = 'guest',
  score = 0,
  difficulty = '',
  extra = {},
  matchNumber = null,
  packSize = 3,
  strict98Mode = false,
  autoIncrementCounter = false,
  rng = Math.random,
} = {}) {
  const cleanGame = String(game_id || 'tubature').trim().toLowerCase();
  const cleanPlayer = String(player_id || 'guest').trim().toLowerCase();
  const effectiveMatchNumber =
    matchNumber !== null && matchNumber !== undefined
      ? Number(matchNumber)
      : autoIncrementCounter
      ? incrementGamePackCounter(cleanPlayer, cleanGame, 1)
      : getGamePackCounter(cleanPlayer, cleanGame) || 1;

  const isJackpot98 =
    effectiveMatchNumber > 0 && effectiveMatchNumber % JACKPOT_MATCH_INTERVAL === 0;
  const count = Math.max(1, Math.min(5, Number(packSize) || 3));
  const choices = [];
  const usedIds = new Set();

  for (let i = 0; i < count; i += 1) {
    // On the 98th match, Slot 0 is guaranteed Rare/Mythic, Slot 1 is Rare/Mythic, Slot 2 is Uncommon/Rare
    const slotMatchNum = i === 0 || isJackpot98 ? effectiveMatchNumber : effectiveMatchNumber;
    const drop = rollPuffinCardDrop({
      game_id: cleanGame,
      score,
      difficulty,
      extra,
      matchNumber: slotMatchNum,
      strict98Mode: strict98Mode && !isJackpot98,
      rng,
    });

    let pickedCard = drop.card;
    if (usedIds.has(pickedCard.card_id)) {
      const sameRarityPool = getPuffinCardsCatalog({
        game_id: cleanGame,
        rarity: drop.effectiveRarity,
      }).filter((c) => !usedIds.has(c.card_id));
      const anyGamePool = getPuffinCardsCatalog({ game_id: cleanGame }).filter(
        (c) => !usedIds.has(c.card_id)
      );
      if (sameRarityPool.length > 0) {
        pickedCard =
          sameRarityPool[Math.floor(Number(rng()) * sameRarityPool.length)] || pickedCard;
      } else if (anyGamePool.length > 0 && !strict98Mode && !isJackpot98) {
        pickedCard = anyGamePool[Math.floor(Number(rng()) * anyGamePool.length)] || pickedCard;
      }
    }
    usedIds.add(pickedCard.card_id);
    choices.push({
      slot: i + 1,
      ...drop,
      card: pickedCard,
      effectiveRarity: pickedCard.rarity,
    });
  }

  return {
    game_id: cleanGame,
    player_id: cleanPlayer,
    matchNumber: effectiveMatchNumber,
    matchesUntilJackpot98: isJackpot98
      ? 0
      : JACKPOT_MATCH_INTERVAL - (effectiveMatchNumber % JACKPOT_MATCH_INTERVAL),
    isJackpot98,
    choices,
  };
}

export function validateAndNormalizeUserCardRecord(raw = {}, normalizeProfileFn = (x) => x) {
  const playerId = normalizeProfileFn(raw.player_id ?? raw.playerId ?? raw.userId ?? 'guest', false) || 'guest';
  const fallbackGame = String(raw.game_id || raw.gameId || 'tubature').trim().toLowerCase();
  const cardId = normalizeCardId(raw.card_id || raw.cardId || raw.slug || 'tubature:ruby', fallbackGame);
  const cardMeta = getCardById(cardId, fallbackGame);
  const nowIso = new Date().toISOString();
  const count = Math.max(1, Number(raw.count) || 1);

  return {
    id: raw.id || `${playerId}__${cardIdToFirestoreDocId(cardId)}`,
    player_id: playerId,
    card_id: cardMeta.card_id,
    game_id: cardMeta.game_id,
    rarity: normalizeCardRarity(raw.rarity || cardMeta.rarity),
    count,
    first_unlocked_at: raw.first_unlocked_at || raw.firstUnlockedAt || nowIso,
    last_unlocked_at: raw.last_unlocked_at || raw.lastUnlockedAt || nowIso,
    best_score_context: Number(raw.best_score_context ?? raw.score ?? 0) || 0,
  };
}

/**
 * Builds the ownership map `{ [card_id]: { totalCount, byPlayer: { [player_id]: count } } }`
 */
export function buildCardsOwnershipMap(userCards = []) {
  const byCard = {};
  for (const uc of Array.isArray(userCards) ? userCards : []) {
    if (!uc || !uc.card_id) continue;
    const cid = normalizeCardId(uc.card_id, uc.game_id);
    if (!byCard[cid]) {
      byCard[cid] = { totalCount: 0, ownersCount: 0, byPlayer: {} };
    }
    const pid = String(uc.player_id || 'guest').toLowerCase();
    const c = Math.max(1, Number(uc.count) || 1);
    if (!byCard[cid].byPlayer[pid]) {
      byCard[cid].ownersCount += 1;
      byCard[cid].byPlayer[pid] = 0;
    }
    byCard[cid].byPlayer[pid] += c;
    byCard[cid].totalCount += c;
  }
  return byCard;
}

/**
 * Computes comprehensive Multi-Hall of Fame & Family Insights:
 * - `gamesHallOfFame`: Per-game Top 10, King of the Game (#1 Gold, #2 Silver, #3 Bronze), total matches, playtime
 * - `kingOfEachGame`: Quick summary array of each game's reigning monarch
 * - `medalTally`: Olympic medal table across family heroes (Gold, Silver, Bronze, Total Score, Playtime)
 * - `collectorLeaderboard`: Card binder completion per hero (Unique cards, Mythic count, Duplicates, Completion %)
 * - `telemetry`: Hostnames & devices breakdown
 */
export function computeFamilyInsights({
  scores = [],
  userCards = [],
  profiles = [],
  ringApps = [],
} = {}) {
  const safeScores = Array.isArray(scores) ? scores : [];
  const safeCards = Array.isArray(userCards) ? userCards : [];
  const totalCatalogSize = PUFFIN_CARDS_CATALOG.length || 1;

  const gameBuckets = new Map();
  for (const app of Array.isArray(ringApps) ? ringApps : []) {
    const gid = String(app.puffin_game_id || app.id || '').trim().toLowerCase();
    if (gid && !gameBuckets.has(gid)) {
      gameBuckets.set(gid, []);
    }
  }
  for (const s of safeScores) {
    const gid = String(s?.game_id || s?.gameId || '').trim().toLowerCase();
    if (!gid) continue;
    if (!gameBuckets.has(gid)) gameBuckets.set(gid, []);
    gameBuckets.get(gid).push(s);
  }

  const medalsByPlayer = new Map();
  const ensureMedalRow = (pid) => {
    const cleanPid = String(pid || 'guest').toLowerCase();
    if (!medalsByPlayer.has(cleanPid)) {
      const prof =
        (Array.isArray(profiles) && profiles.find((p) => p.id === cleanPid)) || {
          id: cleanPid,
          displayName: cleanPid === 'null' ? 'Guest' : cleanPid,
          shortName: cleanPid === 'null' ? 'Guest' : cleanPid,
          emoji: '🐧',
          colorHex: '#94A3B8',
          avatar: 'assets/avatars/guest.png',
        };
      medalsByPlayer.set(cleanPid, {
        player_id: cleanPid,
        displayName: prof.displayName,
        shortName: prof.shortName,
        emoji: prof.emoji || '🐧',
        colorHex: prof.colorHex || '#94A3B8',
        avatar: prof.avatar || 'assets/avatars/guest.png',
        gold: 0,
        silver: 0,
        bronze: 0,
        totalMedals: 0,
        crownedGames: [],
        totalScore: 0,
        totalMatches: 0,
        totalDurationSec: 0,
      });
    }
    return medalsByPlayer.get(cleanPid);
  };

  for (const p of Array.isArray(profiles) ? profiles : []) {
    if (p?.id && p.role !== 'bot') ensureMedalRow(p.id);
  }

  const gamesHallOfFame = [];
  const kingOfEachGame = [];

  for (const [gameId, gScores] of gameBuckets.entries()) {
    const sorted = [...gScores].sort(
      (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)
    );

    const bestByPlayer = new Map();
    let totalDurationSec = 0;
    for (const rec of sorted) {
      const pid = String(rec.player_id || 'guest').toLowerCase();
      const dur = Math.max(0, Number(rec.duration_sec) || 0);
      totalDurationSec += dur;
      const mRow = ensureMedalRow(pid);
      mRow.totalScore += Number(rec.score) || 0;
      mRow.totalMatches += 1;
      mRow.totalDurationSec += dur;

      if (!bestByPlayer.has(pid)) {
        bestByPlayer.set(pid, {
          player_id: pid,
          displayName: rec.displayName || mRow.displayName,
          shortName: rec.shortName || mRow.shortName,
          emoji: rec.emoji || mRow.emoji,
          colorHex: rec.colorHex || mRow.colorHex,
          avatar: rec.avatar || mRow.avatar,
          score: Number(rec.score) || 0,
          duration_sec: dur,
          ended_at: rec.ended_at,
          summary_text: rec.summary_text || '',
          difficulty: rec.extra?.difficulty || rec.extra?.mode || 'standard',
        });
      }
    }

    const podium = Array.from(bestByPlayer.values()).slice(0, 3);
    if (podium[0]) {
      const gWinner = ensureMedalRow(podium[0].player_id);
      gWinner.gold += 1;
      gWinner.totalMedals += 1;
      gWinner.crownedGames.push(gameId);
    }
    if (podium[1]) {
      const sWinner = ensureMedalRow(podium[1].player_id);
      sWinner.silver += 1;
      sWinner.totalMedals += 1;
    }
    if (podium[2]) {
      const bWinner = ensureMedalRow(podium[2].player_id);
      bWinner.bronze += 1;
      bWinner.totalMedals += 1;
    }

    const ringMeta =
      (Array.isArray(ringApps) &&
        ringApps.find(
          (a) =>
            String(a.id || '').toLowerCase() === gameId ||
            String(a.puffin_game_id || '').toLowerCase() === gameId
        )) ||
      null;

    const king = podium[0] || null;
    const gameCards = getPuffinCardsCatalog({ game_id: gameId });

    const gameEntry = {
      game_id: gameId,
      title: ringMeta?.title || gameId,
      shortTitle: ringMeta?.shortTitle || gameId,
      emoji: ringMeta?.emoji || '🎮',
      play_url: ringMeta?.play_url || '',
      status: ringMeta?.status || (sorted.length > 0 ? 'live' : 'upcoming'),
      totalMatches: sorted.length,
      totalDurationSec,
      cardsInCatalog: gameCards.length,
      king,
      podium,
      topScores: sorted.slice(0, 10),
      bestByPlayer: Object.fromEntries(bestByPlayer.entries()),
    };

    gamesHallOfFame.push(gameEntry);
    if (king) {
      kingOfEachGame.push({
        game_id: gameId,
        gameTitle: gameEntry.shortTitle,
        gameEmoji: gameEntry.emoji,
        play_url: gameEntry.play_url,
        player_id: king.player_id,
        shortName: king.shortName,
        displayName: king.displayName,
        emoji: king.emoji,
        colorHex: king.colorHex,
        avatar: king.avatar,
        score: king.score,
        runnerUp: podium[1] || null,
      });
    }
  }

  gamesHallOfFame.sort(
    (a, b) => b.totalMatches - a.totalMatches || a.game_id.localeCompare(b.game_id)
  );

  const medalTally = Array.from(medalsByPlayer.values()).sort(
    (a, b) =>
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      b.totalScore - a.totalScore
  );

  // Collector Leaderboard
  const collectorMap = new Map();
  for (const m of medalTally) {
    collectorMap.set(m.player_id, {
      player_id: m.player_id,
      displayName: m.displayName,
      shortName: m.shortName,
      emoji: m.emoji,
      colorHex: m.colorHex,
      avatar: m.avatar,
      uniqueCards: 0,
      totalCopies: 0,
      duplicatesCount: 0,
      mythicCount: 0,
      rareCount: 0,
      uncommonCount: 0,
      commonCount: 0,
      completionPct: 0,
      cards: [],
    });
  }

  const seenPerPlayer = new Map();
  for (const uc of safeCards) {
    if (!uc || !uc.player_id || !uc.card_id) continue;
    const pid = String(uc.player_id).toLowerCase();
    const cid = normalizeCardId(uc.card_id, uc.game_id);
    const rarity = normalizeCardRarity(uc.rarity || getCardById(cid).rarity);
    const count = Math.max(1, Number(uc.count) || 1);

    if (!collectorMap.has(pid)) {
      ensureMedalRow(pid);
      const m = medalsByPlayer.get(pid);
      collectorMap.set(pid, {
        player_id: pid,
        displayName: m.displayName,
        shortName: m.shortName,
        emoji: m.emoji,
        colorHex: m.colorHex,
        avatar: m.avatar,
        uniqueCards: 0,
        totalCopies: 0,
        duplicatesCount: 0,
        mythicCount: 0,
        rareCount: 0,
        uncommonCount: 0,
        commonCount: 0,
        completionPct: 0,
        cards: [],
      });
    }

    const row = collectorMap.get(pid);
    if (!seenPerPlayer.has(pid)) seenPerPlayer.set(pid, new Set());
    const playerSet = seenPerPlayer.get(pid);

    if (!playerSet.has(cid)) {
      playerSet.add(cid);
      row.uniqueCards += 1;
      if (rarity === 'mythic') row.mythicCount += 1;
      else if (rarity === 'rare') row.rareCount += 1;
      else if (rarity === 'uncommon') row.uncommonCount += 1;
      else row.commonCount += 1;
    }
    row.totalCopies += count;
    row.duplicatesCount = Math.max(0, row.totalCopies - row.uniqueCards);
    row.completionPct = Math.round((row.uniqueCards / totalCatalogSize) * 100);
    row.cards.push({ card_id: cid, rarity, count });
  }

  const collectorLeaderboard = Array.from(collectorMap.values()).sort(
    (a, b) =>
      b.uniqueCards - a.uniqueCards ||
      b.mythicCount - a.mythicCount ||
      b.rareCount - a.rareCount ||
      b.totalCopies - a.totalCopies
  );

  // Device & Hostname Telemetry
  const hostMap = new Map();
  const deviceMap = new Map();
  for (const s of safeScores) {
    const hostKey =
      s.hostname && s.hostname !== 'localhost' && s.hostname !== '127.0.0.1'
        ? s.hostname
        : s.ip_address || '127.0.0.1';
    hostMap.set(hostKey, (hostMap.get(hostKey) || 0) + 1);
    const devKey = s.device || 'Browser';
    deviceMap.set(devKey, (deviceMap.get(devKey) || 0) + 1);
  }

  const telemetry = {
    hostnames: Array.from(hostMap.entries())
      .map(([host, matches]) => ({ host, matches }))
      .sort((a, b) => b.matches - a.matches),
    devices: Array.from(deviceMap.entries())
      .map(([device, matches]) => ({ device, matches }))
      .sort((a, b) => b.matches - a.matches),
  };

  return {
    totalCatalogCards: totalCatalogSize,
    totalMatches: safeScores.length,
    cardBack: PUFFIN_CARD_BACK,
    kingOfEachGame,
    medalTally,
    gamesHallOfFame,
    collectorLeaderboard,
    ownershipByCard: buildCardsOwnershipMap(safeCards),
    telemetry,
  };
}

/**
 * Computes a direct Head-to-Head rivalry breakdown between any two family heroes (`playerAId` vs `playerBId`).
 */
export function compareFamilyRivals(insights, playerAId = 'ale', playerBId = 'seby') {
  const idA = String(playerAId || 'ale').trim().toLowerCase();
  const idB = String(playerBId || 'seby').trim().toLowerCase();

  const findMedalRow = (pid) =>
    (insights?.medalTally || []).find((m) => m.player_id === pid) || {
      player_id: pid,
      shortName: pid,
      displayName: pid,
      emoji: '🐧',
      colorHex: '#94A3B8',
      gold: 0,
      silver: 0,
      bronze: 0,
      totalScore: 0,
      totalMatches: 0,
    };

  const rowA = findMedalRow(idA);
  const rowB = findMedalRow(idB);

  let winsA = 0;
  let winsB = 0;
  let ties = 0;
  const perGame = [];

  for (const g of insights?.gamesHallOfFame || []) {
    const recA = g.bestByPlayer?.[idA] || null;
    const recB = g.bestByPlayer?.[idB] || null;
    if (!recA && !recB) continue;

    const scoreA = recA ? recA.score : 0;
    const scoreB = recB ? recB.score : 0;
    let winner = 'tie';
    if (scoreA > scoreB) {
      winner = idA;
      winsA += 1;
    } else if (scoreB > scoreA) {
      winner = idB;
      winsB += 1;
    } else {
      ties += 1;
    }

    perGame.push({
      game_id: g.game_id,
      title: g.shortTitle || g.title,
      emoji: g.emoji,
      scoreA,
      scoreB,
      margin: Math.abs(scoreA - scoreB),
      winner,
    });
  }

  return {
    playerA: { id: idA, ...rowA, gamesWon: winsA },
    playerB: { id: idB, ...rowB, gamesWon: winsB },
    ties,
    overallLeader: winsA > winsB ? idA : winsB > winsA ? idB : 'tie',
    perGame,
  };
}

/**
 * Plays a card's custom `.mp3` (`majjal.mp3`, `magnat_al_canal.mp3`) if present,
 * and synthesizes an MTG rarity fanfare chord via Web Audio API.
 */
export function playCardAudioOrFanfare(card = {}) {
  if (typeof window === 'undefined') return;
  const rarity = normalizeCardRarity(card?.rarity);

  // 1. Play custom audio file if present
  if (card?.audio_url && typeof Audio !== 'undefined') {
    try {
      const audio = new Audio(card.audio_url);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    } catch {}
  }

  // 2. Play synthesized MTG Rarity Chord
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = playCardAudioOrFanfare._ctx || (playCardAudioOrFanfare._ctx = new AudioCtx());
    const chords = {
      common: [392.0, 493.88],
      uncommon: [440.0, 554.37, 659.25],
      rare: [523.25, 659.25, 783.99, 1046.5],
      mythic: [523.25, 659.25, 783.99, 987.77, 1318.51],
    };
    const notes = chords[rarity] || chords.common;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = rarity === 'mythic' ? 'triangle' : 'sine';
      const startAt = ctx.currentTime + idx * 0.065;
      const dur = rarity === 'mythic' ? 0.45 : 0.28;
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0.07, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + dur);
    });
  } catch {}
}

/**
 * Plays the optional Medieval-Futuristic Positive Explosion & Grand Piano Fanfare
 * (`assets/cards/card-back-fanfare.mp3`) for the Puffin Card Back, with a Web Audio API
 * synthesized fallback (sub-bass boom + futuristic laser sweep + C9 Grand Piano arpeggio).
 */
export function playCardBackExplosion({ force = false } = {}) {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (!force && playCardBackExplosion._lastAt && now - playCardBackExplosion._lastAt < 900) {
    return;
  }
  playCardBackExplosion._lastAt = now;

  // 1. Play MP3 track (`assets/cards/card-back-fanfare.mp3`)
  if (typeof Audio !== 'undefined' && PUFFIN_CARD_BACK.audio_url) {
    try {
      if (!playCardBackExplosion._audio) {
        playCardBackExplosion._audio = new Audio(PUFFIN_CARD_BACK.audio_url);
      }
      const audio = playCardBackExplosion._audio;
      audio.currentTime = 0;
      audio.volume = 0.85;
      audio.play().catch(() => {});
      return;
    } catch {}
  }

  // 2. Web Audio API Fallback (Medieval Cannon Boom + Futuristic Whoosh + Grand Piano Chord)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = playCardAudioOrFanfare._ctx || (playCardAudioOrFanfare._ctx = new AudioCtx());
    const t0 = ctx.currentTime;

    // Sub-bass positive explosion punch (110Hz -> 38Hz)
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(115, t0);
    boomOsc.frequency.exponentialRampToValueAtTime(36, t0 + 0.42);
    boomGain.gain.setValueAtTime(0.22, t0);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
    boomOsc.connect(boomGain);
    boomGain.connect(ctx.destination);
    boomOsc.start(t0);
    boomOsc.stop(t0 + 0.46);

    // Grand Piano + Medieval Brass heroic C-Major-9 fanfare
    const pianoNotes = [261.63, 329.63, 392.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
    pianoNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx < 4 ? 'triangle' : 'sine';
      const startAt = t0 + 0.08 + idx * 0.045;
      const dur = 0.65;
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0.08, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + dur);
    });
  } catch {}
}

/**
 * Plays the Mythic Rare soundtrack (`assets/cards/mythic-theme.mp3` — Grand Piano + Medieval Choir & Brass)
 * when a Mythic Rare (`🟠`) card's Veo 3.1 animation plays!
 */
export function playMythicCardMusic(musicUrl = 'assets/cards/mythic-theme.mp3', { force = false } = {}) {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (!force && playMythicCardMusic._lastAt && now - playMythicCardMusic._lastAt < 1200) {
    return;
  }
  playMythicCardMusic._lastAt = now;

  if (typeof Audio !== 'undefined' && musicUrl) {
    try {
      if (!playMythicCardMusic._audio || playMythicCardMusic._src !== musicUrl) {
        playMythicCardMusic._audio = new Audio(musicUrl);
        playMythicCardMusic._src = musicUrl;
      }
      const audio = playMythicCardMusic._audio;
      audio.currentTime = 0;
      audio.volume = 0.85;
      audio.play().catch(() => {});
      return;
    } catch {}
  }

  // Web Audio API fallback if Audio playback is restricted
  playCardAudioOrFanfare({ rarity: 'mythic' });
}

export function stopMythicCardMusic() {
  try {
    if (playMythicCardMusic._audio) {
      playMythicCardMusic._audio.pause();
    }
  } catch {}
}

export const CARDS_CSS = `
:host {
  display: block;
  font-family: 'Nunito', 'Inter', system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

.binder-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.binder-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(250, 204, 21, 0.3);
  border-radius: 1rem;
  padding: 0.75rem 0.95rem;
}

.binder-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.binder-select,
.binder-btn {
  background: #0b1021;
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.65rem;
  padding: 0.42rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}

.binder-btn.active {
  background: linear-gradient(135deg, #ea580c, #d97706);
  border-color: #fde047;
  color: #fff;
  box-shadow: 0 0 14px rgba(249, 115, 22, 0.5);
}

.binder-stats-pill {
  font-size: 0.78rem;
  font-weight: 800;
  color: #fde047;
  background: rgba(250, 204, 21, 0.12);
  border: 1px solid rgba(250, 204, 21, 0.35);
  border-radius: 999px;
  padding: 0.32rem 0.75rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  gap: 1.05rem;
}

.mtg-card-scene {
  perspective: 1100px;
  aspect-ratio: 5 / 7;
  width: 100%;
  position: relative;
}

.mtg-card-flipper {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.62s cubic-bezier(0.22, 1, 0.36, 1);
}

.mtg-card-scene.is-flipped .mtg-card-flipper {
  transform: rotateY(180deg);
}

.mtg-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mtg-front {
  background: linear-gradient(165deg, #161d31 0%, #090d18 100%);
  border: 4px solid #334155;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.72);
  padding: 0.55rem;
  justify-content: space-between;
  transform: rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.mtg-card-scene[data-rarity="common"] .mtg-front {
  border-color: #475569;
}

.mtg-card-scene[data-rarity="uncommon"] .mtg-front {
  border-color: #cbd5e1;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.75), 0 0 16px rgba(203, 213, 225, 0.28);
}

.mtg-card-scene[data-rarity="rare"] .mtg-front {
  border-color: #facc15;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8), 0 0 22px rgba(250, 204, 21, 0.45);
  background: linear-gradient(165deg, #27200c 0%, #0d1222 100%);
}

.mtg-card-scene[data-rarity="mythic"] .mtg-front {
  border-color: #ff6d00;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.85), 0 0 28px rgba(255, 109, 0, 0.68);
  background: linear-gradient(165deg, #2e1208 0%, #120d24 55%, #090d18 100%);
}

.mtg-holo-glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    circle at var(--glare-x, 50%) var(--glare-y, 35%),
    rgba(255, 255, 255, 0.28) 0%,
    rgba(250, 204, 21, 0.14) 28%,
    rgba(56, 189, 248, 0.1) 52%,
    transparent 75%
  );
  mix-blend-mode: screen;
  transition: opacity 0.2s ease;
}

.mtg-card-scene:hover .mtg-holo-glare {
  opacity: 1;
}

.mtg-card-scene.is-locked:not(.spoiler-on) .mtg-art-img {
  filter: brightness(0.12) contrast(1.4) grayscale(1);
}

.mtg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.55rem;
  padding: 0.28rem 0.48rem;
  z-index: 2;
}

.mtg-title {
  font-size: 0.78rem;
  font-weight: 900;
  color: #fef08a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mtg-game-pill {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.1rem 0.38rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  white-space: nowrap;
}

.mtg-art-box {
  position: relative;
  flex: 1;
  min-height: 115px;
  margin: 0.35rem 0;
  border-radius: 0.55rem;
  overflow: hidden;
  background: radial-gradient(circle at center, #1e293b 0%, #090d16 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mtg-art-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.25rem;
  display: block;
  transition: transform 0.24s ease;
}

.mtg-art-img[src*="assets/cards/front/"],
.mtg-art-img[src*="assets/ring/"] {
  object-fit: cover;
  padding: 0;
}

.mtg-card-scene:hover .mtg-art-img {
  transform: scale(1.06);
}

.mtg-art-fallback {
  font-size: 3.1rem;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7));
}

.mtg-front-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.28s ease;
  pointer-events: none;
  z-index: 2;
}

.mtg-art-box.front-video-playing .mtg-front-video {
  opacity: 1;
}

.mtg-veo-front-badge {
  position: absolute;
  bottom: 5px;
  right: 6px;
  z-index: 4;
  background: rgba(9, 13, 24, 0.88);
  color: #fde047;
  border: 1px solid rgba(250, 204, 21, 0.65);
  border-radius: 999px;
  font-size: 0.56rem;
  font-weight: 900;
  padding: 0.1rem 0.42rem;
  pointer-events: none;
  white-space: nowrap;
}

.mtg-card-scene[data-rarity="mythic"] .mtg-veo-front-badge {
  color: #ffedd5;
  background: rgba(154, 52, 18, 0.92);
  border-color: #fb923c;
  box-shadow: 0 0 10px rgba(255, 109, 0, 0.6);
}

.mtg-flip-mini-btn,
.mtg-audio-mini-btn {
  position: absolute;
  top: 6px;
  z-index: 4;
  background: rgba(9, 13, 24, 0.86);
  color: #fde047;
  border: 1px solid rgba(250, 204, 21, 0.55);
  border-radius: 999px;
  font-size: 0.64rem;
  font-weight: 900;
  padding: 0.16rem 0.45rem;
  cursor: pointer;
}

.mtg-flip-mini-btn {
  right: 6px;
}

.mtg-audio-mini-btn {
  left: 6px;
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.6);
}

.mtg-type-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.64rem;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.45rem;
  padding: 0.2rem 0.45rem;
  color: #cbd5e1;
}

.mtg-lore-box {
  font-size: 0.66rem;
  line-height: 1.28;
  color: #e2e8f0;
  font-style: italic;
  background: rgba(9, 13, 24, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 0.45rem;
  padding: 0.34rem 0.45rem;
  margin: 0.28rem 0;
  min-height: 2.55rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mtg-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  font-size: 0.64rem;
  font-weight: 800;
}

.mtg-owners-strip {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  flex-wrap: wrap;
}

.mtg-owner-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.08rem 0.34rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--owner-color, #94a3b8);
  font-size: 0.6rem;
  color: #fff;
}

.mtg-pt-box {
  background: rgba(15, 23, 42, 0.95);
  border: 1.5px solid rgba(250, 204, 21, 0.55);
  border-radius: 0.4rem;
  padding: 0.12rem 0.38rem;
  color: #fef08a;
  font-weight: 900;
  white-space: nowrap;
}

/* ─── PUFFIN CARD BACK (MTG Homage + Veo 3.1 Hover Video Loop) ─── */
.mtg-back {
  transform: rotateY(180deg);
  background: #120b07;
  border: 4px solid #b45309;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.85), inset 0 0 18px rgba(250, 204, 21, 0.35);
  cursor: pointer;
  position: relative;
}

.mtg-back-img,
.mtg-back-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mtg-back-video {
  opacity: 0;
  transition: opacity 0.28s ease;
  pointer-events: none;
}

.mtg-back.video-playing .mtg-back-video {
  opacity: 1;
}

.mtg-back-badge {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(9, 13, 24, 0.88);
  color: #fde047;
  border: 1px solid rgba(250, 204, 21, 0.65);
  border-radius: 999px;
  padding: 0.18rem 0.6rem;
  font-size: 0.62rem;
  font-weight: 900;
  white-space: nowrap;
  z-index: 3;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.85);
}

/* ─── INSPECTOR MODAL ─── */
.binder-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 17, 0.86);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.binder-modal-box {
  background: #11172a;
  border: 2px solid rgba(250, 204, 21, 0.55);
  border-radius: 1.35rem;
  max-width: 720px;
  width: 100%;
  padding: 1.25rem;
  display: grid;
  grid-template-columns: minmax(240px, 290px) 1fr;
  gap: 1.25rem;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9);
}

@media (max-width: 640px) {
  .binder-modal-box {
    grid-template-columns: 1fr;
  }
}
`;

export function attachCardBackHoverVideo(containerEl, { isSoundEnabledFn = () => false } = {}) {
  if (!containerEl) return;
  containerEl.querySelectorAll('.mtg-back').forEach((backEl) => {
    const startVid = () => {
      if (isSoundEnabledFn()) {
        playCardBackExplosion();
      }
      const vid = backEl.querySelector('.mtg-back-video');
      if (!vid || vid.dataset.failed === '1') return;
      if (!vid.src && vid.dataset.src) {
        vid.src = vid.dataset.src;
        vid.addEventListener(
          'error',
          () => {
            vid.dataset.failed = '1';
            backEl.classList.remove('video-playing');
          },
          { once: true }
        );
        vid.addEventListener('playing', () => {
          backEl.classList.add('video-playing');
        });
      }
      const p = vid.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    const stopVid = () => {
      const vid = backEl.querySelector('.mtg-back-video');
      if (!vid) return;
      backEl.classList.remove('video-playing');
      try {
        vid.pause();
      } catch {}
    };
    backEl.addEventListener('mouseenter', startVid);
    backEl.addEventListener('mouseleave', stopVid);
    backEl.addEventListener('touchstart', startVid, { passive: true });
  });
}

/**
 * Attaches Veo 3.1 Front Animation playback on `.mtg-art-box[data-has-front-video="1"]`:
 * - Rare (`🟡` `data-veo-mode="silent"`): Plays Veo 3.1 animation SILENTLY (`vid.muted = true`)
 * - Mythic (`🟠` `data-veo-mode="musical"`): Plays Veo 3.1 animation WITH MUSIC (`vid.muted = false` + `playMythicCardMusic`)
 */
export function attachCardFrontHoverVideo(
  containerEl,
  { isSoundEnabledFn = () => true, autoPlayAll = false } = {}
) {
  if (!containerEl) return;
  containerEl.querySelectorAll('.mtg-art-box[data-has-front-video="1"]').forEach((artBox) => {
    const veoMode = artBox.getAttribute('data-veo-mode') || 'none';
    const musicUrl = artBox.getAttribute('data-music-url') || 'assets/cards/mythic-theme.mp3';

    const startFrontVid = () => {
      const vid = artBox.querySelector('.mtg-front-video');
      if (!vid || vid.dataset.failed === '1') return;
      const isMythicMusical = veoMode === 'musical';
      const allowAudio = Boolean(isMythicMusical && isSoundEnabledFn());

      // Enforce Rare = strictly silent (muted = true); Mythic = with music when sound is enabled!
      vid.muted = !allowAudio;
      if (allowAudio) {
        playMythicCardMusic(musicUrl);
      }

      if (!vid.src && vid.dataset.src) {
        vid.src = vid.dataset.src;
        vid.addEventListener(
          'error',
          () => {
            vid.dataset.failed = '1';
            artBox.classList.remove('front-video-playing');
          },
          { once: true }
        );
        vid.addEventListener('playing', () => {
          artBox.classList.add('front-video-playing');
        });
      }
      const p = vid.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // If browser blocks unmuted autoplay on hover, fall back to muted video + WebAudio/Audio track
          vid.muted = true;
          const p2 = vid.play();
          if (p2 && typeof p2.catch === 'function') p2.catch(() => {});
        });
      }
    };

    const stopFrontVid = () => {
      if (autoPlayAll) return;
      const vid = artBox.querySelector('.mtg-front-video');
      if (!vid) return;
      artBox.classList.remove('front-video-playing');
      try {
        vid.pause();
      } catch {}
      if (veoMode === 'musical') {
        stopMythicCardMusic();
      }
    };

    artBox.addEventListener('mouseenter', startFrontVid);
    artBox.addEventListener('mouseleave', stopFrontVid);
    artBox.addEventListener('touchstart', startFrontVid, { passive: true });

    if (autoPlayAll) {
      startFrontVid();
    }
  });
}

export function createPuffinCardsElementClass({
  BaseElementClass,
  getPuffinLoginApi,
  getProfileByIdFn,
}) {
  return class PuffinCardsElement extends BaseElementClass {
    static get observedAttributes() {
      return ['player-id', 'game-id', 'rarity'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      const styleEl = document.createElement('style');
      styleEl.textContent = CARDS_CSS;
      this.shadowRoot.append(styleEl);
      this.$root = document.createElement('div');
      this.$root.className = 'binder-wrap';
      this.shadowRoot.append(this.$root);

      this.filterPlayer = this.getAttribute('player-id') || 'ALL';
      this.filterGame = this.getAttribute('game-id') || 'ALL';
      this.filterRarity = this.getAttribute('rarity') || 'ALL';
      this.filterOwnership = 'ALL';
      this.showAllBacks = false;
      this.spoilerPreview = true;
      this.selectedBackImage = PUFFIN_CARD_BACK.image_url;
      this.flippedCardIds = new Set();
      this.inspectedCardId = null;
      this.backSoundEnabled = true;
      try {
        if (typeof localStorage !== 'undefined') {
          const savedSfx = localStorage.getItem('puffin_card_back_sfx_v1');
          if (savedSfx === '0') this.backSoundEnabled = false;
        }
      } catch {}

      this._onUpdate = () => this.render();
    }

    connectedCallback() {
      if (typeof window !== 'undefined') {
        window.addEventListener('puffin-card-unlocked', this._onUpdate);
        window.addEventListener('puffin-auth-updated', this._onUpdate);
      }
      this.render();
      const api = getPuffinLoginApi();
      if (api?.fetchCloudCards) {
        api.fetchCloudCards().then(() => this.render()).catch(() => {});
      }
    }

    disconnectedCallback() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('puffin-card-unlocked', this._onUpdate);
        window.removeEventListener('puffin-auth-updated', this._onUpdate);
      }
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      if (name === 'player-id') this.filterPlayer = newVal || 'ALL';
      if (name === 'game-id') this.filterGame = newVal || 'ALL';
      if (name === 'rarity') this.filterRarity = newVal || 'ALL';
      if (this.isConnected) this.render();
    }

    render() {
      const api = getPuffinLoginApi();
      const userCards = api ? api.getUserCards() : DEFAULT_DUMMY_USER_CARDS;
      const ownershipMap = buildCardsOwnershipMap(userCards);

      const allCards = getPuffinCardsCatalog({
        game_id: this.filterGame === 'ALL' ? undefined : this.filterGame,
        rarity: this.filterRarity === 'ALL' ? undefined : this.filterRarity,
      });

      const filteredCards = allCards.filter((card) => {
        const own = ownershipMap[card.card_id];
        const isOwned =
          this.filterPlayer === 'ALL'
            ? Boolean(own && own.totalCount > 0)
            : Boolean(own?.byPlayer?.[this.filterPlayer] > 0);
        if (this.filterOwnership === 'OWNED') return isOwned;
        if (this.filterOwnership === 'MISSING') return !isOwned;
        return true;
      });

      const gamesList = Array.from(new Set(PUFFIN_CARDS_CATALOG.map((c) => c.game_id)));
      const ownedCount = allCards.filter((c) => {
        const own = ownershipMap[c.card_id];
        return this.filterPlayer === 'ALL'
          ? Boolean(own && own.totalCount > 0)
          : Boolean(own?.byPlayer?.[this.filterPlayer] > 0);
      }).length;

      const cardsHtml = filteredCards
        .map((card) => {
          const rMeta = MTG_RARITY_INFO[card.rarity] || MTG_RARITY_INFO.common;
          const own = ownershipMap[card.card_id] || { totalCount: 0, byPlayer: {} };
          const isOwned =
            this.filterPlayer === 'ALL'
              ? own.totalCount > 0
              : (own.byPlayer[this.filterPlayer] || 0) > 0;
          const isFlipped = this.showAllBacks || this.flippedCardIds.has(card.card_id);

          const ownersPills = Object.entries(own.byPlayer)
            .map(([pid, cnt]) => {
              const prof = getProfileByIdFn(pid);
              return `<span class="mtg-owner-pill" style="--owner-color:${prof.colorHex}" title="${prof.displayName}: x${cnt}">${prof.emoji || '🐧'} ${prof.shortName} x${cnt}</span>`;
            })
            .join('');

          const ptLabel = card.stats
            ? `⚔️${card.stats.atk}/🛡️${card.stats.def}`
            : `#${card.number} • ${rMeta.probabilityPct}`;
          const frontMedia = resolveCardFrontMedia(card);

          return `
            <div class="mtg-card-scene ${isFlipped ? 'is-flipped' : ''} ${!isOwned ? 'is-locked' : ''} ${this.spoilerPreview ? 'spoiler-on' : ''}" data-card-id="${card.card_id}" data-rarity="${card.rarity}">
              <div class="mtg-card-flipper">
                <div class="mtg-face mtg-front">
                  <div class="mtg-holo-glare"></div>
                  <div class="mtg-header">
                    <span class="mtg-title">${card.emoji} ${card.title}</span>
                    <span class="mtg-game-pill">${card.game_id}</span>
                  </div>
                  <div class="mtg-art-box" data-inspect-card="${card.card_id}" data-has-front-video="${frontMedia.hasFrontVideo ? '1' : '0'}" data-veo-mode="${frontMedia.veoMode}" data-music-url="${frontMedia.music_url || ''}">
                    ${
                      card.audio_url
                        ? `<button type="button" class="mtg-audio-mini-btn" data-play-audio="${card.card_id}" title="Ascolta effetto sonoro originale!">🔊 Audio</button>`
                        : ''
                    }
                    <button type="button" class="mtg-flip-mini-btn" data-flip-card="${card.card_id}" title="Gira sul Retro Puffin (Veo 3.1)">🔄 Retro</button>
                    <img class="mtg-art-img" src="${card.image_url}" alt="${card.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                    <div class="mtg-art-fallback" style="display:none;">${card.emoji}</div>
                    ${
                      frontMedia.hasFrontVideo
                        ? `<video class="mtg-front-video" data-src="${frontMedia.video_url}" ${frontMedia.video_muted ? 'muted' : ''} loop playsinline preload="none"></video><span class="mtg-veo-front-badge">${frontMedia.veoBadge}</span>`
                        : ''
                    }
                  </div>
                  <div class="mtg-type-bar">
                    <span>${card.category}</span>
                    <span>${rMeta.gem} ${rMeta.label}</span>
                  </div>
                  <div class="mtg-lore-box" title="${card.description}">
                    ${card.description}
                  </div>
                  <div class="mtg-footer">
                    <div class="mtg-owners-strip">
                      ${ownersPills || '<span style="color:#64748b;">🔒 Non ancora trovata</span>'}
                    </div>
                    <span class="mtg-pt-box">${ptLabel}</span>
                  </div>
                </div>
                <div class="mtg-face mtg-back" data-flip-card="${card.card_id}" title="Passa il mouse per animare il Retro Puffin con Veo 3.1 • Clicca per girare">
                  <img class="mtg-back-img" src="${this.selectedBackImage}" alt="Puffin Card Back" loading="lazy" />
                  <video class="mtg-back-video" data-src="${PUFFIN_CARD_BACK.video_url}" muted loop playsinline preload="none"></video>
                  <span class="mtg-back-badge">✨ Hover = Veo 3.1 Magic • Clicca per girare</span>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      const inspectedCard = this.inspectedCardId ? getCardById(this.inspectedCardId) : null;
      const modalHtml = inspectedCard
        ? (() => {
            const rMeta = MTG_RARITY_INFO[inspectedCard.rarity] || MTG_RARITY_INFO.common;
            const own = ownershipMap[inspectedCard.card_id] || { totalCount: 0, byPlayer: {} };
            const isFlipped = this.flippedCardIds.has(inspectedCard.card_id);
            const inspectedMedia = resolveCardFrontMedia(inspectedCard);
            return `
              <div class="binder-modal-backdrop" data-close-modal="1">
                <div class="binder-modal-box" onclick="event.stopPropagation()">
                  <div class="mtg-card-scene ${isFlipped ? 'is-flipped' : ''} spoiler-on" data-card-id="${inspectedCard.card_id}" data-rarity="${inspectedCard.rarity}">
                    <div class="mtg-card-flipper">
                      <div class="mtg-face mtg-front">
                        <div class="mtg-holo-glare"></div>
                        <div class="mtg-header">
                          <span class="mtg-title">${inspectedCard.emoji} ${inspectedCard.title}</span>
                          <span class="mtg-game-pill">${inspectedCard.game_id}</span>
                        </div>
                        <div class="mtg-art-box" data-has-front-video="${inspectedMedia.hasFrontVideo ? '1' : '0'}" data-veo-mode="${inspectedMedia.veoMode}" data-music-url="${inspectedMedia.music_url || ''}">
                          <img class="mtg-art-img" src="${inspectedCard.image_url}" alt="${inspectedCard.title}" />
                          ${
                            inspectedMedia.hasFrontVideo
                              ? `<video class="mtg-front-video" data-src="${inspectedMedia.video_url}" ${inspectedMedia.video_muted ? 'muted' : ''} loop playsinline preload="none"></video><span class="mtg-veo-front-badge">${inspectedMedia.veoBadge}</span>`
                              : ''
                          }
                        </div>
                        <div class="mtg-type-bar">
                          <span>${inspectedCard.category}</span>
                          <span>${rMeta.gem} ${rMeta.label}</span>
                        </div>
                        <div class="mtg-lore-box">${inspectedCard.description}</div>
                        <div class="mtg-footer">
                          <span>Drop: ${rMeta.probabilityPct}</span>
                          <span class="mtg-pt-box">#${inspectedCard.number}</span>
                        </div>
                      </div>
                      <div class="mtg-face mtg-back" data-flip-card="${inspectedCard.card_id}">
                        <img class="mtg-back-img" src="${this.selectedBackImage}" alt="Puffin Card Back" />
                        <video class="mtg-back-video" data-src="${PUFFIN_CARD_BACK.video_url}" muted loop playsinline preload="none"></video>
                        <span class="mtg-back-badge">✨ Veo 3.1 Animated Card Back</span>
                      </div>
                    </div>
                  </div>
                  <div style="display:flex;flex-direction:column;justify-content:space-between;gap:0.8rem;">
                    <div>
                      <div style="font-size:0.75rem;color:#fde047;font-weight:900;text-transform:uppercase;">
                        ${rMeta.gem} ${rMeta.labelIt} • ID: <code>${inspectedCard.card_id}</code>
                      </div>
                      <h3 style="margin:0.25rem 0;font-size:1.35rem;">${inspectedCard.emoji} ${inspectedCard.title}</h3>
                      <p style="color:#cbd5e1;font-size:0.9rem;line-height:1.45;">${inspectedCard.description}</p>
                      <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.12);border-radius:0.75rem;padding:0.65rem;font-size:0.8rem;">
                        <div><b>🎲 Probabilità Base MTG:</b> ${rMeta.probabilityPct}</div>
                        <div style="margin-top:0.25rem;"><b>🛡️ Merit Gate:</b> ${rMeta.meritRule}</div>
                        <div style="margin-top:0.25rem;"><b>👨‍👩‍👧‍👦 Copie in Famiglia:</b> ${own.totalCount} totali</div>
                      </div>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                      <button type="button" class="binder-btn active" data-flip-card="${inspectedCard.card_id}">
                        🔄 Gira Carta (Fronte / Retro Veo 3.1)
                      </button>
                      <button type="button" class="binder-btn" data-play-audio="${inspectedCard.card_id}">
                        🔊 Ascolta Fanfara / Audio
                      </button>
                      <button type="button" class="binder-btn" data-close-modal="1">
                        ✖ Chiudi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          })()
        : '';

      this.$root.innerHTML = `
        <div class="binder-toolbar">
          <div class="binder-filters">
            <select class="binder-select" data-filter="player" aria-label="Filtra per Eroe">
              <option value="ALL" ${this.filterPlayer === 'ALL' ? 'selected' : ''}>👨‍👩‍👧‍👦 Tutti gli Eroi</option>
              <option value="riccardo" ${this.filterPlayer === 'riccardo' ? 'selected' : ''}>👑 Riccardo</option>
              <option value="kate" ${this.filterPlayer === 'kate' ? 'selected' : ''}>💜 Kate</option>
              <option value="ale" ${this.filterPlayer === 'ale' ? 'selected' : ''}>🐉 Ale</option>
              <option value="seby" ${this.filterPlayer === 'seby' ? 'selected' : ''}>🏎️ Seby</option>
              <option value="lucilla" ${this.filterPlayer === 'lucilla' ? 'selected' : ''}>🌸 Nonna Lucilla</option>
              <option value="guest" ${this.filterPlayer === 'guest' ? 'selected' : ''}>🐧 Guest</option>
            </select>
            <select class="binder-select" data-filter="game" aria-label="Filtra per Gioco">
              <option value="ALL" ${this.filterGame === 'ALL' ? 'selected' : ''}>🎮 Tutti i Giochi (${PUFFIN_CARDS_CATALOG.length})</option>
              ${gamesList
                .map(
                  (g) =>
                    `<option value="${g}" ${this.filterGame === g ? 'selected' : ''}>${g} (${getPuffinCardsCatalog({ game_id: g }).length})</option>`
                )
                .join('')}
            </select>
            <select class="binder-select" data-filter="rarity" aria-label="Filtra per Rarità MTG">
              <option value="ALL" ${this.filterRarity === 'ALL' ? 'selected' : ''}>💎 Tutte le Rarità MTG</option>
              <option value="mythic" ${this.filterRarity === 'mythic' ? 'selected' : ''}>🟠 Mythic Rare (1.5%)</option>
              <option value="rare" ${this.filterRarity === 'rare' ? 'selected' : ''}>🟡 Rare Gold (8.5%)</option>
              <option value="uncommon" ${this.filterRarity === 'uncommon' ? 'selected' : ''}>⚪ Uncommon Silver (25%)</option>
              <option value="common" ${this.filterRarity === 'common' ? 'selected' : ''}>⚫ Common Black (65%)</option>
            </select>
            <select class="binder-select" data-filter="ownership" aria-label="Filtra Collezionate">
              <option value="ALL" ${this.filterOwnership === 'ALL' ? 'selected' : ''}>📚 Tutte (Possedute + Mancanti)</option>
              <option value="OWNED" ${this.filterOwnership === 'OWNED' ? 'selected' : ''}>✅ Solo Possedute</option>
              <option value="MISSING" ${this.filterOwnership === 'MISSING' ? 'selected' : ''}>🔒 Solo Mancanti</option>
            </select>
            <select class="binder-select" data-filter="back-variant" aria-label="Stile Retro Carta">
              ${PUFFIN_CARD_BACK.variants
                .map(
                  (v) =>
                    `<option value="${v.image_url}" ${this.selectedBackImage === v.image_url ? 'selected' : ''}>🃏 Retro: ${v.label}</option>`
                )
                .join('')}
            </select>
            <button type="button" class="binder-btn ${this.showAllBacks ? 'active' : ''}" data-toggle-backs="1">
              🔄 ${this.showAllBacks ? 'Mostra Fronte Carte' : 'Gira Tutte sul Retro Puffin (Veo 3.1)'}
            </button>
            <button type="button" class="binder-btn ${this.backSoundEnabled ? 'active' : ''}" data-toggle-back-sfx="1" title="Attiva/Disattiva il suono opzionale (Esplosione Medieval-Futuristica & Grand Piano) sul Retro Carta">
              ${this.backSoundEnabled ? '🔊 Suono Retro: ON (⚔️🎹🚀)' : '🔇 Suono Retro: OFF'}
            </button>
          </div>
          <span class="binder-stats-pill">
            🃏 Sbloccate: ${ownedCount} / ${allCards.length} (${Math.round((ownedCount / Math.max(1, allCards.length)) * 100)}%)
          </span>
        </div>
        <div class="cards-grid">
          ${cardsHtml}
        </div>
        ${modalHtml}
      `;

      // Bind filter events
      this.$root.querySelectorAll('[data-filter]').forEach((sel) => {
        sel.addEventListener('change', () => {
          const kind = sel.getAttribute('data-filter');
          if (kind === 'player') this.filterPlayer = sel.value;
          else if (kind === 'game') this.filterGame = sel.value;
          else if (kind === 'rarity') this.filterRarity = sel.value;
          else if (kind === 'ownership') this.filterOwnership = sel.value;
          else if (kind === 'back-variant') this.selectedBackImage = sel.value;
          this.render();
        });
      });

      const toggleBacksBtn = this.$root.querySelector('[data-toggle-backs]');
      if (toggleBacksBtn) {
        toggleBacksBtn.addEventListener('click', () => {
          this.showAllBacks = !this.showAllBacks;
          if (this.showAllBacks && this.backSoundEnabled) {
            playCardBackExplosion({ force: true });
          }
          this.render();
        });
      }

      const toggleBackSfxBtn = this.$root.querySelector('[data-toggle-back-sfx]');
      if (toggleBackSfxBtn) {
        toggleBackSfxBtn.addEventListener('click', () => {
          this.backSoundEnabled = !this.backSoundEnabled;
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('puffin_card_back_sfx_v1', this.backSoundEnabled ? '1' : '0');
            }
          } catch {}
          if (this.backSoundEnabled) {
            playCardBackExplosion({ force: true });
          }
          this.render();
        });
      }

      this.$root.querySelectorAll('[data-flip-card]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cid = btn.getAttribute('data-flip-card');
          if (this.flippedCardIds.has(cid)) {
            this.flippedCardIds.delete(cid);
          } else {
            this.flippedCardIds.add(cid);
            if (this.backSoundEnabled) {
              playCardBackExplosion({ force: true });
            }
          }
          this.render();
        });
      });

      this.$root.querySelectorAll('[data-play-audio]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cid = btn.getAttribute('data-play-audio');
          playCardAudioOrFanfare(getCardById(cid));
        });
      });

      this.$root.querySelectorAll('[data-inspect-card]').forEach((box) => {
        box.addEventListener('click', () => {
          const cid = box.getAttribute('data-inspect-card');
          this.inspectedCardId = cid;
          playCardAudioOrFanfare(getCardById(cid));
          this.render();
        });
      });

      this.$root.querySelectorAll('[data-close-modal]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.inspectedCardId = null;
          this.render();
        });
      });

      // 3D pointer tilt on each card scene
      this.$root.querySelectorAll('.mtg-card-scene').forEach((scene) => {
        scene.addEventListener('mousemove', (ev) => {
          const rect = scene.getBoundingClientRect();
          const px = (ev.clientX - rect.left) / Math.max(1, rect.width);
          const py = (ev.clientY - rect.top) / Math.max(1, rect.height);
          const tiltY = ((px - 0.5) * 14).toFixed(2);
          const tiltX = ((0.5 - py) * 14).toFixed(2);
          scene.style.setProperty('--tilt-x', `${tiltX}deg`);
          scene.style.setProperty('--tilt-y', `${tiltY}deg`);
          scene.style.setProperty('--glare-x', `${Math.round(px * 100)}%`);
          scene.style.setProperty('--glare-y', `${Math.round(py * 100)}%`);
        });
        scene.addEventListener('mouseleave', () => {
          scene.style.setProperty('--tilt-x', '0deg');
          scene.style.setProperty('--tilt-y', '0deg');
        });
      });

      attachCardBackHoverVideo(this.$root, {
        isSoundEnabledFn: () => Boolean(this.backSoundEnabled),
      });
      attachCardFrontHoverVideo(this.$root, {
        isSoundEnabledFn: () => Boolean(this.backSoundEnabled),
        autoPlayAll: Boolean(this.inspectedCardId),
      });
    }
  };
}

/**
 * Promotes a `popover="manual"` host to the topmost slot of the browser's HTML5 Top Layer
 * so it ALWAYS renders ABOVE any `<dialog open>` (like Hall of Fame `.showModal()`) and ABOVE `dialog::backdrop`!
 */
function promoteHostToTopLayer(host) {
  if (!host || typeof host.showPopover !== 'function') return;
  try {
    if (!host.hasAttribute('popover')) {
      host.setAttribute('popover', 'manual');
    }
    if (host.matches(':popover-open')) {
      host.hidePopover();
    }
    host.showPopover();
  } catch {}
}

/**
 * Displays a celebratory MTG 3D Flip Card Reveal Spotlight when a player unlocks a card!
 * Renders in the HTML5 Top Layer (`popover="manual"`) ABOVE any `<dialog>` (e.g. Hall of Fame modal),
 * starting center-stage as a large Hero Card Reveal and allowing the user to dock it crisp & unblurred
 * right beside the Hall of Fame (`📌 Affianca alla Classifica`) or close it (`✨ Riscatta & Chiudi`).
 */
export function showPuffinCardRevealToast({
  card,
  ownership,
  isNew = true,
  meritDowngraded = false,
  startDocked = false,
} = {}) {
  if (typeof document === 'undefined' || !document.body || !card) return;
  const existing = document.getElementById('puffin-card-reveal-toast');
  if (existing) existing.remove();

  const rMeta = MTG_RARITY_INFO[card.rarity] || MTG_RARITY_INFO.common;
  const frontMedia = resolveCardFrontMedia(card);
  const host = document.createElement('div');
  host.id = 'puffin-card-reveal-toast';
  host.setAttribute('popover', 'manual');
  host.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:none;background:transparent;overflow:visible;pointer-events:none;z-index:2147483645;';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent =
    CARDS_CSS +
    `
    :host {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      pointer-events: none;
      z-index: 2147483645;
    }
    .reveal-stage-backdrop {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: radial-gradient(circle at center, ${rMeta.borderHex}33 0%, rgba(4, 7, 16, 0.82) 70%);
      backdrop-filter: blur(4px);
      pointer-events: auto;
      transition: all 0.38s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .reveal-stage-backdrop.is-docked {
      background: transparent;
      backdrop-filter: none;
      pointer-events: none;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 1.15rem;
    }
    .reveal-toast-wrap {
      position: relative;
      pointer-events: auto;
      width: min(92vw, 370px);
      background: linear-gradient(165deg, rgba(17, 24, 46, 0.99) 0%, rgba(8, 11, 24, 0.99) 100%);
      border: 2.5px solid ${rMeta.borderHex};
      border-radius: 1.35rem;
      padding: 1rem 1.05rem;
      box-shadow:
        0 28px 75px rgba(0, 0, 0, 0.95),
        0 0 48px ${rMeta.borderHex}88,
        inset 0 1px 0 rgba(255, 255, 255, 0.22);
      color: #f8fafc;
      font-family: 'Nunito', system-ui, sans-serif;
      animation: puffinHeroIn 0.42s cubic-bezier(0.22, 1, 0.36, 1);
      transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s ease, box-shadow 0.35s ease;
    }
    .reveal-stage-backdrop.is-docked .reveal-toast-wrap {
      width: min(88vw, 316px);
      padding: 0.85rem 0.9rem;
      box-shadow:
        0 22px 55px rgba(0, 0, 0, 0.95),
        0 0 34px ${rMeta.borderHex}77;
    }
    .reveal-toast-wrap .mtg-card-scene {
      height: 430px;
      transition: height 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .reveal-stage-backdrop.is-docked .reveal-toast-wrap .mtg-card-scene {
      height: 375px;
    }
    .reveal-toast-wrap .mtg-title {
      font-size: 0.92rem;
    }
    .reveal-toast-wrap .mtg-art-box {
      min-height: 195px;
    }
    .reveal-stage-backdrop.is-docked .reveal-toast-wrap .mtg-art-box {
      min-height: 162px;
    }
    .reveal-toast-wrap .mtg-lore-box {
      font-size: 0.78rem;
      line-height: 1.35;
      -webkit-line-clamp: 3;
    }
    .reveal-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
    }
    .reveal-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.82rem;
      font-weight: 900;
      color: #fde047;
      text-shadow: 0 2px 10px rgba(250, 204, 21, 0.45);
      letter-spacing: 0.02em;
    }
    .reveal-top-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .reveal-icon-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e2e8f0;
      border-radius: 0.55rem;
      padding: 0.24rem 0.52rem;
      font-size: 0.72rem;
      font-weight: 800;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .reveal-icon-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    .reveal-cta-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.7rem;
    }
    .reveal-cta-btn {
      flex: 1;
      border-radius: 0.75rem;
      padding: 0.55rem 0.7rem;
      font-size: 0.78rem;
      font-weight: 900;
      cursor: pointer;
      border: 1.5px solid rgba(255, 255, 255, 0.22);
      transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
    }
    .reveal-cta-btn:hover {
      transform: translateY(-1px);
      filter: brightness(1.08);
    }
    .reveal-cta-btn.primary {
      background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
      color: #0f172a;
      border-color: #fef08a;
      box-shadow: 0 6px 18px rgba(250, 204, 21, 0.35);
    }
    .reveal-cta-btn.secondary {
      background: rgba(30, 41, 59, 0.9);
      color: #e2e8f0;
    }
    @keyframes puffinHeroIn {
      from { transform: translateY(22px) scale(0.88); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `;
  shadow.append(style);

  const count = ownership?.count || 1;
  const ptLabel = card.stats ? `⚔️${card.stats.atk}/🛡️${card.stats.def} • #${card.number}` : `#${card.number}`;
  const stage = document.createElement('div');
  stage.className = `reveal-stage-backdrop${startDocked ? ' is-docked' : ''}`;
  stage.id = 'reveal-stage-backdrop';

  const box = document.createElement('div');
  box.className = 'reveal-toast-wrap';
  box.innerHTML = `
    <div class="reveal-header-bar">
      <span class="reveal-badge-pill">
        ${isNew ? '✨ NUOVA CARTA MAGIC SBLOCCATA!' : `🃏 CARTA DOPPIONE (x${count})!`}
      </span>
      <div class="reveal-top-actions">
        <button type="button" class="reveal-icon-btn" id="open-album-toast-btn" title="Apri il tuo Album delle Carte Magic collezionate!">🃏 Album</button>
        <button type="button" class="reveal-icon-btn" id="flip-toast-card" title="Gira Fronte / Retro Puffin">🔄 Gira</button>
        <button type="button" class="reveal-icon-btn" id="close-toast" title="Chiudi">✖</button>
      </div>
    </div>
    <div class="mtg-card-scene is-flipped spoiler-on" id="reveal-scene" data-rarity="${card.rarity}">
      <div class="mtg-card-flipper">
        <div class="mtg-face mtg-front">
          <div class="mtg-holo-glare"></div>
          <div class="mtg-header">
            <span class="mtg-title">${card.emoji} ${card.title}</span>
            <span class="mtg-game-pill">${card.game_id}</span>
          </div>
          <div class="mtg-art-box" data-has-front-video="${frontMedia.hasFrontVideo ? '1' : '0'}" data-veo-mode="${frontMedia.veoMode}" data-music-url="${frontMedia.music_url || ''}">
            <img class="mtg-art-img" src="${card.image_url}" alt="${card.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
            <div class="mtg-art-fallback" style="display:none;">${card.emoji}</div>
            ${
              frontMedia.hasFrontVideo
                ? `<video class="mtg-front-video" data-src="${frontMedia.video_url}" ${frontMedia.video_muted ? 'muted' : ''} loop playsinline preload="none"></video><span class="mtg-veo-front-badge">${frontMedia.veoBadge}</span>`
                : ''
            }
          </div>
          <div class="mtg-type-bar">
            <span>${card.category}</span>
            <span>${rMeta.gem} ${rMeta.label}</span>
          </div>
          <div class="mtg-lore-box">${card.description}</div>
          <div class="mtg-footer">
            <span>Copie: x${count}</span>
            <span class="mtg-pt-box">${ptLabel}</span>
          </div>
        </div>
        <div class="mtg-face mtg-back">
          <img class="mtg-back-img" src="${PUFFIN_CARD_BACK.image_url}" alt="Puffin Card Back" />
          <video class="mtg-back-video" data-src="${PUFFIN_CARD_BACK.video_url}" muted loop playsinline preload="none"></video>
        </div>
      </div>
    </div>
    ${
      meritDowngraded
        ? `<div style="margin-top:0.45rem;font-size:0.68rem;color:#cbd5e1;">🛡️ Merit Gate: gioca a difficoltà Media/Difficile per sbloccare Rare/Mythic!</div>`
        : ''
    }
    <div class="reveal-cta-row">
      <button type="button" class="reveal-cta-btn secondary" id="dock-toast-btn">
        ${startDocked ? '🔍 Ingrandisci al Centro' : '📌 Affianca alla Classifica'}
      </button>
      <button type="button" class="reveal-cta-btn primary" id="claim-toast-btn">
        ✨ Riscatta Carta!
      </button>
    </div>
  `;
  stage.appendChild(box);
  shadow.append(stage);
  document.body.appendChild(host);

  // Promote immediately + re-promote after any <dialog>.showModal() (e.g. Hall of Fame on Game Over!)
  promoteHostToTopLayer(host);
  const repromoteTimers = [80, 260, 650, 1200].map((ms) =>
    setTimeout(() => {
      if (host.isConnected) promoteHostToTopLayer(host);
    }, ms)
  );

  playCardAudioOrFanfare(card);
  attachCardBackHoverVideo(box);
  attachCardFrontHoverVideo(box, { autoPlayAll: true });

  setTimeout(() => {
    const scene = box.querySelector('#reveal-scene');
    if (scene) scene.classList.remove('is-flipped');
  }, 420);

  const sceneEl = box.querySelector('#reveal-scene');
  box.querySelector('#flip-toast-card')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sceneEl?.classList.toggle('is-flipped');
  });
  sceneEl?.addEventListener('click', () => {
    sceneEl.classList.toggle('is-flipped');
  });

  const dockBtn = box.querySelector('#dock-toast-btn');
  const toggleDockMode = () => {
    const nowDocked = stage.classList.toggle('is-docked');
    if (dockBtn) {
      dockBtn.textContent = nowDocked ? '🔍 Ingrandisci al Centro' : '📌 Affianca alla Classifica';
    }
  };
  dockBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDockMode();
  });

  // Clicking on the dark backdrop outside the card docks it beside the Hall of Fame so you can see both!
  stage.addEventListener('click', (e) => {
    if (e.target === stage && !stage.classList.contains('is-docked')) {
      toggleDockMode();
    }
  });

  const cleanupAndClose = () => {
    repromoteTimers.forEach((t) => clearTimeout(t));
    stopMythicCardMusic();
    try {
      if (typeof host.hidePopover === 'function' && host.matches(':popover-open')) {
        host.hidePopover();
      }
    } catch {}
    host.remove();
  };

  box.querySelector('#close-toast')?.addEventListener('click', cleanupAndClose);
  box.querySelector('#claim-toast-btn')?.addEventListener('click', cleanupAndClose);
  box.querySelector('#open-album-toast-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    cleanupAndClose();
    if (typeof window !== 'undefined' && window.PuffinLogin && typeof window.PuffinLogin.openCards === 'function') {
      window.PuffinLogin.openCards({ gameId: card.game_id });
    } else if (typeof window !== 'undefined') {
      window.open('./cards.html', '_blank', 'noopener');
    }
  });

  // After 9s in center Hero mode, gently dock beside the Hall of Fame instead of disappearing abruptly!
  setTimeout(() => {
    if (host.isConnected && !stage.classList.contains('is-docked')) {
      stage.classList.add('is-docked');
      if (dockBtn) dockBtn.textContent = '🔍 Ingrandisci al Centro';
    }
  }, 9000);
}

/**
 * Displays an interactive 3-Card Game Booster Pack Draft Modal ("Scegli 1 Carta dal Pacco di `<game_id>`!")
 * when a match finishes or when opening a game booster pack.
 */
export function showPuffinBoosterDraftModal({
  packResult,
  onPick = () => {},
} = {}) {
  if (typeof document === 'undefined' || !document.body || !packResult) return null;
  const existing = document.getElementById('puffin-booster-draft-modal');
  if (existing) existing.remove();

  const choices = Array.isArray(packResult.choices) ? packResult.choices : [];
  if (choices.length === 0) return null;

  const isJackpot98 = Boolean(packResult.isJackpot98);
  const host = document.createElement('div');
  host.id = 'puffin-booster-draft-modal';
  host.setAttribute('popover', 'manual');
  host.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:none;background:transparent;overflow:visible;z-index:2147483646;';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent =
    CARDS_CSS +
    `
    .draft-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100001;
      background: rgba(5, 8, 18, 0.9);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      font-family: 'Nunito', system-ui, sans-serif;
      color: #f8fafc;
    }
    .draft-box {
      background: linear-gradient(160deg, #161d36 0%, #090d1b 100%);
      border: 2.5px solid ${isJackpot98 ? '#ff6d00' : '#facc15'};
      border-radius: 1.4rem;
      max-width: 880px;
      width: 100%;
      padding: 1.25rem;
      box-shadow: 0 28px 72px rgba(0, 0, 0, 0.92), 0 0 38px ${isJackpot98 ? 'rgba(255, 109, 0, 0.55)' : 'rgba(250, 204, 21, 0.35)'};
    }
    .draft-cards-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .draft-slot {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .draft-pick-btn {
      width: 100%;
      background: linear-gradient(135deg, #ea580c, #d97706);
      color: #fff;
      border: 1.5px solid #fde047;
      border-radius: 0.75rem;
      padding: 0.55rem 0.8rem;
      font-weight: 900;
      font-size: 0.82rem;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .draft-pick-btn:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 22px rgba(249, 115, 22, 0.6);
    }
  `;
  shadow.append(style);

  const slotsHtml = choices
    .map((choice, idx) => {
      const card = choice.card;
      const rMeta = MTG_RARITY_INFO[card.rarity] || MTG_RARITY_INFO.common;
      const frontMedia = resolveCardFrontMedia(card);
      const ptLabel = card.stats
        ? `⚔️${card.stats.atk}/🛡️${card.stats.def}`
        : `#${card.number} • ${rMeta.probabilityPct}`;
      return `
        <div class="draft-slot">
          <div class="mtg-card-scene is-flipped spoiler-on" data-draft-idx="${idx}" data-rarity="${card.rarity}">
            <div class="mtg-card-flipper">
              <div class="mtg-face mtg-front">
                <div class="mtg-holo-glare"></div>
                <div class="mtg-header">
                  <span class="mtg-title">${card.emoji} ${card.title}</span>
                  <span class="mtg-game-pill">${card.game_id}</span>
                </div>
                <div class="mtg-art-box" data-has-front-video="${frontMedia.hasFrontVideo ? '1' : '0'}" data-veo-mode="${frontMedia.veoMode}" data-music-url="${frontMedia.music_url || ''}">
                  <img class="mtg-art-img" src="${card.image_url}" alt="${card.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                  <div class="mtg-art-fallback" style="display:none;">${card.emoji}</div>
                  ${
                    frontMedia.hasFrontVideo
                      ? `<video class="mtg-front-video" data-src="${frontMedia.video_url}" ${frontMedia.video_muted ? 'muted' : ''} loop playsinline preload="none"></video><span class="mtg-veo-front-badge">${frontMedia.veoBadge}</span>`
                      : ''
                  }
                </div>
                <div class="mtg-type-bar">
                  <span>${card.category}</span>
                  <span>${rMeta.gem} ${rMeta.labelIt}</span>
                </div>
                <div class="mtg-lore-box">${card.description}</div>
                <div class="mtg-footer">
                  <span>Opzione #${idx + 1}</span>
                  <span class="mtg-pt-box">${ptLabel}</span>
                </div>
              </div>
              <div class="mtg-face mtg-back">
                <img class="mtg-back-img" src="${PUFFIN_CARD_BACK.image_url}" alt="Puffin Card Back" />
                <video class="mtg-back-video" data-src="${PUFFIN_CARD_BACK.video_url}" muted loop playsinline preload="none"></video>
                <span class="mtg-back-badge">✨ Pacco ${packResult.game_id} #${idx + 1}</span>
              </div>
            </div>
          </div>
          <button type="button" class="draft-pick-btn" data-pick-idx="${idx}">
            ✨ Scegli "${card.title}" (${rMeta.gem} ${rMeta.labelIt})
          </button>
        </div>
      `;
    })
    .join('');

  const wrap = document.createElement('div');
  wrap.className = 'draft-backdrop';
  wrap.innerHTML = `
    <div class="draft-box">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
        <div>
          <div style="font-size:0.76rem;font-weight:900;color:${isJackpot98 ? '#fb923c' : '#fde047'};text-transform:uppercase;letter-spacing:0.06em;">
            ${
              isJackpot98
                ? `🔥🎉 COLPO GOBBO DELLA ${packResult.matchNumber}ª PARTITA! RARA / SUPER RARA SBLOCCATA!`
                : `🎁 Pacco Fine Partita (${packResult.game_id}) • Partita #${packResult.matchNumber} (Mancano ${packResult.matchesUntilJackpot98} partite al Jackpot della 98ª!)`
            }
          </div>
          <h2 style="margin:0.25rem 0 0.2rem;font-size:1.3rem;">
            🃏 Scegli 1 Carta dal Pacco di <code style="color:#fde047;">${packResult.game_id}</code>!
          </h2>
          <p style="margin:0;font-size:0.84rem;color:#cbd5e1;">
            Ogni partita completata ti apre un pacchetto di <b>${packResult.game_id}</b>: nelle prime 97 partite trovi soprattutto Comuni (doppioni!), ma alla <b>98ª partita</b> scatta il Colpo Gobbo Rara / Super Rara Mitica!
          </p>
        </div>
        <button type="button" id="close-draft" style="background:none;border:none;color:#94a3b8;font-size:1.2rem;cursor:pointer;font-weight:900;">✖</button>
      </div>
      <div class="draft-cards-row">
        ${slotsHtml}
      </div>
    </div>
  `;
  shadow.append(wrap);
  document.body.appendChild(host);
  promoteHostToTopLayer(host);
  [80, 260, 650].forEach((ms) =>
    setTimeout(() => {
      if (host.isConnected) promoteHostToTopLayer(host);
    }, ms)
  );

  if (isJackpot98) {
    playCardBackExplosion({ force: true });
  } else {
    playCardAudioOrFanfare(choices[0].card);
  }
  attachCardBackHoverVideo(wrap);
  attachCardFrontHoverVideo(wrap, { autoPlayAll: isJackpot98 });

  // Flip all 3 cards face-up with a staggered cascade
  choices.forEach((_, idx) => {
    setTimeout(() => {
      const scene = wrap.querySelector(`[data-draft-idx="${idx}"]`);
      if (scene) scene.classList.remove('is-flipped');
    }, 340 + idx * 180);
  });

  const closeDraft = () => {
    stopMythicCardMusic();
    try {
      if (typeof host.hidePopover === 'function' && host.matches(':popover-open')) {
        host.hidePopover();
      }
    } catch {}
    host.remove();
  };

  wrap.querySelectorAll('[data-pick-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-pick-idx')) || 0;
      const picked = choices[idx] || choices[0];
      closeDraft();
      onPick(picked);
    });
  });

  wrap.querySelector('#close-draft')?.addEventListener('click', closeDraft);
  return host;
}
