/**
 * 🐧 PuffinLogin (`src/puffin-login.js`) — v2.0.0
 *
 * Mandatory Family Login Gate (`identity = NULL` until login), Compact 6-Hero Selector,
 * Bilingual EN/IT Skin, Cutie `X X X X` PIN Pad (with 3-Strike Jam), and Top-10 Hall of Fame.
 *
 * Key UX Rules:
 * 1. MANDATORY LOGIN (`identity = NULL` by default):
 *    - Until the user explicitly logs in (via password, 4-digit PIN, or 1-click Guest),
 *      `getCurrentUser()` returns `null` (`isLoggedIn() === false`), the login modal opens
 *      automatically, and the game cannot be played.
 * 2. MINIMALIST TOP-RIGHT BADGE:
 *    - Shows ONLY the Avatar Icon (95% face at rest, tiny RPG body on hover) + Name (`Seby`, `Ale`, `Kate`...).
 *    - No emoji, no subtitle! When `identity === null`, shows `[🔒] Log in` / `[🔒] Login`.
 * 3. WRONG PASSWORD / PIN GUIDANCE + 3-STRIKE JAM:
 *    - EN: "❌ Wrong password — choose Guest if you don't know it!"
 *    - IT: "❌ Password sbagliata — scegli Ospite se non la sai!"
 *    - Includes a 1-click "🐧 Play as Guest" button right below the error when Guest is allowed.
 * 4. BILINGUAL `EN` & `IT` SKIN (`lang="en"` | `lang="it"`):
 *    - Instant toggle between English (`🇬🇧 EN`) and Italian (`🇮🇹 IT`) in the modal header.
 */

import {
  PUFFIN_CARD_BACK,
  MTG_RARITY_INFO,
  PUFFIN_CARDS_CATALOG,
  DEFAULT_DUMMY_USER_CARDS,
  normalizeCardRarity,
  normalizeCardId,
  cardIdToFirestoreDocId,
  getPuffinCardsCatalog,
  getCardById,
  resolveCardFrontMedia,
  JACKPOT_MATCH_INTERVAL,
  getGamePackCounter,
  setGamePackCounter,
  incrementGamePackCounter,
  rollPuffinCardDrop,
  rollGameBoosterPack,
  validateAndNormalizeUserCardRecord,
  buildCardsOwnershipMap,
  computeFamilyInsights as computeFamilyInsightsRaw,
  compareFamilyRivals,
  playCardAudioOrFanfare,
  playCardBackExplosion,
  playMythicCardMusic,
  stopMythicCardMusic,
  attachCardFrontHoverVideo,
  createPuffinCardsElementClass,
  showPuffinCardRevealToast,
  showPuffinBoosterDraftModal,
} from './puffin-cards.js';

export {
  PUFFIN_CARD_BACK,
  MTG_RARITY_INFO,
  PUFFIN_CARDS_CATALOG,
  DEFAULT_DUMMY_USER_CARDS,
  normalizeCardRarity,
  normalizeCardId,
  cardIdToFirestoreDocId,
  getPuffinCardsCatalog,
  getCardById,
  resolveCardFrontMedia,
  JACKPOT_MATCH_INTERVAL,
  getGamePackCounter,
  setGamePackCounter,
  incrementGamePackCounter,
  rollPuffinCardDrop,
  rollGameBoosterPack,
  validateAndNormalizeUserCardRecord,
  buildCardsOwnershipMap,
  compareFamilyRivals,
  playCardAudioOrFanfare,
  playCardBackExplosion,
  playMythicCardMusic,
  stopMythicCardMusic,
  attachCardFrontHoverVideo,
  showPuffinCardRevealToast,
  showPuffinBoosterDraftModal,
};

export const PUFFIN_LOGIN_VERSION = '2.1.0';
export const PUFFIN_SALT = 'puffin-salt-2026';
export const PUFFIN_OFFLINE_SEED = 'puffin-airplane-seed-2026';
export const DEFAULT_CLOUD_API_URL = 'https://puffin-login-932724269481.europe-west1.run.app/v1';

/**
 * Pure-JS RFC 1321 MD5 hex digest (`md5Hex(str)`).
 * Zero external dependencies — works synchronously in ANY browser, WebView, `file://`,
 * non-HTTPS LAN (`http://192.168.x.x`), Airplane Mode, or Node.js without `crypto.subtle`.
 */
export function md5Hex(str) {
  const utf8 = new TextEncoder().encode(String(str ?? ''));
  const bitLen = utf8.length * 8;
  const padLen = ((56 - ((utf8.length + 1) % 64)) + 64) % 64;
  const buf = new Uint8Array(utf8.length + 1 + padLen + 8);
  buf.set(utf8);
  buf[utf8.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(buf.length - 8, bitLen >>> 0, true);
  view.setUint32(buf.length - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < buf.length; offset += 64) {
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F;
      let g;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      const M = view.getUint32(offset + g * 4, true);
      F = (F + A + K[i] + M) >>> 0;
      A = D;
      D = C;
      C = B;
      const rot = ((F << S[i]) | (F >>> (32 - S[i]))) >>> 0;
      B = (B + rot) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return Array.from(out)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes seeded local MD5 digest `MD5("<seed>:<userId>:<plainSecret>")`
 * for offline / Airplane Mode authentication without plaintext passwords.
 */
export function computePuffinSecretMd5(userId, plainSecret, seed = PUFFIN_OFFLINE_SEED) {
  const cleanUser = String(userId || '').trim().toLowerCase();
  const cleanSec = String(plainSecret || '').trim();
  const cleanSeed = String(seed || PUFFIN_OFFLINE_SEED).trim();
  return md5Hex(`${cleanSeed}:${cleanUser}:${cleanSec}`);
}

/**
 * Computes salted SHA-256 hex digest `SHA-256("puffin-salt-2026:<userId>:<plainSecret>")`
 * using WebCrypto (`crypto.subtle.digest`) so plaintext passwords NEVER appear in client code
 * (safe for public GitHub Pages repos like `palladius/demo-snake`!).
 */
export async function computePuffinSecretHash(userId, plainSecret) {
  const input = `${PUFFIN_SALT}:${String(userId || '').trim().toLowerCase()}:${String(plainSecret || '').trim()}`;
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const buf = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  try {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(input).digest('hex');
  } catch {
    return computePuffinSecretMd5(userId, plainSecret, PUFFIN_OFFLINE_SEED);
  }
}

export const PUFFIN_PROFILES = Object.freeze([
  {
    id: 'riccardo',
    aliases: ['papino', 'ricc'],
    displayName: 'Papino Riccardo',
    displayNameEn: 'Dad Riccardo',
    shortName: 'Riccardo',
    rpgClass: 'Paladin',
    emoji: '👑',
    role: 'adult',
    authType: 'password',
    secretMd5: '2cddba842da10bf318eb1bc37238c788',
    secretHash: 'bbad2523d48656e6eac389d4e69455244258b9be4c206dcf1cd1c9ac6cadc8f8',
    email: 'palladiusbonton@gmail.com',
    colorName: 'Giallo',
    colorHex: '#FACC15',
    glowHex: 'rgba(250, 204, 21, 0.45)',
    avatar: 'assets/avatars/riccardo.png',
    video: 'assets/avatars/riccardo.mp4',
    faceFocusY: '26%',
  },
  {
    id: 'kate',
    aliases: ['mamma'],
    displayName: 'Mamma Kate',
    displayNameEn: 'Mum Kate',
    shortName: 'Kate',
    rpgClass: 'Archmage',
    emoji: '💜',
    role: 'adult',
    authType: 'password',
    secretMd5: '6b1268fa3ea254dadd3071a7b54faafa',
    secretHash: 'cc931f6c000b1450f5c5dd66c9fa43c602786a1bed164311b17a11900521f679',
    email: 'kateknight1981@gmail.com',
    colorName: 'Viola',
    colorHex: '#A855F7',
    glowHex: 'rgba(168, 85, 247, 0.45)',
    avatar: 'assets/avatars/kate.png',
    video: 'assets/avatars/kate.mp4',
    faceFocusY: '25%',
  },
  {
    id: 'ale',
    aliases: ['alessandro'],
    displayName: 'Alessandro (Ale)',
    displayNameEn: 'Alessandro (Ale)',
    shortName: 'Ale',
    rpgClass: 'Dragon Ranger',
    emoji: '🐉',
    role: 'kid',
    authType: 'pin4',
    secretMd5: '25e95e98b024e8b502506007b2bb4dc7',
    secretHash: 'ac05dc85bcc7ab7b461a3c9f029d602d40e271715b131474282cef104ee19d23',
    email: 'alessandrocarlesso18@gmail.com',
    colorName: 'Rosso',
    colorHex: '#EF4444',
    glowHex: 'rgba(239, 68, 68, 0.45)',
    avatar: 'assets/avatars/ale.png',
    video: 'assets/avatars/ale.mp4',
    faceFocusY: '24%',
  },
  {
    id: 'seby',
    aliases: ['sebi', 'sebastian'],
    displayName: 'Sebastian (Seby)',
    displayNameEn: 'Sebastian (Seby)',
    shortName: 'Seby',
    rpgClass: 'Speedster Knight',
    emoji: '🏎️',
    role: 'kid',
    authType: 'pin4',
    secretMd5: 'b2486a0c46a84434ffde2c45c25b95b5',
    secretHash: 'c1052cf2c1eba8d67b240680e47243cb13e5f43a05e4fcbb33f72206f02266e6',
    email: 'sebastiancarlesso20@gmail.com',
    colorName: 'Blu',
    colorHex: '#3B82F6',
    glowHex: 'rgba(59, 130, 246, 0.45)',
    avatar: 'assets/avatars/seby.png',
    video: 'assets/avatars/seby.mp4',
    faceFocusY: '24%',
  },
  {
    id: 'lucilla',
    aliases: ['nonna', 'nonnalucilla'],
    displayName: 'Nonna Lucilla',
    displayNameEn: 'Grandma Lucilla',
    shortName: 'Nonna',
    rpgClass: 'Owl Bard',
    emoji: '🌸',
    role: 'adult',
    authType: 'password',
    secretMd5: '0cf77e476d15ef8a1a9fd2e370bf4f8f',
    secretHash: '01e66314c5c31aeda5ba8861abbbe79c31498fb76a31599cfd54c59f163c78d4',
    email: 'lucillagennari@gmail.com',
    colorName: 'Rosa',
    colorHex: '#EC4899',
    glowHex: 'rgba(236, 72, 153, 0.45)',
    avatar: 'assets/avatars/lucilla.png',
    video: 'assets/avatars/lucilla.mp4',
    faceFocusY: '26%',
  },
  {
    id: 'guest',
    aliases: ['ospite'],
    displayName: 'Guest / Ospite',
    displayNameEn: 'Guest',
    shortName: 'Guest',
    rpgClass: 'Puffin Rogue',
    emoji: '🐧',
    role: 'guest',
    authType: 'none',
    secretMd5: '',
    secretHash: '',
    email: '',
    colorName: 'Grigio',
    colorHex: '#9CA3AF',
    glowHex: 'rgba(156, 163, 175, 0.40)',
    avatar: 'assets/avatars/guest.png',
    video: 'assets/avatars/guest.mp4',
    faceFocusY: '25%',
  },
  {
    id: 'saga',
    aliases: ['gemini', 'uat', 'bot', 'agy', 'saga-gemini'],
    displayName: 'bot (Saga di Gemini UAT)',
    displayNameEn: 'bot (Gemini Saga UAT)',
    shortName: 'bot',
    rpgClass: 'Gold Saint Bot • UAT',
    emoji: '♊',
    role: 'bot',
    authType: 'password',
    secretMd5: 'e000aa67704291aed594d0daadf5c10a',
    secretHash: '5ac3918812d0e665b215336daca02dea39b9908ae3169b2cc2e7774c50706893',
    email: 'palladiusbonton+saga-uat@gmail.com',
    colorName: 'Ciano Cosmo',
    colorHex: '#22D3EE',
    glowHex: 'rgba(34, 211, 238, 0.45)',
    avatar: 'assets/avatars/saga.png',
    video: 'assets/avatars/saga.mp4',
    faceFocusY: '26%',
  },
]);

export const NULL_PLAYER_PROFILE = Object.freeze({
  id: null,
  aliases: [],
  displayName: 'Guest',
  shortName: 'Guest',
  rpgClass: 'Mystery Wanderer',
  emoji: '',
  role: 'null',
  authType: 'none',
  colorName: 'Slate',
  colorHex: '#9CA3AF',
  glowHex: 'rgba(156, 163, 175, 0.35)',
  avatar: 'assets/avatars/guest.png',
  faceFocusY: '25%',
});

export const I18N = Object.freeze({
  en: {
    badgeLogin: 'Log in',
    modalTitle: "Who's playing?",
    modalSub: '',
    logoutBtn: 'Logout',
    tabLogin: 'Players',
    tabScores: 'High Scores',
    tabCards: 'Magic Cards',
    tabRing: 'Puffin Ring',
    scopeCurrentGame: (gameId) => `🎮 This Game (${gameId})`,
    scopeAllGames: '🌍 All Games (Global Ring)',
    dockScoresBtn: '🏆 Top 10 High Scores',
    dockCardsBtn: '🃏 Magic Cards Album',
    dockRingBtn: (count) => `🔥💍 Puffin Ring (${count} Games)`,
    offlineBannerTitle: '⚠️✈️ Airplane / Offline Mode Active (Local MD5 + Seed)',
    offlineBannerBody: (seed) =>
      `Internet unreachable: authenticating locally with MD5 + seed (${seed}). Scores are saved in local outbox and will sync when back online!`,
    welcomeOfflineMsg: (name, seed) =>
      `Welcome ${name}! ⚠️✈️ Logged in offline via local MD5 + seed (${seed}).`,
    attemptsLabel: (used, max, left) => `${left} tries left`,
    jammedPill: (sec) => `JAMMED (${sec}s)`,
    pwdPlaceholder: (name) => `${name}'s password...`,
    enterBtn: 'Log in',
    forgotLink: (email) => `Forgot password? Email ${email}`,
    wrongPwdGuest: "Wrong password - choose Guest if you don't know it",
    wrongPinGuest: "Wrong password - choose Guest if you don't know it",
    wrongPwdNoGuest: 'Wrong password! Try again.',
    wrongPinNoGuest: 'Wrong PIN! Try again.',
    playAsGuestBtn: 'Play as Guest',
    playAsGuestNamedBtn: (name) => `Play as Guest (${name})`,
    guestNameLabel: '🏆 Bragging Rights! Optional friend name:',
    guestNamePlaceholder: 'e.g. Paolo (optional)',
    jamTitlePin: 'KEYPAD JAMMED! (3+ wrong tries)',
    jamTitlePwd: 'LOGIN JAMMED! (3+ wrong tries)',
    jamBody: (sec) =>
      `Wrong password 3 times (${sec}s). Choose Guest if you don't know it:`,
    unjamBtn: 'Unjam',
    welcomeMsg: (name) => `Welcome ${name}!`,
    sendingEmail: (email) => `Sending to ${email}...`,
    sentEmail: (email) => `Sent to ${email}!`,
  },
  it: {
    badgeLogin: 'Login',
    modalTitle: 'Chi gioca?',
    modalSub: '',
    logoutBtn: 'Esci',
    tabLogin: 'Giocatori',
    tabScores: 'High Scores',
    tabCards: 'Carte Magic',
    tabRing: 'Puffin Ring',
    scopeCurrentGame: (gameId) => `🎮 Questo Gioco (${gameId})`,
    scopeAllGames: '🌍 Tutti i Giochi (Global Ring)',
    dockScoresBtn: '🏆 Top 10 High Scores',
    dockCardsBtn: '🃏 Album Carte Magic',
    dockRingBtn: (count) => `🔥💍 Puffin Ring (${count} Giochi)`,
    offlineBannerTitle: '⚠️✈️ Modalità Aereo / Offline Attiva (MD5 + Seed Locale)',
    offlineBannerBody: (seed) =>
      `Internet non disponibile: autenticazione locale attiva tramite MD5 + seed (${seed}). I punteggi sono salvati in locale e verranno sincronizzati al ritorno online!`,
    welcomeOfflineMsg: (name, seed) =>
      `Ciao ${name}! ⚠️✈️ Login effettuato offline con MD5 + seed locale (${seed}).`,
    attemptsLabel: (used, max, left) => `${left} tentativi`,
    jammedPill: (sec) => `INCAGLIATO (${sec}s)`,
    pwdPlaceholder: (name) => `Password di ${name}...`,
    enterBtn: 'Entra',
    forgotLink: (email) => `Password dimenticata? Invia a ${email}`,
    wrongPwdGuest: 'Password sbagliata - scegli Ospite se non la sai',
    wrongPinGuest: 'Password sbagliata - scegli Ospite se non la sai',
    wrongPwdNoGuest: 'Password sbagliata! Riprova.',
    wrongPinNoGuest: 'PIN sbagliato! Riprova.',
    playAsGuestBtn: 'Gioca come Ospite',
    playAsGuestNamedBtn: (name) => `Gioca come Ospite (${name})`,
    guestNameLabel: '🏆 Bragging Rights! Nome amico opzionale:',
    guestNamePlaceholder: 'es. Paolo (opzionale)',
    jamTitlePin: 'TASTIERINO INCAGLIATO! (3+ errori)',
    jamTitlePwd: 'LOGIN JAMMED! (3+ errori)',
    jamBody: (sec) =>
      `Hai sbagliato 3 volte (${sec}s). Scegli Ospite se non la sai:`,
    unjamBtn: 'Sblocca',
    welcomeMsg: (name) => `Ciao ${name}!`,
    sendingEmail: (email) => `Invio a ${email}...`,
    sentEmail: (email) => `Inviata a ${email}!`,
  },
});

export const STORAGE_KEYS = Object.freeze({
  AUTH: 'puffin_auth_v2',
  AUTH_SLOTS: 'puffin_auth_slots_v1',
  LOGINS: 'puffin_logins_v1',
  LANG: 'puffin_lang_v1',
  SCORES: 'puffin_scores_v2',
  DELETED_SCORES: 'puffin_deleted_scores_v1',
  STATES: 'puffin_states_v1',
  OUTBOX: 'puffin_outbox_v1',
  LOCKOUT: 'puffin_lockout_v1',
  CARDS: 'puffin_cards_v1',
  GUEST_NAME: 'puffin_guest_name_v1',
  GUEST_NAME_SLOTS: 'puffin_guest_name_slots_v1',
  OFFLINE_SEED: 'puffin_offline_seed_v1',
  AIRPLANE_MODE: 'puffin_airplane_mode_v1',
});

export function normalizePlayerSlot(rawSlot) {
  if (rawSlot === null || rawSlot === undefined) return null;
  const clean = String(rawSlot).trim().toLowerCase();
  if (!clean || clean === 'null' || clean === 'default' || clean === 'single') return null;
  if (
    clean === '1' ||
    clean === 'player1' ||
    clean === 'player-1' ||
    clean === 'player_1' ||
    clean === 'left'
  ) {
    return 'p1';
  }
  if (
    clean === '2' ||
    clean === 'player2' ||
    clean === 'player-2' ||
    clean === 'player_2' ||
    clean === 'right'
  ) {
    return 'p2';
  }
  if (clean === '3' || clean === 'player3' || clean === 'player-3' || clean === 'player_3') {
    return 'p3';
  }
  if (clean === '4' || clean === 'player4' || clean === 'player-4' || clean === 'player_4') {
    return 'p4';
  }
  return clean.replace(/[^a-z0-9_-]/g, '').slice(0, 16) || null;
}

export function buildCanonicalH2HKey(playerAId, playerBId, guestNameA = null, guestNameB = null) {
  const normOne = (rawId, rawGuest) => {
    const pid = normalizeProfileId(rawId, true);
    if (!pid) return 'null';
    if (pid === 'guest') {
      const gn = normalizeGuestName(rawGuest);
      return gn ? `guest:${gn.toLowerCase()}` : 'guest';
    }
    return pid;
  };
  const a = normOne(playerAId, guestNameA);
  const b = normOne(playerBId, guestNameB);
  return [a, b].sort().join('__vs__');
}

export const DEFAULT_OFFLINE_SEED_BUNDLE = Object.freeze({
  version: '1.0.0',
  seed: PUFFIN_OFFLINE_SEED,
  salt: PUFFIN_SALT,
  algorithm: 'md5(seed:userId:secret)',
  fallbackWarning: {
    it: I18N.it.offlineBannerBody(PUFFIN_OFFLINE_SEED),
    en: I18N.en.offlineBannerBody(PUFFIN_OFFLINE_SEED),
  },
  profiles: Object.freeze(
    Object.fromEntries(
      PUFFIN_PROFILES.map((p) => [
        p.id,
        Object.freeze({
          id: p.id,
          displayName: p.displayName,
          role: p.role,
          authType: p.authType,
          secretMd5: p.secretMd5 || '',
          secretHash: p.secretHash || '',
        }),
      ])
    )
  ),
});

let _simulatedAirplaneMode = false;

export function ensureOfflineSeedCached(forceReset = false) {
  try {
    if (typeof localStorage !== 'undefined') {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.OFFLINE_SEED);
      if (!forceReset && existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (parsed && parsed.seed && parsed.profiles) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.OFFLINE_SEED, JSON.stringify(DEFAULT_OFFLINE_SEED_BUNDLE));
    }
  } catch {}
  return DEFAULT_OFFLINE_SEED_BUNDLE;
}

export function isAirplaneModeActive(options = {}) {
  if (options.forceOffline === true) return true;
  if (options.forceOffline === false) return false;
  if (_simulatedAirplaneMode) return true;
  try {
    if (typeof window !== 'undefined' && window.PUFFINLOGIN_ENV?.airplaneMode === true) {
      return true;
    }
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.AIRPLANE_MODE);
      if (saved === 'true' || saved === '1') return true;
    }
  } catch {}
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  return false;
}

export function setAirplaneModeState(enabled) {
  _simulatedAirplaneMode = Boolean(enabled);
  try {
    if (typeof localStorage !== 'undefined') {
      if (_simulatedAirplaneMode) {
        localStorage.setItem(STORAGE_KEYS.AIRPLANE_MODE, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.AIRPLANE_MODE);
      }
    }
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('puffin-connectivity-changed', {
        detail: { airplaneMode: _simulatedAirplaneMode, online: !_simulatedAirplaneMode },
      })
    );
  }
  return _simulatedAirplaneMode;
}

/**
 * Verifies family credentials (`password` or `pin4`) with automatic fallback to the
 * local MD5 + seed (`puffin-airplane-seed-2026`) when in Airplane Mode or when internet/Cloud Run is unreachable.
 */
export async function verifyPuffinCredentials(userId, plainSecret, options = {}) {
  const cleanUser = String(userId || '').trim().toLowerCase();
  const profile = PUFFIN_PROFILES.find(
    (p) => p.id === cleanUser || (Array.isArray(p.aliases) && p.aliases.includes(cleanUser))
  );
  if (!profile) {
    return {
      ok: false,
      userId: null,
      offline_verified: false,
      auth_mode: 'unknown',
      seed: PUFFIN_OFFLINE_SEED,
      warning: null,
    };
  }

  const seedBundle = ensureOfflineSeedCached(false);
  const activeSeed = String(options.seed || seedBundle?.seed || PUFFIN_OFFLINE_SEED).trim();
  const seedProfile = seedBundle?.profiles?.[profile.id] || profile;
  const lang = String(options.lang || 'it').toLowerCase().startsWith('en') ? 'en' : 'it';
  const tr = I18N[lang] || I18N.it;

  if (profile.authType === 'none') {
    const offlineNow = isAirplaneModeActive(options);
    return {
      ok: true,
      userId: profile.id,
      offline_verified: offlineNow,
      auth_mode: offlineNow ? 'offline_md5_seed' : 'online',
      seed: activeSeed,
      secretMd5: '',
      warning: offlineNow ? tr.offlineBannerBody(activeSeed) : null,
      warningIt: I18N.it.offlineBannerBody(activeSeed),
      warningEn: I18N.en.offlineBannerBody(activeSeed),
    };
  }

  const cleanSec = String(plainSecret || '').trim();
  const candidateMd5 = computePuffinSecretMd5(profile.id, cleanSec, activeSeed);
  const expectedMd5 = String(seedProfile?.secretMd5 || profile.secretMd5 || '').toLowerCase();
  const md5Match = Boolean(expectedMd5 && candidateMd5 === expectedMd5);

  let shaMatch = false;
  if (!md5Match && (seedProfile?.secretHash || profile.secretHash)) {
    const candidateSha = await computePuffinSecretHash(profile.id, cleanSec);
    shaMatch = candidateSha === (seedProfile?.secretHash || profile.secretHash);
  }
  const localSecretValid = md5Match || shaMatch;

  const startOffline = isAirplaneModeActive(options);
  let cloudReached = false;
  let cloudVerified = null;

  if (!startOffline && options.tryCloud === true && typeof fetch === 'function') {
    const apiUrl = options.apiUrl || DEFAULT_CLOUD_API_URL;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), options.timeoutMs || 1000);
      const res = await fetch(`${apiUrl}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          secret: cleanSec,
          app_id: options.appId || 'puffin-login',
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.status === 200 || res.status === 401) {
        cloudReached = true;
        const data = await res.json().catch(() => ({}));
        cloudVerified = Boolean(res.ok && data?.ok);
      }
    } catch {
      cloudReached = false;
    }
  }

  const usedOfflineSeed = startOffline || (options.tryCloud === true && !cloudReached);
  const ok = cloudReached && cloudVerified !== null ? cloudVerified : localSecretValid;
  const dispName = lang === 'en' ? profile.displayNameEn || profile.displayName : profile.displayName;
  const warningText = usedOfflineSeed
    ? ok
      ? tr.welcomeOfflineMsg(dispName, activeSeed)
      : tr.offlineBannerBody(activeSeed)
    : null;

  return {
    ok,
    userId: profile.id,
    offline_verified: Boolean(usedOfflineSeed && ok),
    auth_mode: usedOfflineSeed ? 'offline_md5_seed' : 'online',
    seed: activeSeed,
    secretMd5: candidateMd5,
    md5Matched: md5Match,
    warning: warningText,
    warningIt: I18N.it.welcomeOfflineMsg(profile.displayName, activeSeed),
    warningEn: I18N.en.welcomeOfflineMsg(profile.displayNameEn || profile.displayName, activeSeed),
  };
}

export const MAX_FAILED_ATTEMPTS = 3;
export const JAM_COOLDOWN_MS = 45_000;
export const TOP_TEN_LIMIT = 10;

export const DEFAULT_DUMMY_SCORES = Object.freeze([
  {
    id: 'scr_seed_01_ale_smurfs',
    game_id: 'smurfs-and-dragons',
    player_id: 'ale',
    score: 4850,
    started_at: '2026-11-02T17:10:12Z',
    ended_at: '2026-11-02T17:18:44Z',
    duration_sec: 512,
    hostname: 'pupurabbux.tailnet.lan',
    ip_address: '100.94.27.10',
    device: 'Linux RTX 5080 (Chrome)',
    summary_text: 'Ale crushed the Emerald Dragon at Level 42 with 62 Puffin Archers!',
    extra: {
      level: 42,
      difficulty: 'nightmare',
      schema_hash: 'drg_9921_emerald',
      puffin_archers: 62,
      towers_lost: 0,
      boss: 'Emerald Dragon',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_02_kate_mahjong',
    game_id: 'family-mahjong-3d',
    player_id: 'kate',
    score: 3920,
    started_at: '2026-11-02T20:04:00Z',
    ended_at: '2026-11-02T20:11:15Z',
    duration_sec: 435,
    hostname: 'macbook-di-kate.local',
    ip_address: '192.168.1.42',
    device: 'macOS Safari',
    summary_text: 'Mum Kate cleared Imperial layout #77b201 with Combo x8!',
    extra: {
      difficulty: 'hard',
      schema_hash: 'mhj_77b201_turtle',
      level: 18,
      max_combo: 8,
      hints_used: 0,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_03_lucilla_french',
    game_id: 'ale-french',
    player_id: 'lucilla',
    score: 18,
    started_at: '2026-11-02T16:30:00Z',
    ended_at: '2026-11-02T16:31:35Z',
    duration_sec: 95,
    hostname: 'ipad-nonna-lucilla.lan',
    ip_address: '192.168.1.88',
    device: 'iPadOS (Duolingo Owl Power)',
    summary_text: 'Grandma Lucilla scored 18/20 (9/10, 90%) in Difficile with the green owl!',
    extra: {
      difficulty: 'difficile',
      mode: 'difficile',
      word_set: 'semaine-actuelle',
      correct: 9,
      total: 10,
      percentage: 90,
      hints: 0,
      moves: 10,
      duolingo_owl_boost: true,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_04_seby_pupurabbu',
    game_id: 'pupurabbu-3d',
    player_id: 'seby',
    score: 2640,
    started_at: '2026-11-02T18:02:10Z',
    ended_at: '2026-11-02T18:06:35Z',
    duration_sec: 265,
    hostname: '',
    ip_address: '192.168.1.105',
    device: 'iPad Mini (Touch)',
    summary_text: 'Seby escaped the 3D labyrinth at full speed collecting 12 carrots!',
    extra: {
      difficulty: 'turbo_kid',
      schema_hash: 'maze_seed_4242',
      level: 9,
      carrots: 12,
      top_speed_kmh: 180,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_05_null_tubature',
    game_id: 'tubature',
    player_id: null,
    score: 2380,
    started_at: '2026-11-02T19:15:00Z',
    ended_at: '2026-11-02T19:20:40Z',
    duration_sec: 340,
    hostname: '',
    ip_address: '192.168.1.199',
    device: 'Android Tablet (PWA Offline)',
    summary_text: 'Anonymous match (player_id: NULL) at Level 42 of Tubature with zero leaks!',
    extra: {
      level: 42,
      difficulty: 'medium',
      schema_hash: 'pipe_8x8_f00d42',
      water_leaks: 0,
      pipes_rotated: 29,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_10_ricc_tubature',
    game_id: 'tubature',
    player_id: 'riccardo',
    score: 4450,
    started_at: '2026-11-07T15:10:00Z',
    ended_at: '2026-11-07T15:12:30Z',
    duration_sec: 150,
    hostname: 'pupurabbux.tailnet.lan',
    ip_address: '100.94.27.10',
    device: 'Linux RTX 5080 (Chrome)',
    summary_text: 'Dad Riccardo connected all 64 dungeon conduits on Hard (8x8) in 38 moves!',
    extra: {
      level: 7,
      difficulty: 'Hard',
      grid: '8x8',
      moves: 38,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_11_ale_tubature',
    game_id: 'tubature',
    player_id: 'ale',
    score: 3650,
    started_at: '2026-11-07T15:18:00Z',
    ended_at: '2026-11-07T15:20:10Z',
    duration_sec: 130,
    hostname: 'ipad-ale.lan',
    ip_address: '192.168.1.44',
    device: 'iPad Air',
    summary_text: 'Ale unlocked 3 Dragon Gems ampolle on Medium (6x6) in 22 moves!',
    extra: {
      level: 4,
      difficulty: 'Medium',
      grid: '6x6',
      moves: 22,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_12_seby_tubature',
    game_id: 'tubature',
    player_id: 'seby',
    score: 2950,
    started_at: '2026-11-07T15:22:00Z',
    ended_at: '2026-11-07T15:23:45Z',
    duration_sec: 105,
    hostname: 'ipad-seby.lan',
    ip_address: '192.168.1.45',
    device: 'iPad Mini',
    summary_text: 'Seby flooded the 5x5 Emerald Dragon dungeon in 14 moves!',
    extra: {
      level: 2,
      difficulty: 'Easy',
      grid: '5x5',
      moves: 14,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_06_riccardo_chess',
    game_id: 'carchess3d',
    player_id: 'riccardo',
    score: 1950,
    started_at: '2026-11-02T21:00:05Z',
    ended_at: '2026-11-02T21:06:15Z',
    duration_sec: 370,
    hostname: 'pupurabbux',
    ip_address: '192.168.1.27',
    device: 'Ubuntu Linux (RTX 5080)',
    summary_text: 'Dad Riccardo checkmated the CPU in 37 moves on easy mode!',
    extra: {
      difficulty: 'easy',
      schema_hash: 'fen_a8f3c91e',
      moves: 37,
      opponent: 'cpu_lvl2',
      checkmate: 'queen_h7',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_07_guest_jigsaw',
    game_id: 'kids-jigsaw-puzzle',
    player_id: 'guest',
    score: 1420,
    started_at: '2026-11-02T15:10:00Z',
    ended_at: '2026-11-02T15:14:20Z',
    duration_sec: 260,
    hostname: 'salotto-tv.lan',
    ip_address: '192.168.1.55',
    device: 'Smart TV Browser',
    summary_text: 'Guest Puffin completed the 6x6 Dragons jigsaw puzzle in 4m 20s!',
    extra: {
      difficulty: 'easy_6x6',
      schema_hash: 'jigsaw_dragons_36pc',
      pieces: 36,
      magnet_snaps: 14,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_08_ale_snake',
    game_id: 'puffin-snake',
    player_id: 'ale',
    score: 1800,
    started_at: '2026-11-03T16:40:00Z',
    ended_at: '2026-11-03T16:42:15Z',
    duration_sec: 135,
    hostname: 'pupurabbux.tailnet.lan',
    ip_address: '100.94.27.10',
    device: 'Linux RTX 5080 (Chrome)',
    summary_text: 'Ale ate 18 golden apples with the Red Dragon-Snake!',
    extra: {
      apples_eaten: 18,
      snake_length: 21,
      difficulty: 'normal',
      schema_hash: 'snake_grid_20x13',
      death_cause: 'self_bite',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_09_ricc_snake',
    game_id: 'puffin-snake',
    player_id: 'riccardo',
    score: 1100,
    started_at: '2026-11-03T16:45:10Z',
    ended_at: '2026-11-03T16:46:30Z',
    duration_sec: 80,
    hostname: 'pixel-10-ricc.lan',
    ip_address: '192.168.1.33',
    device: 'Google Pixel 10 (Android 16)',
    summary_text: 'Dad Riccardo scored 1100 pt in Puffin Snake on Pixel 10!',
    extra: {
      apples_eaten: 11,
      snake_length: 14,
      difficulty: 'turbo',
      schema_hash: 'snake_grid_20x13',
      death_cause: 'wall_crash',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_13_ale_jigsaw_7x7',
    game_id: 'kids-jigsaw-puzzle',
    player_id: 'ale',
    score: 3180,
    started_at: '2026-11-07T16:10:00Z',
    ended_at: '2026-11-07T16:15:10Z',
    duration_sec: 310,
    hostname: 'ipad-ale.lan',
    ip_address: '192.168.1.44',
    device: 'iPad Air',
    summary_text: 'Ale solved 7x7 (dragons_kingdom) in 310s!',
    extra: {
      difficulty: '7x7',
      grid: '7x7',
      grid_size: 7,
      pieces: 49,
      moves: 54,
      tips_used: 0,
      hints: 0,
      schema_hash: 'jigsaw_dragons_kingdom_7x7',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_14_seby_jigsaw_6x6',
    game_id: 'kids-jigsaw-puzzle',
    player_id: 'seby',
    score: 1680,
    started_at: '2026-11-07T16:20:00Z',
    ended_at: '2026-11-07T16:23:20Z',
    duration_sec: 200,
    hostname: 'ipad-seby.lan',
    ip_address: '192.168.1.45',
    device: 'iPad Mini',
    summary_text: 'Seby solved 6x6 (super_puffin) in 200s!',
    extra: {
      difficulty: '6x6',
      grid: '6x6',
      grid_size: 6,
      pieces: 36,
      moves: 39,
      tips_used: 0,
      hints: 0,
      schema_hash: 'jigsaw_super_puffin_6x6',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_15_ale_fotoquad_facile',
    game_id: 'carlesso-fotoquad',
    player_id: 'ale',
    score: 1690,
    started_at: '2026-11-07T17:01:00Z',
    ended_at: '2026-11-07T17:01:28Z',
    duration_sec: 28,
    hostname: 'ipad-ale.lan',
    ip_address: '192.168.1.44',
    device: 'iPad Air',
    summary_text: 'Ale completed FotoQuad Facile with 2 family photos in 28s!',
    extra: {
      difficulty: 'facile',
      level: 'facile',
      photos: 2,
      moves: 10,
      hints: 0,
      seconds: 28,
      new_record: true,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_16_kate_fotoquad_medio',
    game_id: 'carlesso-fotoquad',
    player_id: 'kate',
    score: 3480,
    started_at: '2026-11-07T17:10:00Z',
    ended_at: '2026-11-07T17:10:52Z',
    duration_sec: 52,
    hostname: 'macbook-di-kate.local',
    ip_address: '192.168.1.42',
    device: 'macOS Safari',
    summary_text: 'Mum Kate conquered FotoQuad Medio with 3 photos in 52s!',
    extra: {
      difficulty: 'medio',
      level: 'medio',
      photos: 3,
      moves: 18,
      hints: 0,
      seconds: 52,
      new_record: true,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_17_ricc_fotoquad_difficile',
    game_id: 'carlesso-fotoquad',
    player_id: 'riccardo',
    score: 5890,
    started_at: '2026-11-07T17:20:00Z',
    ended_at: '2026-11-07T17:21:14Z',
    duration_sec: 74,
    hostname: 'pupurabbux.tailnet.lan',
    ip_address: '100.94.27.10',
    device: 'Linux RTX 5080 (Chrome)',
    summary_text: 'Dad Riccardo mastered FotoQuad Difficile with 4 photos in 74s!',
    extra: {
      difficulty: 'difficile',
      level: 'difficile',
      photos: 4,
      moves: 26,
      hints: 0,
      seconds: 74,
      new_record: true,
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_18_ale_dots_and_lines',
    game_id: 'dots-and-lines',
    player_id: 'ale',
    score: 1450,
    started_at: '2026-11-08T18:10:00Z',
    ended_at: '2026-11-08T18:12:05Z',
    duration_sec: 125,
    hostname: 'pixel-10-ricc.lan',
    ip_address: '192.168.1.33',
    device: 'Google Pixel 10 (Dual Touch)',
    summary_text: 'Ale (13 box) beat Seby (7 box) in Dots & Lines 4x5 with a x6 Neon Combo!',
    extra: {
      difficulty: '4x5',
      grid: '4x5',
      mode: '2p_duel',
      player_slot: 'p1',
      opponent_id: 'seby',
      opponent_score: 7,
      boxes_claimed: 13,
      total_boxes: 20,
      max_combo: 6,
      moves: 49,
      outcome: 'win',
      h2h_key: 'ale__vs__seby',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_19_seby_dots_and_lines',
    game_id: 'dots-and-lines',
    player_id: 'seby',
    score: 1280,
    started_at: '2026-11-08T18:15:00Z',
    ended_at: '2026-11-08T18:16:50Z',
    duration_sec: 110,
    hostname: 'ipad-seby.lan',
    ip_address: '192.168.1.45',
    device: 'iPad Mini (Dual Touch)',
    summary_text: 'Seby (11 box) defeated Ale (9 box) in Dots & Lines 4x5 with a x5 Turbo Chain!',
    extra: {
      difficulty: '4x5',
      grid: '4x5',
      mode: '2p_duel',
      player_slot: 'p2',
      opponent_id: 'ale',
      opponent_score: 9,
      boxes_claimed: 11,
      total_boxes: 20,
      max_combo: 5,
      moves: 49,
      outcome: 'win',
      h2h_key: 'ale__vs__seby',
    },
    is_dummy_seed: true,
  },
  {
    id: 'scr_seed_20_ricc_dots_and_lines',
    game_id: 'dots-and-lines',
    player_id: 'riccardo',
    score: 1620,
    started_at: '2026-11-08T18:22:00Z',
    ended_at: '2026-11-08T18:24:10Z',
    duration_sec: 130,
    hostname: 'pupurabbux.tailnet.lan',
    ip_address: '100.94.27.10',
    device: 'Linux RTX 5080 (Chrome)',
    summary_text: 'Dad Riccardo (14 box) beat Ale (6 box) in Dots & Lines 4x5 with a x8 Galaxian Combo!',
    extra: {
      difficulty: '4x5',
      grid: '4x5',
      mode: '2p_duel',
      player_slot: 'p2',
      opponent_id: 'ale',
      opponent_score: 6,
      boxes_claimed: 14,
      total_boxes: 20,
      max_combo: 8,
      moves: 49,
      outcome: 'win',
      h2h_key: 'ale__vs__riccardo',
    },
    is_dummy_seed: true,
  },
]);

export function normalizeProfileId(rawId, allowNull = false) {
  if (rawId === null || rawId === undefined || rawId === '' || String(rawId).toLowerCase() === 'null') {
    return allowNull ? null : null;
  }
  const clean = String(rawId).trim().toLowerCase();
  for (const p of PUFFIN_PROFILES) {
    if (p.id === clean || p.aliases.includes(clean)) return p.id;
  }
  return allowNull ? null : 'guest';
}

export function normalizeGuestName(rawName) {
  if (rawName === null || rawName === undefined) return null;
  const cleaned = String(rawName)
    .replace(/[<>"'`\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
  return cleaned.length > 0 ? cleaned : null;
}

export function getProfileById(rawId) {
  const id = normalizeProfileId(rawId, true);
  if (id === null) return NULL_PLAYER_PROFILE;
  return PUFFIN_PROFILES.find((p) => p.id === id) || PUFFIN_PROFILES[0];
}

export function validateAndNormalizeScorePayload(raw = {}, fallbackTelemetry = {}) {
  const rawGameId = String(raw.game_id || raw.gameId || raw.appId || '').trim();
  if (!rawGameId) {
    throw new Error('[PuffinLogin] Guaranteed field `game_id` is required on every score record.');
  }
  const gameId = rawGameId.toLowerCase() === 'fotoquad' ? 'carlesso-fotoquad' : rawGameId;

  const hasExplicitNull =
    raw.player_id === null ||
    raw.playerId === null ||
    raw.userId === null ||
    raw.player_id === undefined ||
    String(raw.player_id ?? raw.playerId ?? raw.userId ?? '').toLowerCase() === 'null';

  const resolvedPlayerId = hasExplicitNull
    ? null
    : normalizeProfileId(raw.player_id ?? raw.playerId ?? raw.userId, true);

  const profile = getProfileById(resolvedPlayerId);

  const rawExtra =
    (raw.extra && typeof raw.extra === 'object' ? raw.extra : null) ||
    (raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : null) ||
    {};
  const extra = { ...rawExtra };

  const explicitDurationRaw =
    raw.duration_sec ??
    raw.durationSec ??
    extra.duration_sec ??
    extra.durationSec ??
    extra.seconds ??
    extra.timeSeconds ??
    extra.time_sec ??
    (extra.durationMs !== undefined ? Math.round(Number(extra.durationMs) / 1000) : undefined);
  const explicitDurationNum = Number(explicitDurationRaw);
  const hasExplicitDuration = Number.isFinite(explicitDurationNum) && explicitDurationNum > 0;
  const fallbackDur = hasExplicitDuration ? Math.max(1, Math.round(explicitDurationNum)) : 180;

  const nowIso = new Date().toISOString();
  const endedAtRaw = raw.ended_at || raw.endedAt || raw.playedAt || nowIso;
  const endedMs = Number.isNaN(Date.parse(endedAtRaw)) ? Date.now() : Date.parse(endedAtRaw);
  const endedAt = new Date(endedMs).toISOString();

  const startedAtRaw =
    raw.started_at ||
    raw.startedAt ||
    new Date(endedMs - fallbackDur * 1000).toISOString();
  const startedMs = Number.isNaN(Date.parse(startedAtRaw))
    ? endedMs - fallbackDur * 1000
    : Math.min(endedMs, Date.parse(startedAtRaw));
  const startedAt = new Date(startedMs).toISOString();

  const durationSec = hasExplicitDuration
    ? Math.max(1, Math.round(explicitDurationNum))
    : Math.max(1, Math.round((endedMs - startedMs) / 1000));
  const score = Number(raw.score) || 0;

  // Normalize canonical difficulty / mode / level
  const rawDifficulty =
    extra.difficulty ??
    raw.difficulty ??
    raw.mode ??
    extra.mode ??
    (typeof extra.level === 'string' && Number.isNaN(Number(extra.level)) ? extra.level : undefined);
  if (rawDifficulty !== undefined && rawDifficulty !== null && String(rawDifficulty).trim() !== '') {
    extra.difficulty = String(rawDifficulty).trim();
  }
  if (raw.mode && !extra.mode) {
    extra.mode = String(raw.mode).trim();
  }

  // Normalize grid & grid_size (e.g., 6x6, 7x7, easy_6x6, grid_size: 7)
  const rawGridSize = Number(extra.grid_size ?? extra.gridSize ?? raw.grid_size ?? raw.gridSize);
  if (Number.isInteger(rawGridSize) && rawGridSize > 0) {
    extra.grid_size = rawGridSize;
    if (!extra.grid) {
      extra.grid = `${rawGridSize}x${rawGridSize}`;
    }
  } else if (typeof extra.grid === 'string' && /^\d+x\d+$/i.test(extra.grid.trim())) {
    const cleanGrid = extra.grid.trim().toLowerCase();
    extra.grid = cleanGrid;
    const [gx, gy] = cleanGrid.split('x').map(Number);
    if (gx === gy && gx > 0 && !extra.grid_size) {
      extra.grid_size = gx;
    }
  } else if (typeof extra.difficulty === 'string') {
    const gridMatch = extra.difficulty.match(/(?:^|_)(\d+)x(\d+)(?:$|_)/i);
    if (gridMatch) {
      const gx = Number(gridMatch[1]);
      const gy = Number(gridMatch[2]);
      extra.grid = `${gx}x${gy}`;
      if (gx === gy && gx > 0) {
        extra.grid_size = gx;
      }
    }
  }

  if (
    Number.isInteger(extra.grid_size) &&
    extra.grid_size > 0 &&
    extra.pieces === undefined &&
    (gameId === 'kids-jigsaw-puzzle' || String(extra.difficulty || '').includes('x'))
  ) {
    extra.pieces = extra.grid_size * extra.grid_size;
  }

  // Normalize efficiency metrics (moves, hints / tips_used, photos, and quiz correct/total/percentage)
  if (extra.moves !== undefined && extra.moves !== null && !Number.isNaN(Number(extra.moves))) {
    extra.moves = Number(extra.moves);
  } else if (
    gameId === 'ale-french' &&
    extra.total !== undefined &&
    extra.total !== null &&
    !Number.isNaN(Number(extra.total))
  ) {
    extra.moves = Number(extra.total);
  }
  const rawHints =
    extra.hints ?? extra.tips_used ?? extra.hints_used ?? extra.audio_hints ?? raw.hints ?? raw.tips_used;
  if (rawHints !== undefined && rawHints !== null && !Number.isNaN(Number(rawHints))) {
    extra.hints = Number(rawHints);
  } else if (
    gameId === 'ale-french' &&
    extra.correct !== undefined &&
    extra.correct !== null &&
    !Number.isNaN(Number(extra.correct))
  ) {
    // In ale-french each correct answer is 2 pts without audio hint or 1 pt with audio hint
    extra.hints = Math.max(0, Number(extra.correct) * 2 - score);
  }
  if (extra.photos !== undefined && extra.photos !== null && !Number.isNaN(Number(extra.photos))) {
    extra.photos = Number(extra.photos);
  }

  // Optional Bragging Friend Guest Name (`guest_name: "Paolo"`)
  const rawGuestName =
    raw.guest_name ??
    raw.guestName ??
    extra.guest_name ??
    extra.guestName ??
    fallbackTelemetry.guest_name ??
    fallbackTelemetry.guestName;
  const guestName =
    resolvedPlayerId === 'guest' || resolvedPlayerId === null
      ? normalizeGuestName(rawGuestName)
      : null;
  if (guestName) {
    extra.guest_name = guestName;
  }

  // Dual-Login & Head-to-Head (`H2H`) normalization (`player_slot`, `opponent_id`, `opponent_score`, `outcome`, `max_combo`, `h2h_key`)
  const playerSlot = normalizePlayerSlot(
    raw.player_slot ?? raw.playerSlot ?? extra.player_slot ?? extra.playerSlot
  );
  if (playerSlot) {
    extra.player_slot = playerSlot;
  }
  const rawOpponentId =
    raw.opponent_id ??
    raw.opponentId ??
    extra.opponent_id ??
    extra.opponentId;
  const opponentId =
    rawOpponentId !== undefined && rawOpponentId !== null && String(rawOpponentId).trim() !== ''
      ? normalizeProfileId(rawOpponentId, true)
      : null;
  const opponentGuestName =
    opponentId === 'guest'
      ? normalizeGuestName(
          raw.opponent_guest_name ??
            raw.opponentGuestName ??
            extra.opponent_guest_name ??
            extra.opponentGuestName
        )
      : null;
  if (opponentId) {
    extra.opponent_id = opponentId;
    if (opponentGuestName) {
      extra.opponent_guest_name = opponentGuestName;
    }
    if (!extra.h2h_key) {
      extra.h2h_key = buildCanonicalH2HKey(
        resolvedPlayerId,
        opponentId,
        guestName,
        opponentGuestName
      );
    }
  }
  const rawOppScore =
    raw.opponent_score ?? raw.opponentScore ?? extra.opponent_score ?? extra.opponentScore;
  if (rawOppScore !== undefined && rawOppScore !== null && !Number.isNaN(Number(rawOppScore))) {
    extra.opponent_score = Number(rawOppScore);
  }
  const rawBoxes =
    raw.boxes_claimed ?? raw.boxesClaimed ?? extra.boxes_claimed ?? extra.boxesClaimed;
  if (rawBoxes !== undefined && rawBoxes !== null && !Number.isNaN(Number(rawBoxes))) {
    extra.boxes_claimed = Number(rawBoxes);
  }
  const rawMaxCombo =
    raw.max_combo ??
    raw.maxCombo ??
    raw.longest_combo ??
    extra.max_combo ??
    extra.maxCombo ??
    extra.longest_combo;
  if (rawMaxCombo !== undefined && rawMaxCombo !== null && !Number.isNaN(Number(rawMaxCombo))) {
    extra.max_combo = Number(rawMaxCombo);
  }
  const rawOutcome = String(raw.outcome ?? extra.outcome ?? '').trim().toLowerCase();
  if (['win', 'loss', 'tie', 'draw', 'victory'].includes(rawOutcome)) {
    extra.outcome =
      rawOutcome === 'victory' ? 'win' : rawOutcome === 'draw' ? 'tie' : rawOutcome;
  }

  // Per-move timing telemetry (avg_move_ms, max_move_ms, avg_move_sec, max_move_sec)
  const rawAvgMoveMs =
    raw.avg_move_ms ?? raw.avgMoveMs ?? extra.avg_move_ms ?? extra.avgMoveMs;
  if (rawAvgMoveMs !== undefined && rawAvgMoveMs !== null && !Number.isNaN(Number(rawAvgMoveMs))) {
    extra.avg_move_ms = Math.round(Number(rawAvgMoveMs));
    extra.avg_move_sec = Number((extra.avg_move_ms / 1000).toFixed(2));
  }
  const rawMaxMoveMs =
    raw.max_move_ms ?? raw.maxMoveMs ?? extra.max_move_ms ?? extra.maxMoveMs;
  if (rawMaxMoveMs !== undefined && rawMaxMoveMs !== null && !Number.isNaN(Number(rawMaxMoveMs))) {
    extra.max_move_ms = Math.round(Number(rawMaxMoveMs));
    extra.max_move_sec = Number((extra.max_move_ms / 1000).toFixed(2));
  }

  const effectiveDisplayName = guestName
    ? `${profile.shortName} (${guestName})`
    : profile.displayName;
  const effectiveShortName = guestName
    ? `${profile.shortName} (${guestName})`
    : profile.shortName;

  const hostname = String(raw.hostname ?? fallbackTelemetry.hostname ?? '').trim();
  const ipAddress =
    String(
      raw.source_ip ??
        raw.ip_address ??
        raw.ipAddress ??
        fallbackTelemetry.source_ip ??
        fallbackTelemetry.ipAddress ??
        ''
    ).trim() || '127.0.0.1';
  const device = String(raw.device ?? fallbackTelemetry.device ?? 'Browser').trim();

  const summaryText =
    raw.summary_text ||
    raw.summaryText ||
    `${effectiveDisplayName} scored ${score} pt in ${gameId}`;

  return {
    id: raw.id || `scr_${endedMs}_${resolvedPlayerId || 'null'}`,
    game_id: gameId,
    started_at: startedAt,
    ended_at: endedAt,
    duration_sec: durationSec,
    player_id: resolvedPlayerId,
    player_slot: playerSlot || null,
    playerSlot: playerSlot || null,
    opponent_id: opponentId || null,
    opponent_guest_name: opponentGuestName || null,
    opponent_score: extra.opponent_score ?? null,
    boxes_claimed: extra.boxes_claimed ?? null,
    max_combo: extra.max_combo ?? null,
    avg_move_ms: extra.avg_move_ms ?? null,
    max_move_ms: extra.max_move_ms ?? null,
    avg_move_sec: extra.avg_move_sec ?? null,
    max_move_sec: extra.max_move_sec ?? null,
    outcome: extra.outcome ?? null,
    h2h_key: extra.h2h_key ?? null,
    guest_name: guestName,
    guestName,
    score,
    hostname,
    source_ip: ipAddress,
    ip_address: ipAddress,
    device,
    summary_text: summaryText,
    extra,
    gameId,
    startedAt,
    endedAt,
    playedAt: endedAt,
    durationSec,
    userId: resolvedPlayerId,
    displayName: effectiveDisplayName,
    shortName: effectiveShortName,
    rpgClass: profile.rpgClass,
    colorHex: profile.colorHex,
    emoji: profile.emoji,
    avatar: profile.avatar,
    ipAddress,
    summaryText,
    metadata: extra,
  };
}

function summarizeScoreGroup(items = [], key = 'all', label = 'All') {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      key,
      label,
      totalMatches: 0,
      champion: null,
      fastestPlayer: null,
      podium: [],
      durationStats: { avgSec: 0, minSec: 0, maxSec: 0, medianSec: 0, totalMatches: 0 },
      efficiencyStats: {
        totalMatches: 0,
        minMoves: null,
        avgMoves: null,
        minHints: null,
        avgHints: null,
      },
      byPlayer: {},
    };
  }

  const byScore = [...items].sort((a, b) => b.score - a.score || a.duration_sec - b.duration_sec);
  const byDuration = [...items].sort(
    (a, b) => a.duration_sec - b.duration_sec || b.score - a.score
  );

  const toChampSummary = (rec) => ({
    id: rec.id,
    player_id: rec.player_id,
    guest_name: rec.guest_name || rec.extra?.guest_name || null,
    displayName: rec.displayName,
    shortName: rec.shortName,
    emoji: rec.emoji,
    avatar: rec.avatar,
    colorHex: rec.colorHex,
    score: rec.score,
    duration_sec: rec.duration_sec,
    moves: rec.extra?.moves ?? null,
    hints: rec.extra?.hints ?? null,
    correct: rec.extra?.correct ?? null,
    total: rec.extra?.total ?? null,
    percentage: rec.extra?.percentage ?? null,
    word_set: rec.extra?.word_set ?? null,
    grid: rec.extra?.grid ?? null,
    difficulty: rec.extra?.difficulty ?? null,
    ended_at: rec.ended_at,
  });

  const champion = toChampSummary(byScore[0]);
  const fastestPlayer = toChampSummary(byDuration[0]);

  const seenPlayers = new Set();
  const podium = [];
  for (const rec of byScore) {
    const guestSub = rec.guest_name || rec.extra?.guest_name;
    const pid =
      guestSub && (rec.player_id === 'guest' || !rec.player_id)
        ? `guest:${String(guestSub).toLowerCase()}`
        : rec.player_id || 'null';
    if (!seenPlayers.has(pid)) {
      seenPlayers.add(pid);
      podium.push(toChampSummary(rec));
      if (podium.length >= 3) break;
    }
  }

  const durs = items
    .map((s) => Number(s.duration_sec))
    .filter((d) => Number.isFinite(d) && d > 0)
    .sort((a, b) => a - b);
  const sumDur = durs.reduce((acc, v) => acc + v, 0);
  const mid = Math.floor(durs.length / 2);
  const medianSec =
    durs.length === 0
      ? 0
      : durs.length % 2 === 1
      ? durs[mid]
      : Math.round((durs[mid - 1] + durs[mid]) / 2);

  const movesArr = items
    .map((s) => Number(s.extra?.moves))
    .filter((m) => Number.isFinite(m) && m >= 0);
  const hintsArr = items
    .map((s) => Number(s.extra?.hints))
    .filter((h) => Number.isFinite(h) && h >= 0);

  const byPlayer = {};
  for (const rec of items) {
    const guestSub = rec.guest_name || rec.extra?.guest_name;
    const pid =
      guestSub && (rec.player_id === 'guest' || !rec.player_id)
        ? `guest:${String(guestSub).toLowerCase()}`
        : rec.player_id || 'null';
    if (!byPlayer[pid]) {
      byPlayer[pid] = {
        player_id: rec.player_id,
        guest_name: guestSub || null,
        displayName: rec.displayName,
        shortName: rec.shortName,
        emoji: rec.emoji,
        avatar: rec.avatar,
        colorHex: rec.colorHex,
        matches: 0,
        bestScore: 0,
        _scoreSum: 0,
        bestDurationSec: Infinity,
        _durSum: 0,
        minMoves: Infinity,
        minHints: Infinity,
      };
    }
    const p = byPlayer[pid];
    p.matches += 1;
    p._scoreSum += rec.score;
    p._durSum += rec.duration_sec;
    if (rec.score > p.bestScore) p.bestScore = rec.score;
    if (rec.duration_sec < p.bestDurationSec) p.bestDurationSec = rec.duration_sec;
    if (Number.isFinite(Number(rec.extra?.moves)) && Number(rec.extra.moves) < p.minMoves) {
      p.minMoves = Number(rec.extra.moves);
    }
    if (Number.isFinite(Number(rec.extra?.hints)) && Number(rec.extra.hints) < p.minHints) {
      p.minHints = Number(rec.extra.hints);
    }
  }

  for (const p of Object.values(byPlayer)) {
    p.avgScore = Math.round(p._scoreSum / p.matches);
    p.avgDurationSec = Math.round(p._durSum / p.matches);
    if (p.bestDurationSec === Infinity) p.bestDurationSec = 0;
    if (p.minMoves === Infinity) p.minMoves = null;
    if (p.minHints === Infinity) p.minHints = null;
    delete p._scoreSum;
    delete p._durSum;
  }

  return {
    key,
    label,
    totalMatches: items.length,
    champion,
    fastestPlayer,
    podium,
    durationStats: {
      avgSec: durs.length ? Math.round(sumDur / durs.length) : 0,
      minSec: durs.length ? durs[0] : 0,
      maxSec: durs.length ? durs[durs.length - 1] : 0,
      medianSec,
      totalMatches: items.length,
    },
    efficiencyStats: {
      totalMatches: items.length,
      minMoves: movesArr.length ? Math.min(...movesArr) : null,
      avgMoves: movesArr.length
        ? Math.round(movesArr.reduce((a, b) => a + b, 0) / movesArr.length)
        : null,
      minHints: hintsArr.length ? Math.min(...hintsArr) : null,
      avgHints: hintsArr.length
        ? Math.round((hintsArr.reduce((a, b) => a + b, 0) / hintsArr.length) * 10) / 10
        : null,
    },
    byPlayer,
  };
}

export function computePerGameDashboard(scores = [], gameId = '') {
  const rawTarget = String(gameId || '').trim().toLowerCase();
  const targetGameId = rawTarget === 'fotoquad' ? 'carlesso-fotoquad' : rawTarget;

  const normalized = (Array.isArray(scores) ? scores : [])
    .map((s) => {
      try {
        return validateAndNormalizeScorePayload(s);
      } catch {
        return null;
      }
    })
    .filter((s) => s && (!targetGameId || s.game_id.toLowerCase() === targetGameId));

  const subModeBuckets = new Map();
  const gridBuckets = new Map();

  for (const s of normalized) {
    const rawSub = String(
      s.extra?.difficulty ?? s.extra?.level ?? s.extra?.mode ?? 'standard'
    )
      .trim()
      .toLowerCase();
    const subKey = rawSub || 'standard';
    if (!subModeBuckets.has(subKey)) subModeBuckets.set(subKey, []);
    subModeBuckets.get(subKey).push(s);

    if (s.extra?.grid) {
      const gKey = String(s.extra.grid).trim().toLowerCase();
      if (!gridBuckets.has(gKey)) gridBuckets.set(gKey, []);
      gridBuckets.get(gKey).push(s);
      if (gKey !== subKey) {
        if (!subModeBuckets.has(gKey)) subModeBuckets.set(gKey, []);
        subModeBuckets.get(gKey).push(s);
      }
    }
  }

  const bySubMode = {};
  for (const [k, list] of subModeBuckets.entries()) {
    bySubMode[k] = summarizeScoreGroup(list, k, k);
  }

  const byGrid = {};
  for (const [k, list] of gridBuckets.entries()) {
    byGrid[k] = summarizeScoreGroup(list, k, k);
  }

  const overall = summarizeScoreGroup(normalized, 'all', 'All Modes');

  return {
    game_id: targetGameId || 'ALL',
    totalMatches: normalized.length,
    overall,
    bySubMode,
    byGrid,
    byPlayer: overall.byPlayer,
    matches: normalized,
  };
}

export function computeHeadToHeadStats(scores = [], playerAId = 'ale', playerBId = 'seby', options = {}) {
  const idA = normalizeProfileId(playerAId, true) || 'ale';
  const idB = normalizeProfileId(playerBId, true) || 'seby';
  const guestA = idA === 'guest' ? normalizeGuestName(options.guestNameA) : null;
  const guestB = idB === 'guest' ? normalizeGuestName(options.guestNameB) : null;
  const profA = getProfileById(idA);
  const profB = getProfileById(idB);
  const targetGameId = options.gameId ? String(options.gameId).trim().toLowerCase() : null;
  const targetH2HKey = buildCanonicalH2HKey(idA, idB, guestA, guestB);

  const normalized = (Array.isArray(scores) ? scores : [])
    .map((s) => {
      try {
        return validateAndNormalizeScorePayload(s);
      } catch {
        return null;
      }
    })
    .filter((s) => {
      if (!s) return false;
      if (targetGameId && s.game_id.toLowerCase() !== targetGameId) return false;
      const oppId = normalizeProfileId(s.extra?.opponent_id, true);
      if (!oppId) return false;
      const recH2H =
        s.extra?.h2h_key ||
        buildCanonicalH2HKey(
          s.player_id,
          oppId,
          s.guest_name || s.extra?.guest_name,
          s.extra?.opponent_guest_name
        );
      return recH2H === targetH2HKey;
    });

  // Deduplicate dual-submitted match records by `extra.match_id` if present
  const seenMatchIds = new Set();
  const uniqueMatches = [];
  for (const rec of normalized) {
    const mid = rec.extra?.match_id;
    if (mid) {
      if (seenMatchIds.has(mid)) continue;
      seenMatchIds.add(mid);
    }
    uniqueMatches.push(rec);
  }

  let winsA = 0;
  let winsB = 0;
  let ties = 0;
  let totalBoxesA = 0;
  let totalBoxesB = 0;
  let longestComboA = 0;
  let longestComboB = 0;

  const isPlayerARecord = (rec) => {
    if (idA === idB && idA === 'guest') {
      const recGuest = normalizeGuestName(rec.guest_name || rec.extra?.guest_name);
      return recGuest === guestA;
    }
    return rec.player_id === idA;
  };

  for (const rec of uniqueMatches) {
    const recIsA = isPlayerARecord(rec);
    const outcome = String(rec.extra?.outcome || 'win').toLowerCase();
    const myBoxes = Number(rec.extra?.boxes_claimed ?? rec.score) || 0;
    const oppBoxes = Number(rec.extra?.opponent_score) || 0;
    const myCombo = Number(rec.extra?.max_combo) || 0;
    const oppCombo = Number(rec.extra?.opponent_max_combo) || 0;

    if (outcome === 'tie' || outcome === 'draw') {
      ties += 1;
    } else if (outcome === 'win') {
      if (recIsA) winsA += 1;
      else winsB += 1;
    } else if (outcome === 'loss') {
      if (recIsA) winsB += 1;
      else winsA += 1;
    } else {
      if (myBoxes > oppBoxes) {
        if (recIsA) winsA += 1;
        else winsB += 1;
      } else if (oppBoxes > myBoxes) {
        if (recIsA) winsB += 1;
        else winsA += 1;
      } else {
        ties += 1;
      }
    }

    if (recIsA) {
      totalBoxesA += myBoxes;
      totalBoxesB += oppBoxes;
      if (myCombo > longestComboA) longestComboA = myCombo;
      if (oppCombo > longestComboB) longestComboB = oppCombo;
    } else {
      totalBoxesB += myBoxes;
      totalBoxesA += oppBoxes;
      if (myCombo > longestComboB) longestComboB = myCombo;
      if (oppCombo > longestComboA) longestComboA = oppCombo;
    }
  }

  // Also check any non-deduplicated records for personal max_combo in this H2H pair
  for (const rec of normalized) {
    const c = Number(rec.extra?.max_combo) || 0;
    if (isPlayerARecord(rec)) {
      if (c > longestComboA) longestComboA = c;
    } else {
      if (c > longestComboB) longestComboB = c;
    }
  }

  const longestComboOverall =
    longestComboA >= longestComboB
      ? {
          player_id: idA,
          holder: idA,
          shortName: guestA ? `${profA.shortName} (${guestA})` : profA.shortName,
          combo: longestComboA,
          count: longestComboA,
        }
      : {
          player_id: idB,
          holder: idB,
          shortName: guestB ? `${profB.shortName} (${guestB})` : profB.shortName,
          combo: longestComboB,
          count: longestComboB,
        };

  return {
    h2h_key: targetH2HKey,
    game_id: targetGameId || 'ALL',
    playerA: {
      id: idA,
      guest_name: guestA,
      shortName: guestA ? `${profA.shortName} (${guestA})` : profA.shortName,
      displayName: guestA ? `${profA.shortName} (${guestA})` : profA.displayName,
      emoji: profA.emoji,
      colorHex: profA.colorHex,
      avatar: profA.avatar,
      wins: winsA,
      totalBoxes: totalBoxesA,
      longestCombo: longestComboA,
    },
    playerB: {
      id: idB,
      guest_name: guestB,
      shortName: guestB ? `${profB.shortName} (${guestB})` : profB.shortName,
      displayName: guestB ? `${profB.shortName} (${guestB})` : profB.displayName,
      emoji: profB.emoji,
      colorHex: profB.colorHex,
      avatar: profB.avatar,
      wins: winsB,
      totalBoxes: totalBoxesB,
      longestCombo: longestComboB,
    },
    matches: uniqueMatches.length,
    totalMatches: uniqueMatches.length,
    winsA,
    winsB,
    ties,
    totalBoxesA,
    totalBoxesB,
    longestComboA,
    longestComboB,
    longestComboOverall,
    recentMatches: [...uniqueMatches]
      .sort((a, b) => Date.parse(b.ended_at) - Date.parse(a.ended_at))
      .slice(0, 10),
  };
}

export function validateAndNormalizeLoginPayload(raw = {}, fallbackTelemetry = {}) {
  const appId =
    String(raw.app_id || raw.appId || raw.game_id || raw.gameId || fallbackTelemetry.appId || '').trim() ||
    'puffin-login';
  const resolvedPlayerId = normalizeProfileId(
    raw.player_id ?? raw.playerId ?? raw.userId ?? raw.id ?? 'guest',
    false
  );
  const profile = getProfileById(resolvedPlayerId);
  const playerSlot = normalizePlayerSlot(
    raw.player_slot ?? raw.playerSlot ?? fallbackTelemetry.playerSlot
  );

  const rawGuestName =
    raw.guest_name ??
    raw.guestName ??
    raw.extra?.guest_name ??
    fallbackTelemetry.guest_name ??
    fallbackTelemetry.guestName;
  const guestName =
    resolvedPlayerId === 'guest' ? normalizeGuestName(rawGuestName) : null;
  const effectiveDisplayName = guestName
    ? `${profile.shortName} (${guestName})`
    : profile.displayName;
  const effectiveShortName = guestName
    ? `${profile.shortName} (${guestName})`
    : profile.shortName;

  const nowIso = new Date().toISOString();
  const loggedAtRaw = raw.logged_at || raw.loggedAt || raw.timestamp || nowIso;
  const loggedMs = Number.isNaN(Date.parse(loggedAtRaw)) ? Date.now() : Date.parse(loggedAtRaw);
  const loggedAt = new Date(loggedMs).toISOString();

  const hostname = String(raw.hostname ?? fallbackTelemetry.hostname ?? '').trim();
  const ipAddress =
    String(
      raw.source_ip ??
        raw.ip_address ??
        raw.ipAddress ??
        fallbackTelemetry.source_ip ??
        fallbackTelemetry.ipAddress ??
        ''
    ).trim() || '127.0.0.1';
  const device = String(raw.device ?? fallbackTelemetry.device ?? 'Browser').trim();
  const authMethod = String(raw.auth_method || raw.authMethod || profile.authType || 'none').trim();
  const offlineVerified = Boolean(raw.offline_verified ?? raw.offlineVerified ?? false);
  const authMode = String(
    raw.auth_mode || raw.authMode || (offlineVerified ? 'offline_md5_seed' : 'online')
  ).trim();
  const seedUsed =
    raw.seed_used || raw.seedUsed || (offlineVerified ? PUFFIN_OFFLINE_SEED : null);
  const offlineWarning =
    raw.offline_warning ||
    raw.offlineWarning ||
    (offlineVerified ? I18N.it.offlineBannerBody(seedUsed || PUFFIN_OFFLINE_SEED) : null);

  return {
    id: raw.id || `lgn_${loggedMs}_${resolvedPlayerId}${playerSlot ? `_${playerSlot}` : ''}`,
    player_id: resolvedPlayerId,
    userId: resolvedPlayerId,
    player_slot: playerSlot,
    playerSlot,
    guest_name: guestName,
    guestName,
    app_id: appId,
    game_id: appId,
    appId,
    logged_at: loggedAt,
    loggedAt,
    source_ip: ipAddress,
    ip_address: ipAddress,
    ipAddress,
    hostname,
    device,
    auth_method: authMethod,
    offline_verified: offlineVerified,
    offlineVerified,
    auth_mode: authMode,
    authMode,
    seed_used: seedUsed,
    seedUsed,
    offline_warning: offlineWarning,
    offlineWarning,
    displayName: effectiveDisplayName,
    shortName: effectiveShortName,
    role: profile.role,
    colorHex: profile.colorHex,
    avatar: profile.avatar,
  };
}

export function readSlotSessionsMap() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SLOTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    }
  } catch {}
  return {};
}

export function writeSlotSession(slot, session) {
  const cleanSlot = normalizePlayerSlot(slot);
  if (!cleanSlot) return;
  try {
    if (typeof localStorage !== 'undefined') {
      const map = readSlotSessionsMap();
      if (session) {
        map[cleanSlot] = session;
      } else {
        delete map[cleanSlot];
      }
      localStorage.setItem(STORAGE_KEYS.AUTH_SLOTS, JSON.stringify(map));
    }
  } catch {}
}

export function getSlotAuthSession(slot = null, fallbackConfig = {}) {
  const cleanSlot = normalizePlayerSlot(slot);
  try {
    if (cleanSlot) {
      const map = readSlotSessionsMap();
      const slotRaw = map[cleanSlot];
      if (slotRaw && (slotRaw.player_id || slotRaw.userId)) {
        return validateAndNormalizeLoginPayload(
          { ...slotRaw, player_slot: cleanSlot },
          { ...fallbackConfig, playerSlot: cleanSlot }
        );
      }
      // If slot !== 'p1', never bleed the single-player global session into Player 2!
      if (cleanSlot !== 'p1') {
        return null;
      }
      // For p1, if map Explicitly has `p1: null` (logged out on p1), respect that!
      if (Object.prototype.hasOwnProperty.call(map, 'p1') && map.p1 === null) {
        return null;
      }
    }
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      const uid = parsed?.player_id || parsed?.userId;
      if (uid) {
        return validateAndNormalizeLoginPayload(
          { ...parsed, player_slot: cleanSlot || parsed.player_slot || null },
          { ...fallbackConfig, playerSlot: cleanSlot }
        );
      }
    }
  } catch {}
  return null;
}

export function getSlotCurrentUser(slot = null, fallbackConfig = {}) {
  const session = getSlotAuthSession(slot, fallbackConfig);
  if (!session?.userId) return null;
  const found = PUFFIN_PROFILES.find((p) => p.id === session.userId);
  if (!found) return null;
  const guestName = found.id === 'guest' ? normalizeGuestName(session.guest_name) : null;
  return {
    ...found,
    player_slot: session.player_slot || normalizePlayerSlot(slot),
    playerSlot: session.player_slot || normalizePlayerSlot(slot),
    guest_name: guestName,
    guestName,
    displayName: guestName ? `${found.shortName} (${guestName})` : found.displayName,
    shortName: guestName ? `${found.shortName} (${guestName})` : found.shortName,
    loggedAt: session.loggedAt,
    logged_at: session.logged_at,
    appId: session.appId,
    app_id: session.app_id,
    source_ip: session.source_ip,
    ip_address: session.ip_address,
    ipAddress: session.ipAddress,
    hostname: session.hostname,
    device: session.device,
    offline_verified: Boolean(session.offline_verified),
    offlineVerified: Boolean(session.offline_verified),
    auth_mode: session.auth_mode || 'online',
    seed_used: session.seed_used || null,
    offline_warning: session.offline_warning || null,
  };
}

export function resolvePuffinConfig(overrides = {}) {
  const winEnv = (typeof window !== 'undefined' && window.PUFFINLOGIN_ENV) || {};
  const metaEnv = {};
  if (typeof document !== 'undefined') {
    document.querySelectorAll('meta[name^="puffinlogin:"], meta[name^="PUFFINLOGIN_"]').forEach((m) => {
      const key = m.getAttribute('name').replace(/^puffinlogin:/i, 'PUFFINLOGIN_').toUpperCase();
      metaEnv[key] = m.getAttribute('content');
    });
  }

  const raw = { ...metaEnv, ...winEnv, ...overrides };
  const toBool = (val, def) => {
    if (val === undefined || val === null || val === '') return def;
    if (typeof val === 'boolean') return val;
    const s = String(val).trim().toLowerCase();
    if (['false', '0', 'no', 'off'].includes(s)) return false;
    if (['true', '1', 'yes', 'on'].includes(s)) return true;
    return def;
  };

  let savedLang = 'en';
  try {
    savedLang = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.LANG)) || 'en';
  } catch {}
  const rawLang = String(raw.lang || raw.PUFFINLOGIN_LANG || savedLang || 'en').toLowerCase();
  const lang = rawLang.startsWith('it') ? 'it' : 'en';

  const defaultAppId =
    (typeof window !== 'undefined' &&
      window.location?.pathname?.split('/').filter(Boolean)[0]?.replace(/\.html$/, '')) ||
    'puffin-snake';

  const isGitHubPages =
    typeof window !== 'undefined' && /\.github\.io$/i.test(window.location?.hostname || '');
  const defaultApiUrl = isGitHubPages ? DEFAULT_CLOUD_API_URL : '/v1';

  const playerSlot = normalizePlayerSlot(
    raw.playerSlot ?? raw.player_slot ?? raw.PUFFINLOGIN_PLAYER_SLOT
  );
  const defaultUser = normalizeProfileId(
    raw.defaultUser ?? raw.default_user ?? raw.PUFFINLOGIN_DEFAULT_USER,
    true
  );
  const playerLabel = String(raw.playerLabel ?? raw.player_label ?? '').trim() || null;

  return {
    appId: raw.appId || raw.PUFFINLOGIN_APP_ID || defaultAppId,
    gcpProjectId: raw.gcpProjectId || raw.PUFFINLOGIN_GCP_PROJECT_ID || 'ror-goldie',
    apiUrl: raw.apiUrl || raw.PUFFINLOGIN_API_URL || defaultApiUrl,
    acceptGuest: toBool(raw.acceptGuest ?? raw.PUFFINLOGIN_ACCEPT_GUEST, true),
    requireStrongAuth: toBool(raw.requireStrongAuth ?? raw.PUFFINLOGIN_REQUIRE_STRONG_AUTH, false),
    matureOnly: toBool(raw.matureOnly ?? raw.PUFFINLOGIN_MATURE_ONLY, false),
    offlineOk: toBool(raw.offlineOk ?? raw.PUFFINLOGIN_OFFLINE_OK, true),
    requireLogin: toBool(raw.requireLogin ?? raw.PUFFINLOGIN_REQUIRE_LOGIN, !playerSlot),
    allowedUsers: raw.allowedUsers || raw.PUFFINLOGIN_ALLOWED_USERS || '*',
    badgePosition: raw.badgePosition || raw.PUFFINLOGIN_BADGE_POSITION || 'top-right',
    avatarShape: raw.avatarShape || raw.PUFFINLOGIN_AVATAR_SHAPE || 'squircle',
    assetBaseUrl: raw.assetBaseUrl || raw.PUFFINLOGIN_ASSET_BASE_URL || '.',
    hostname: raw.hostname || raw.PUFFINLOGIN_HOSTNAME || '',
    ipAddress: raw.ipAddress || raw.PUFFINLOGIN_IP_ADDRESS || '',
    playerSlot,
    defaultUser,
    playerLabel,
    lang,
  };
}

const _telemetryCache = {
  ipAddress: '192.168.1.27',
  fetched: false,
};

export async function detectClientTelemetry(cfg = {}) {
  const rawHost =
    cfg.hostname ||
    (typeof window !== 'undefined' && window.PUFFINLOGIN_ENV?.hostname) ||
    (typeof window !== 'undefined' && window.location?.hostname) ||
    '';

  const isGenericLocal = !rawHost || rawHost === 'localhost' || rawHost === '127.0.0.1';
  const hostname = isGenericLocal ? (cfg.hostname || '') : rawHost;
  const apiUrl = cfg.apiUrl || resolvePuffinConfig(cfg).apiUrl || DEFAULT_CLOUD_API_URL;

  if (!_telemetryCache.fetched && typeof fetch === 'function') {
    _telemetryCache.fetched = true;
    let resolvedFromBackend = false;
    // 1. Try PuffinLogin backend `/v1/whoami` first (observes real HTTP source IP via x-forwarded-for / socket)
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 800);
      const res = await fetch(`${apiUrl}/whoami`, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json();
        const serverIp = String(data?.source_ip || data?.ip_address || '').trim();
        if (serverIp && serverIp !== '127.0.0.1' && serverIp !== '::1') {
          _telemetryCache.ipAddress = serverIp;
          resolvedFromBackend = true;
        }
      }
    } catch {}

    // 2. Fallback to ipify for static/localhost sessions where backend is local loopback or offline
    if (!resolvedFromBackend) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 900);
        const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json();
          if (data?.ip) _telemetryCache.ipAddress = data.ip;
        }
      } catch {}
    }
  }

  const ipAddress =
    cfg.source_ip ||
    cfg.ipAddress ||
    (typeof window !== 'undefined' &&
      (window.PUFFINLOGIN_ENV?.source_ip || window.PUFFINLOGIN_ENV?.ipAddress)) ||
    _telemetryCache.ipAddress ||
    '127.0.0.1';

  const platform =
    (typeof navigator !== 'undefined' &&
      (navigator.userAgentData?.platform || navigator.platform)) ||
    'Browser';

  return { hostname, source_ip: ipAddress, ip_address: ipAddress, ipAddress, device: platform };
}

export function formatHostOrIp(entry) {
  const host = String(entry?.hostname || '').trim();
  const ip = String(entry?.ip_address || entry?.ipAddress || '').trim() || '127.0.0.1';
  const dev = String(entry?.device || '').trim();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return {
      primary: `🖥️ ${host}`,
      secondary: `🌐 ${ip}${dev ? ` • ${dev}` : ''}`,
      usedFallback: false,
    };
  }
  return {
    primary: `🌐 ${ip}`,
    secondary: `⚡ Fallback IP (no hostname)${dev ? ` • ${dev}` : ''}`,
    usedFallback: true,
  };
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return mins > 0 ? `${mins}m ${String(rem).padStart(2, '0')}s` : `${rem}s`;
}

export function formatTimeRange(startedAt, endedAt) {
  try {
    const dStart = new Date(startedAt);
    const dEnd = new Date(endedAt);
    const fmt = (d) =>
      d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dayFmt = dEnd.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    const durSec = Math.max(1, Math.round((dEnd.getTime() - dStart.getTime()) / 1000));
    return {
      rangeText: `${fmt(dStart)} → ${fmt(dEnd)}`,
      dateText: dayFmt,
      durationText: formatDuration(durSec),
      durationSec: durSec,
    };
  } catch {
    return {
      rangeText: '— → —',
      dateText: 'Today',
      durationText: '0s',
      durationSec: 0,
    };
  }
}

export function getDeletedScoreIds() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.DELETED_SCORES);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function ensureDummyScoresSeeded(forceReset = false) {
  if (forceReset) {
    try {
      localStorage.removeItem(STORAGE_KEYS.DELETED_SCORES);
    } catch {}
  }
  const deletedSet = getDeletedScoreIds();
  const normalizedSeeds = DEFAULT_DUMMY_SCORES
    .map((s) => validateAndNormalizeScorePayload(s))
    .filter((s) => !deletedSet.has(s.id));
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCORES);
    const existing = raw ? JSON.parse(raw) : [];
    if (forceReset || !Array.isArray(existing) || existing.length === 0) {
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(normalizedSeeds));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('puffin-score-recorded'));
      }
      return normalizedSeeds;
    }
    return existing
      .map((item) => validateAndNormalizeScorePayload(item))
      .filter((item) => !deletedSet.has(item.id));
  } catch {
    return normalizedSeeds;
  }
}

function playTone(freq = 520, durationMs = 75, type = 'sine') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = playTone._ctx || (playTone._ctx = new AudioCtx());
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {}
}

function playJammedSound() {
  playTone(155, 130, 'sawtooth');
  setTimeout(() => playTone(118, 220, 'sawtooth'), 110);
}

const COMPONENT_CSS = `
:host {
  --puffin-bg: #121528;
  --puffin-card-bg: #1c203b;
  --puffin-text: #f8fafc;
  --puffin-muted: #94a3b8;
  --puffin-radius: 26%;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--puffin-text);
  interpolate-size: allow-keywords;
  display: inline-block;
}

:host([avatar-shape="circle"]) {
  --puffin-radius: 50%;
}

:host([compact]) .puffin-quick-btn,
:host([hide-quick-buttons]) .puffin-quick-btn {
  display: none;
}

.slot-occupant-pill {
  position: absolute;
  top: -6px;
  left: -4px;
  background: #0ea5e9;
  color: #fff;
  font-size: 0.56rem;
  font-weight: 900;
  padding: 0.08rem 0.34rem;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.65);
  z-index: 10;
  letter-spacing: 0.02em;
}

/* 1. BIGGER, CUTER, MINIMALIST CORNER PILL BADGE + ALWAYS-AVAILABLE HIGH SCORES & RING QUICK BAR */
.puffin-widget-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
}

.puffin-badge-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.62rem;
  padding: 0.28rem 0.98rem 0.28rem 0.32rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(22, 27, 52, 0.96), color-mix(in srgb, var(--active-color, #FACC15) 18%, #121528));
  border: 2.5px solid var(--active-color, #FACC15);
  box-shadow: 0 5px 18px var(--active-glow, rgba(250, 204, 21, 0.34)), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  color: var(--puffin-text);
  cursor: pointer;
  font-size: 1.02rem;
  font-weight: 900;
  transition: scale 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
  translate: 0px;
  rotate: 0deg;
  scale: 1;
}

.puffin-badge-btn:hover,
.puffin-badge-btn:focus-visible {
  scale: 1.06;
  box-shadow: 0 8px 24px var(--active-glow, rgba(250, 204, 21, 0.48)), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  outline: none;
}

.puffin-quick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(24, 30, 58, 0.96), rgba(14, 18, 36, 0.98));
  border: 2px solid rgba(250, 204, 21, 0.55);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  color: #fde047;
  font-size: 1.05rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: scale 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease;
  scale: 1;
}

.puffin-quick-btn:hover,
.puffin-quick-btn:focus-visible {
  scale: 1.12;
  border-color: #facc15;
  box-shadow: 0 6px 18px rgba(250, 204, 21, 0.45);
  outline: none;
}

.puffin-quick-ring-btn {
  border-color: rgba(249, 115, 22, 0.65);
  color: #fb923c;
}

.puffin-quick-ring-btn:hover,
.puffin-quick-ring-btn:focus-visible {
  border-color: #fb923c;
  box-shadow: 0 6px 18px rgba(249, 115, 22, 0.55);
}

.badge-offline-icon {
  font-size: 0.88rem;
  line-height: 1;
  background: rgba(245, 158, 11, 0.24);
  border: 1px solid rgba(251, 191, 36, 0.65);
  border-radius: 999px;
  padding: 0.1rem 0.32rem;
  color: #fde68a;
}

.badge-offline-icon[hidden] {
  display: none;
}

.badge-avatar-wrap {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--puffin-radius);
  overflow: hidden;
  border: 2px solid var(--active-color, #FACC15);
  background: #0b0d19;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  rotate: -3deg;
  translate: 0px;
  scale: 1;
  transition: rotate 0.25s ease, scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.puffin-badge-btn:hover .badge-avatar-wrap,
.puffin-badge-btn:focus-visible .badge-avatar-wrap {
  rotate: 2deg;
  scale: 1.06;
}

.badge-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 23%;
  translate: 0px 8%;
  rotate: 0deg;
  scale: 1.55;
  transition: scale 0.32s cubic-bezier(0.34, 1.56, 0.64, 1),
              translate 0.32s cubic-bezier(0.34, 1.56, 0.64, 1),
              object-position 0.32s ease;
}

.puffin-badge-btn:hover .badge-avatar-img,
.puffin-badge-btn:focus-visible .badge-avatar-img {
  object-position: center 50%;
  translate: 0px 0%;
  scale: 1.0;
}

.badge-lock-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.badge-name {
  font-size: 1.02rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

/* 2. COMPACT FAMILY SELECTOR DIALOG + EMBEDDED HIGH SCORES & PUFFIN RING */
dialog {
  border: none;
  padding: 0;
  background: transparent;
  color: var(--puffin-text);
  max-width: min(96vw, 560px);
  width: 100%;
  margin: auto;
  transition: max-width 0.22s ease;
}

dialog[data-active-tab="ring"],
dialog[data-active-tab="scores"] {
  max-width: min(96vw, 620px);
}

dialog[data-active-tab="cards"] {
  max-width: min(96vw, 980px);
}

dialog:modal {
  overscroll-behavior: contain;
}

dialog::backdrop {
  background-color: rgba(8, 10, 22, 0.78);
  backdrop-filter: blur(7px);
  overflow: hidden;
  overscroll-behavior: contain;
}

.modal-shell {
  background: linear-gradient(165deg, #181c36 0%, #101325 100%);
  border: 2px solid rgba(255, 255, 255, 0.14);
  border-radius: 1.35rem;
  padding: 0.95rem 1rem 1.05rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.68);
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.65rem;
  gap: 0.5rem;
}

.modal-title-wrap h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.modal-title-wrap p {
  margin: 0.12rem 0 0;
  font-size: 0.72rem;
  color: var(--puffin-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.lang-btn,
.logout-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #f8fafc;
  border-radius: 999px;
  padding: 0.22rem 0.52rem;
  font-size: 0.68rem;
  font-weight: 800;
  cursor: pointer;
}

.lang-btn:hover,
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.policy-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.3rem;
}

.policy-pill {
  font-size: 0.63rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.policy-pill.warn {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fecaca;
}

.close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: var(--puffin-text);
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.82rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease, scale 0.15s ease;
  translate: 0px;
  rotate: 0deg;
  scale: 1;
}

.close-btn[hidden] {
  display: none;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  scale: 1.08;
}

/* 2-ROW x 4-COL FAMILY + BOT SELECTOR GRID:
   Row 1: Riccardo | Kate   | Ale   | Seby
   Row 2: Nonna    | [empty]| Guest | Saga (UAT Bot) */
.profiles-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.48rem;
  padding: 0.25rem 0;
}

.profile-grid-spacer {
  pointer-events: none;
  visibility: hidden;
  min-height: 1px;
}

.profile-card {
  background: var(--puffin-card-bg);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.95rem;
  padding: 0.45rem 0.28rem 0.48rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: scale 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-color 0.2s ease,
              box-shadow 0.2s ease,
              background 0.2s ease;
  translate: 0px;
  rotate: 0deg;
  scale: 1;
}

.profile-card:hover:not([disabled]),
.profile-card:focus-visible:not([disabled]) {
  scale: 1.22;
  border-color: var(--card-color, #FACC15);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.72), 0 0 18px var(--card-glow, rgba(250, 204, 21, 0.45));
  background: #252b4d;
  outline: none;
  z-index: 25;
}

.profile-card.selected {
  scale: 1.08;
  border-color: var(--card-color, #FACC15);
  box-shadow: 0 6px 18px var(--card-glow, rgba(250, 204, 21, 0.45));
  background: #252b4d;
  outline: none;
  z-index: 5;
}

.profile-card.guest-highlight {
  border-color: #38bdf8;
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.65);
}

.profile-card[disabled] {
  opacity: 0.3;
  filter: grayscale(0.8);
  cursor: not-allowed;
}

.card-avatar-frame {
  width: 58px;
  height: 58px;
  border-radius: var(--puffin-radius);
  overflow: hidden;
  border: 2.5px solid var(--card-color, #FACC15);
  background: #0d0f1d;
  margin-bottom: 0.3rem;
  position: relative;
  translate: 0px;
  rotate: -2deg;
  scale: 1;
  transition: rotate 0.28s ease, border-radius 0.28s ease;
}

:host([avatar-shape="circle"]) .card-avatar-frame {
  rotate: 0deg;
}

.profile-card:hover:not([disabled]) .card-avatar-frame,
.profile-card:focus-visible:not([disabled]) .card-avatar-frame,
.profile-card.selected .card-avatar-frame {
  rotate: 0deg;
}

.card-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center var(--face-y, 24%);
  translate: 0px 10%;
  rotate: 0deg;
  scale: 1.54;
  transition: scale 0.34s cubic-bezier(0.34, 1.56, 0.64, 1),
              translate 0.34s cubic-bezier(0.34, 1.56, 0.64, 1),
              object-position 0.34s ease;
}

.card-avatar-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.profile-card.video-playing .card-avatar-video {
  opacity: 1;
}

.profile-card:hover:not([disabled]) .card-avatar-img,
.profile-card:focus-visible:not([disabled]) .card-avatar-img,
.profile-card.selected .card-avatar-img {
  object-position: center 52%;
  translate: 0px 0%;
  scale: 1.0;
}

/* GUEST / ANONYMOUS: ALWAYS BLACK & WHITE (even on hover or when active!) */
.profile-card[data-profile-id="guest"] .card-avatar-frame,
.profile-card[data-profile-id="guest"] .card-avatar-img,
.profile-card[data-profile-id="guest"] .card-avatar-video,
.puffin-badge-btn[data-user-id="guest"] .badge-avatar-wrap,
.puffin-badge-btn[data-user-id="guest"] .badge-avatar-img,
.drawer-hero-frame[data-hero-id="guest"] {
  filter: grayscale(100%) contrast(1.12);
}

.profile-card[data-profile-id="guest"] .card-name {
  color: #cbd5e1;
}

/* UAT BOT (bot / saga): ROBOT <tt> MONOSPACE FONT, NON-SELECTABLE BY HUMANS + HOVER TOOLTIP */
.profile-card[data-profile-id="saga"] {
  border-style: dashed;
  border-color: rgba(34, 211, 238, 0.45);
  background: linear-gradient(180deg, rgba(8, 28, 44, 0.92) 0%, rgba(12, 18, 34, 0.96) 100%);
  cursor: not-allowed;
}

.profile-card[data-profile-id="saga"]:hover,
.profile-card[data-profile-id="saga"]:focus-visible,
.profile-card[data-profile-id="saga"].bot-tooltip-flash {
  z-index: 60;
}

.bot-only-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: #091526;
  color: #67e8f9;
  border: 1.5px solid #22d3ee;
  border-radius: 0.6rem;
  padding: 0.32rem 0.55rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 0.66rem;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.85), 0 0 12px rgba(34, 211, 238, 0.35);
  opacity: 0;
  pointer-events: none;
  translate: 0px 4px;
  transition: opacity 0.18s ease, translate 0.18s ease;
  z-index: 60;
}

.profile-card[data-profile-id="saga"]:hover .bot-only-tooltip,
.profile-card[data-profile-id="saga"]:focus-visible .bot-only-tooltip,
.profile-card[data-profile-id="saga"].bot-tooltip-flash .bot-only-tooltip {
  opacity: 1;
  translate: 0px 0px;
}

.robot-tt {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.72rem;
  font-weight: 900;
  color: #22d3ee;
  background: rgba(6, 182, 212, 0.16);
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 4px;
  padding: 0.04rem 0.32rem;
  letter-spacing: 0.03em;
  text-shadow: 0 0 8px rgba(34, 211, 238, 0.55);
}

.card-name {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.card-role-tag {
  font-size: 0.56rem;
  color: var(--card-color, #FACC15);
  font-weight: 700;
  margin-top: 0.1rem;
}

.jam-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 900;
  padding: 0.08rem 0.3rem;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

/* 3. 3x3 HERO SPOTLIGHT STAGE (174x174px = 3x of 58px!) + AUTH DRAWER */
.auth-drawer {
  margin-top: 0.7rem;
  padding: 0.85rem 0.9rem;
  border-radius: 1.15rem;
  background: radial-gradient(circle at top left, rgba(35, 42, 78, 0.96) 0%, rgba(13, 16, 32, 0.99) 100%);
  border: 2.5px solid var(--drawer-color, #FACC15);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  position: relative;
}

.auth-drawer[hidden] {
  display: none;
}

.drawer-stage-row {
  display: flex;
  align-items: center;
  gap: 0.95rem;
  width: 100%;
}

@media (max-width: 460px) {
  .drawer-stage-row {
    flex-direction: column;
  }
}

.drawer-hero-spotlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.drawer-hero-frame {
  width: 174px;
  height: 174px;
  border-radius: 1.35rem;
  overflow: hidden;
  border: 3px solid var(--drawer-color, #FACC15);
  background: #090b16;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65), 0 0 22px var(--drawer-glow, rgba(250, 204, 21, 0.35));
  position: relative;
  animation: heroPopIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes heroPopIn {
  from {
    scale: 0.72;
    opacity: 0.4;
  }
  to {
    scale: 1;
    opacity: 1;
  }
}

.drawer-hero-img,
.drawer-hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.drawer-hero-video {
  position: absolute;
  inset: 0;
}

.drawer-hero-class {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--drawer-color, #fde047);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 0.14rem 0.55rem;
  white-space: nowrap;
}

.drawer-auth-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.auth-drawer.jammed {
  border-color: #f97316;
  background: repeating-linear-gradient(
    -45deg,
    rgba(40, 18, 24, 0.95),
    rgba(40, 18, 24, 0.95) 12px,
    rgba(24, 14, 20, 0.98) 12px,
    rgba(24, 14, 20, 0.98) 24px
  );
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 0.84rem;
  font-weight: 800;
}

.attempts-pill {
  font-size: 0.68rem;
  padding: 0.12rem 0.48rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #fde047;
  font-weight: 800;
}

.attempts-pill.danger {
  background: rgba(239, 68, 68, 0.28);
  color: #fecaca;
}

.pin-xxxx-row {
  display: flex;
  gap: 0.55rem;
  margin: 0.15rem 0 0.25rem;
}

.pin-x-box {
  width: 2.65rem;
  height: 2.85rem;
  border-radius: 0.8rem;
  border: 2.5px dashed rgba(255, 255, 255, 0.28);
  background: rgba(11, 13, 25, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.2);
  transition: scale 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-color 0.2s ease,
              background 0.2s ease,
              rotate 0.2s ease;
  translate: 0px;
  rotate: 0deg;
  scale: 1;
}

.pin-x-box.filled {
  border-style: solid;
  border-color: var(--drawer-color, #EF4444);
  background: rgba(255, 255, 255, 0.1);
  color: var(--drawer-color, #EF4444);
  text-shadow: 0 2px 10px var(--drawer-color, #EF4444);
  scale: 1.08;
  rotate: -3deg;
}

.pin-x-box.filled:nth-child(even) {
  rotate: 3deg;
}

.pin-x-box.jammed-box {
  border-style: solid;
  border-color: #f97316;
  background: rgba(239, 68, 68, 0.22);
  color: #fca5a5;
  rotate: -8deg;
}

.cutie-numpad {
  display: grid;
  grid-template-columns: repeat(3, 68px);
  gap: 0.45rem;
  justify-content: center;
}

.cutie-key {
  height: 2.75rem;
  border-radius: 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.22);
  background: linear-gradient(180deg, #2d3561 0%, #1f2547 100%);
  box-shadow: 0 4px 0 #0d1021, 0 6px 12px rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 1.18rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  user-select: none;
  transition: translate 0.1s ease, scale 0.14s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.1s ease, border-color 0.15s ease, rotate 0.2s ease;
  translate: 0px 0px;
  rotate: 0deg;
  scale: 1;
}

.cutie-key .key-sub {
  font-size: 0.68rem;
  opacity: 0.75;
}

.cutie-key:hover:not([disabled]),
.cutie-key:focus-visible:not([disabled]) {
  border-color: var(--drawer-color, #EF4444);
  background: linear-gradient(180deg, #384278 0%, #262d57 100%);
  scale: 1.05;
  outline: none;
}

.cutie-key:active:not([disabled]) {
  translate: 0px 3px;
  box-shadow: 0 1px 0 #0d1021;
}

.cutie-key.jammed-key {
  opacity: 0.48;
  background: #27222e;
  border-color: rgba(249, 115, 22, 0.45);
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: 0 2px 0 #110d14;
}

.cutie-key.jammed-key:nth-child(odd) {
  rotate: -6deg;
  translate: -1px 2px;
}

.cutie-key.jammed-key:nth-child(even) {
  rotate: 5deg;
  translate: 1px 1px;
}

.jam-banner {
  background: rgba(239, 68, 68, 0.18);
  border: 1.5px solid rgba(249, 115, 22, 0.65);
  border-radius: 0.85rem;
  padding: 0.55rem 0.75rem;
  text-align: center;
  width: 100%;
  font-size: 0.78rem;
  line-height: 1.35;
  color: #fed7aa;
}

.jam-banner strong {
  color: #fca5a5;
  display: block;
  font-size: 0.84rem;
  margin-bottom: 0.15rem;
}

.unjam-btn,
.guest-fallback-btn {
  margin-top: 0.35rem;
  background: #f97316;
  color: #0f1120;
  border: none;
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 900;
  cursor: pointer;
  display: inline-block;
}

.guest-fallback-btn {
  background: #38bdf8;
  color: #090d16;
  margin-left: 0.3rem;
}

.pwd-row {
  display: flex;
  gap: 0.4rem;
  width: 100%;
}

.guest-brag-form {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  width: 100%;
}

.guest-brag-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: #cbd5e1;
  text-align: left;
}

.pwd-input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 0.7rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: #121528;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
}

.pwd-input:focus {
  outline: none;
  border-color: var(--drawer-color, #FACC15);
}

.action-btn {
  padding: 0.5rem 0.85rem;
  border-radius: 0.7rem;
  border: none;
  background: var(--drawer-color, #FACC15);
  color: #0f1120;
  font-weight: 900;
  font-size: 0.84rem;
  cursor: pointer;
}

.icon-btn {
  padding: 0.5rem 0.6rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #1e223d;
  color: #fff;
  cursor: pointer;
}

.forgot-link {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.72rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 0.1rem;
}

.forgot-link:hover {
  color: #f8fafc;
}

.feedback-msg {
  min-height: 1.05rem;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.feedback-msg.error {
  color: #fca5a5;
}

.feedback-msg.ok {
  color: #86efac;
}

.feedback-msg.offline-warn {
  color: #fde68a;
  background: rgba(245, 158, 11, 0.16);
  border: 1px solid rgba(251, 191, 36, 0.45);
  border-radius: 0.65rem;
  padding: 0.32rem 0.55rem;
}

/* 4. OFFLINE / AIRPLANE MODE WARNING BANNER */
.offline-warning-banner {
  background: linear-gradient(135deg, rgba(120, 53, 15, 0.45), rgba(69, 26, 3, 0.62));
  border: 1.5px solid rgba(251, 191, 36, 0.65);
  border-radius: 0.9rem;
  padding: 0.55rem 0.78rem;
  margin-bottom: 0.65rem;
  color: #fef3c7;
  font-size: 0.74rem;
  line-height: 1.38;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18);
}

.offline-warning-banner[hidden] {
  display: none;
}

.offline-warning-banner strong {
  display: block;
  color: #fde047;
  font-size: 0.8rem;
  margin-bottom: 0.14rem;
}

/* 5. ALWAYS-AVAILABLE MODAL TABS (👤 Players | 🏆 High Scores | 🃏 Magic Cards | 🔥💍 Puffin Ring) */
.puffin-modal-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
  margin-bottom: 0.68rem;
  background: rgba(10, 13, 26, 0.72);
  padding: 0.28rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

@media (max-width: 520px) {
  .puffin-modal-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.modal-tab-btn {
  border: 1.5px solid transparent;
  background: transparent;
  color: #cbd5e1;
  border-radius: 0.72rem;
  padding: 0.42rem 0.45rem;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.modal-tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.modal-tab-btn.active {
  background: linear-gradient(135deg, #252d58 0%, #1a2040 100%);
  color: #fde047;
  border-color: rgba(250, 204, 21, 0.65);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.45), 0 0 12px rgba(250, 204, 21, 0.22);
}

.modal-tab-panel[hidden] {
  display: none;
}

.modal-tab-panel[data-tab-panel="scores"],
.modal-tab-panel[data-tab-panel="ring"] {
  max-height: min(68vh, 560px);
  overflow-y: auto;
  padding-right: 0.15rem;
}

.scores-scope-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
}

.scores-scope-btn {
  cursor: pointer;
  padding: 0.34rem 0.78rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.85);
  color: #cbd5e1;
  border: 1.5px solid rgba(255, 255, 255, 0.16);
  transition: all 0.16s ease;
}

.scores-scope-btn.active,
.scores-scope-btn:hover {
  background: rgba(250, 204, 21, 0.18);
  color: #fde047;
  border-color: #facc15;
}

/* 6. LOGIN BOTTOM DOCK (Quick jump to High Scores + Puffin Ring from Login screen) */
.login-bottom-dock {
  margin-top: 0.72rem;
  padding-top: 0.62rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.42rem;
}

.dock-pill-btn {
  flex: 1;
  min-width: 135px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.42rem 0.65rem;
  border-radius: 0.75rem;
  background: rgba(17, 23, 45, 0.9);
  border: 1.5px solid rgba(250, 204, 21, 0.4);
  color: #fef08a;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.16s ease;
}

.dock-pill-btn:hover {
  background: rgba(250, 204, 21, 0.16);
  border-color: #facc15;
  transform: translateY(-1px);
}

.dock-pill-btn.ring-accent {
  border-color: rgba(249, 115, 22, 0.55);
  color: #fed7aa;
}

.dock-pill-btn.ring-accent:hover {
  background: rgba(249, 115, 22, 0.22);
  border-color: #fb923c;
}
`;

const KEY_DECORATIONS = {
  1: '⭐',
  2: '🎈',
  3: '🌈',
  4: '🍀',
  5: '🦖',
  6: '🚀',
  7: '🍭',
  8: '⚡',
  9: '💎',
  0: '🐧',
};

let sharedSheet = null;
function getSharedStyleSheet() {
  if (!sharedSheet && typeof CSSStyleSheet !== 'undefined' && 'replaceSync' in CSSStyleSheet.prototype) {
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(COMPONENT_CSS);
  }
  return sharedSheet;
}

const template = typeof document !== 'undefined' ? document.createElement('template') : null;
if (template) {
  template.innerHTML = `
    <div class="puffin-widget-bar" part="widget-bar">
      <button type="button" class="puffin-badge-btn" part="badge" aria-label="PuffinLogin Profile">
        <div class="badge-avatar-wrap">
          <img class="badge-avatar-img" src="" alt="" hidden />
          <span class="badge-lock-icon">🔒</span>
        </div>
        <span class="badge-name"></span>
        <span class="badge-offline-icon" hidden title="Airplane / Offline Mode (Local MD5 + Seed)">✈️</span>
      </button>
      <button type="button" class="puffin-quick-btn puffin-quick-scores-btn" part="scores-btn" title="Top 10 High Scores (Hall of Fame)" aria-label="Top 10 High Scores">🏆</button>
      <button type="button" class="puffin-quick-btn puffin-quick-cards-btn" part="cards-btn" title="Magic Collectible Cards Album (Collezione Carte)" aria-label="Magic Collectible Cards Album">🃏</button>
      <button type="button" class="puffin-quick-btn puffin-quick-ring-btn" part="ring-btn" title="Puffin Login Ring (All Family Games)" aria-label="Puffin Login Ring">💍</button>
    </div>

    <dialog closedby="any" data-active-tab="login" aria-labelledby="puffin-dialog-title">
      <div class="modal-shell">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h2 id="puffin-dialog-title"></h2>
            <p id="puffin-dialog-sub"></p>
            <div class="policy-pills"></div>
          </div>
          <div class="header-actions">
            <button type="button" class="lang-btn" title="Switch Language EN/IT"></button>
            <button type="button" class="logout-btn" hidden></button>
            <button type="button" class="close-btn" aria-label="Close">✕</button>
          </div>
        </div>

        <div class="offline-warning-banner" role="alert" hidden>
          <strong class="offline-banner-title"></strong>
          <span class="offline-banner-body"></span>
        </div>

        <div class="puffin-modal-tabs" role="tablist" aria-label="PuffinLogin Sections">
          <button type="button" role="tab" class="modal-tab-btn active" data-modal-tab="login" aria-selected="true">
            👤 <span class="tab-label-login">Giocatori</span>
          </button>
          <button type="button" role="tab" class="modal-tab-btn" data-modal-tab="scores" aria-selected="false">
            🏆 <span class="tab-label-scores">High Scores</span>
          </button>
          <button type="button" role="tab" class="modal-tab-btn" data-modal-tab="cards" aria-selected="false">
            🃏 <span class="tab-label-cards">Carte Magic</span>
          </button>
          <button type="button" role="tab" class="modal-tab-btn" data-modal-tab="ring" aria-selected="false">
            🔥💍 <span class="tab-label-ring">Puffin Ring</span>
          </button>
        </div>

        <div class="modal-tab-panel" data-tab-panel="login">
          <div class="profiles-strip" role="listbox" aria-label="Carlesso Family Profiles"></div>

          <div class="auth-drawer" hidden>
            <div class="drawer-stage-row">
              <div class="drawer-hero-spotlight"></div>
              <div class="drawer-auth-col">
                <div class="drawer-header"></div>
                <div class="drawer-body"></div>
                <div class="feedback-msg" role="status" aria-live="polite"></div>
                <button type="button" class="forgot-link" hidden></button>
              </div>
            </div>
          </div>

          <div class="login-bottom-dock">
            <button type="button" class="dock-pill-btn" data-dock-action="open-scores">
              🏆 <span class="dock-scores-label">Top 10 High Scores</span>
            </button>
            <button type="button" class="dock-pill-btn" data-dock-action="open-cards">
              🃏 <span class="dock-cards-label">Album Carte Magic</span>
            </button>
            <button type="button" class="dock-pill-btn ring-accent" data-dock-action="open-ring">
              🔥💍 <span class="dock-ring-label">Puffin Ring</span>
            </button>
          </div>
        </div>

        <div class="modal-tab-panel" data-tab-panel="scores" hidden>
          <div class="scores-scope-bar">
            <button type="button" class="scores-scope-btn active" data-scores-scope="game"></button>
            <button type="button" class="scores-scope-btn" data-scores-scope="ALL"></button>
          </div>
          <puffin-leaderboard class="modal-embedded-leaderboard"></puffin-leaderboard>
        </div>

        <div class="modal-tab-panel" data-tab-panel="cards" hidden style="max-height:74vh;overflow-y:auto;">
          <puffin-cards class="modal-embedded-cards"></puffin-cards>
        </div>

        <div class="modal-tab-panel" data-tab-panel="ring" hidden>
          <puffin-ring class="modal-embedded-ring"></puffin-ring>
        </div>
      </div>
    </dialog>
  `;
}

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class PuffinLoginElement extends BaseElement {
  static get observedAttributes() {
    return [
      'app-id',
      'accept-guest',
      'require-strong-auth',
      'mature-only',
      'allowed-users',
      'avatar-shape',
      'lang',
      'require-login',
      'player-slot',
      'default-user',
      'player-label',
      'compact',
      'hide-quick-buttons',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    const sheet = getSharedStyleSheet();
    if (sheet && 'adoptedStyleSheets' in this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    } else {
      const styleEl = document.createElement('style');
      styleEl.textContent = COMPONENT_CSS;
      this.shadowRoot.append(styleEl);
    }
    this.shadowRoot.append(template.content.cloneNode(true));

    this.config = resolvePuffinConfig();
    this.selectedCandidate = null;
    this.pinBuffer = '';
    this.showPassword = false;
    this.highlightGuest = false;
    this.activeTab = 'login';
    this.scoresScope = 'game';
    this.listeners = new Set();
    this._jamTimer = null;

    this.$badgeBtn = this.shadowRoot.querySelector('.puffin-badge-btn');
    this.$badgeImg = this.shadowRoot.querySelector('.badge-avatar-img');
    this.$badgeLock = this.shadowRoot.querySelector('.badge-lock-icon');
    this.$badgeName = this.shadowRoot.querySelector('.badge-name');
    this.$badgeOfflineIcon = this.shadowRoot.querySelector('.badge-offline-icon');
    this.$quickScoresBtn = this.shadowRoot.querySelector('.puffin-quick-scores-btn');
    this.$quickCardsBtn = this.shadowRoot.querySelector('.puffin-quick-cards-btn');
    this.$quickRingBtn = this.shadowRoot.querySelector('.puffin-quick-ring-btn');
    this.$dialog = this.shadowRoot.querySelector('dialog');
    this.$title = this.shadowRoot.querySelector('#puffin-dialog-title');
    this.$sub = this.shadowRoot.querySelector('#puffin-dialog-sub');
    this.$langBtn = this.shadowRoot.querySelector('.lang-btn');
    this.$logoutBtn = this.shadowRoot.querySelector('.logout-btn');
    this.$closeBtn = this.shadowRoot.querySelector('.close-btn');
    this.$offlineBanner = this.shadowRoot.querySelector('.offline-warning-banner');
    this.$offlineBannerTitle = this.shadowRoot.querySelector('.offline-banner-title');
    this.$offlineBannerBody = this.shadowRoot.querySelector('.offline-banner-body');
    this.$tabBtns = Array.from(this.shadowRoot.querySelectorAll('[data-modal-tab]'));
    this.$tabPanels = Array.from(this.shadowRoot.querySelectorAll('[data-tab-panel]'));
    this.$tabLabelLogin = this.shadowRoot.querySelector('.tab-label-login');
    this.$tabLabelScores = this.shadowRoot.querySelector('.tab-label-scores');
    this.$tabLabelCards = this.shadowRoot.querySelector('.tab-label-cards');
    this.$tabLabelRing = this.shadowRoot.querySelector('.tab-label-ring');
    this.$dockScoresLabel = this.shadowRoot.querySelector('.dock-scores-label');
    this.$dockCardsLabel = this.shadowRoot.querySelector('.dock-cards-label');
    this.$dockRingLabel = this.shadowRoot.querySelector('.dock-ring-label');
    this.$scoresScopeBtns = Array.from(this.shadowRoot.querySelectorAll('[data-scores-scope]'));
    this.$embeddedLeaderboard = this.shadowRoot.querySelector('.modal-embedded-leaderboard');
    this.$embeddedCards = this.shadowRoot.querySelector('.modal-embedded-cards');
    this.$embeddedRing = this.shadowRoot.querySelector('.modal-embedded-ring');
    this.$grid = this.shadowRoot.querySelector('.profiles-strip');
    this.$pills = this.shadowRoot.querySelector('.policy-pills');
    this.$drawer = this.shadowRoot.querySelector('.auth-drawer');
    this.$drawerSpotlight = this.shadowRoot.querySelector('.drawer-hero-spotlight');
    this.$drawerHeader = this.shadowRoot.querySelector('.drawer-header');
    this.$drawerBody = this.shadowRoot.querySelector('.drawer-body');
    this.$feedback = this.shadowRoot.querySelector('.feedback-msg');
    this.$forgotBtn = this.shadowRoot.querySelector('.forgot-link');

    this._onConnectivityChange = () => {
      this.renderBadge();
      this.renderOfflineBanner();
      if (!isAirplaneModeActive()) {
        PuffinLogin.flushOfflineOutbox().catch(() => {});
      }
    };
  }

  t() {
    return I18N[this.config.lang] || I18N.en;
  }

  connectedCallback() {
    ensureDummyScoresSeeded(false);
    ensureOfflineSeedCached(false);
    this.syncConfigFromAttributes();
    detectClientTelemetry(this.config).catch(() => {});
    this.ensureActiveSession();
    this.renderBadge();
    this.renderModalContent();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._onConnectivityChange);
      window.addEventListener('offline', this._onConnectivityChange);
      window.addEventListener('puffin-connectivity-changed', this._onConnectivityChange);
    }

    this.$badgeBtn.addEventListener('click', () => this.openModal({ tab: 'login' }));
    this.$quickScoresBtn?.addEventListener('click', () => this.openScores());
    this.$quickCardsBtn?.addEventListener('click', () => this.openCards());
    this.$quickRingBtn?.addEventListener('click', () => this.openRing());

    this.$tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-modal-tab') || 'login';
        this.switchModalTab(targetTab);
      });
    });

    this.shadowRoot.querySelector('[data-dock-action="open-scores"]')?.addEventListener('click', () => {
      this.switchModalTab('scores');
    });
    this.shadowRoot.querySelector('[data-dock-action="open-cards"]')?.addEventListener('click', () => {
      this.switchModalTab('cards');
    });
    this.shadowRoot.querySelector('[data-dock-action="open-ring"]')?.addEventListener('click', () => {
      this.switchModalTab('ring');
    });

    this.$scoresScopeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.scoresScope = btn.getAttribute('data-scores-scope') === 'ALL' ? 'ALL' : 'game';
        this._syncEmbeddedWidgets();
      });
    });

    this.$langBtn.addEventListener('click', () => {
      const nextLang = this.config.lang === 'en' ? 'it' : 'en';
      this.setLang(nextLang);
    });
    this.$logoutBtn.addEventListener('click', () => this.logout());
    this.$closeBtn.addEventListener('click', () => {
      if (this.getCurrentUser() !== null || !this.config.requireLogin) {
        this.$dialog.close();
      }
    });
    this.$forgotBtn.addEventListener('click', () => this.triggerForgotPassword());

    // Prevent Esc from closing mandatory login dialog when identity === NULL
    this.$dialog.addEventListener('cancel', (e) => {
      if (this.getCurrentUser() === null && this.config.requireLogin) {
        e.preventDefault();
      }
    });

    // If mandatory login is enabled and identity is NULL, open login modal immediately (only for primary / p1 slot so dual slots don't clash)!
    const isSecondarySlot = Boolean(this.config.playerSlot && this.config.playerSlot !== 'p1');
    if (this.getCurrentUser() === null && this.config.requireLogin && !isSecondarySlot) {
      setTimeout(() => {
        if (this.getCurrentUser() === null && !this.$dialog.open) {
          this.openModal({ tab: 'login' });
        }
      }, 40);
    }
  }

  disconnectedCallback() {
    if (this._jamTimer) clearInterval(this._jamTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this._onConnectivityChange);
      window.removeEventListener('offline', this._onConnectivityChange);
      window.removeEventListener('puffin-connectivity-changed', this._onConnectivityChange);
    }
  }

  attributeChangedCallback() {
    if (!this.isConnected) return;
    this.syncConfigFromAttributes();
    this.ensureActiveSession();
    this.renderBadge();
    this.renderModalContent();
    if (this.selectedCandidate) {
      this.selectCandidate(this.selectedCandidate);
    }
  }

  setLang(lang) {
    const clean = String(lang || 'en').toLowerCase().startsWith('it') ? 'it' : 'en';
    this.config.lang = clean;
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, clean);
    } catch {}
    this.setAttribute('lang', clean);
    this.renderBadge();
    this.renderModalContent();
    if (this.selectedCandidate) {
      this.selectCandidate(this.selectedCandidate);
    }
    window.dispatchEvent(new CustomEvent('puffin-lang-changed', { detail: { lang: clean } }));
  }

  syncConfigFromAttributes() {
    const overrides = {};
    if (this.hasAttribute('app-id')) overrides.appId = this.getAttribute('app-id');
    if (this.hasAttribute('accept-guest')) overrides.acceptGuest = this.getAttribute('accept-guest');
    if (this.hasAttribute('require-strong-auth')) {
      overrides.requireStrongAuth = this.getAttribute('require-strong-auth');
    }
    if (this.hasAttribute('mature-only')) overrides.matureOnly = this.getAttribute('mature-only');
    if (this.hasAttribute('allowed-users')) overrides.allowedUsers = this.getAttribute('allowed-users');
    if (this.hasAttribute('avatar-shape')) overrides.avatarShape = this.getAttribute('avatar-shape');
    if (this.hasAttribute('lang')) overrides.lang = this.getAttribute('lang');
    if (this.hasAttribute('require-login')) overrides.requireLogin = this.getAttribute('require-login');
    if (this.hasAttribute('player-slot')) overrides.playerSlot = this.getAttribute('player-slot');
    if (this.hasAttribute('default-user')) overrides.defaultUser = this.getAttribute('default-user');
    if (this.hasAttribute('player-label')) overrides.playerLabel = this.getAttribute('player-label');
    this.config = resolvePuffinConfig(overrides);
  }

  getSlotTag() {
    if (this.config?.playerLabel) return this.config.playerLabel;
    if (this.config?.playerSlot) return this.config.playerSlot.toUpperCase();
    return null;
  }

  _readLockoutMap() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCKOUT);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _writeLockoutMap(map) {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCKOUT, JSON.stringify(map));
    } catch {}
  }

  getLockoutStatus(userId) {
    const map = this._readLockoutMap();
    const rec = map[userId] || { attempts: 0, jammedUntil: 0 };
    const now = Date.now();
    if (rec.jammedUntil && now >= rec.jammedUntil) {
      delete map[userId];
      this._writeLockoutMap(map);
      return { attempts: 0, jammed: false, remainingSec: 0 };
    }
    const jammed = rec.attempts >= MAX_FAILED_ATTEMPTS && rec.jammedUntil > now;
    const remainingSec = jammed ? Math.ceil((rec.jammedUntil - now) / 1000) : 0;
    return { attempts: rec.attempts || 0, jammed, remainingSec };
  }

  recordFailedAttempt(userId) {
    const map = this._readLockoutMap();
    const prev = map[userId] || { attempts: 0, jammedUntil: 0 };
    const attempts = (prev.attempts || 0) + 1;
    const jammedUntil = attempts >= MAX_FAILED_ATTEMPTS ? Date.now() + JAM_COOLDOWN_MS : 0;
    map[userId] = { attempts, jammedUntil };
    this._writeLockoutMap(map);
    const status = this.getLockoutStatus(userId);
    window.dispatchEvent(
      new CustomEvent('puffin-auth-attempt', {
        detail: { userId, success: false, ...status },
      })
    );
    return status;
  }

  resetLockout(userId) {
    const map = this._readLockoutMap();
    if (userId) {
      delete map[normalizeProfileId(userId)];
    } else {
      for (const k of Object.keys(map)) delete map[k];
    }
    this._writeLockoutMap(map);
    this.pinBuffer = '';
    this.renderModalContent();
    if (this.selectedCandidate) {
      this.selectCandidate(this.selectedCandidate);
    }
  }

  evaluatePolicy(profile) {
    if (!profile) return { allowed: false, reason: 'Not logged in' };
    if (this.config.allowedUsers && this.config.allowedUsers !== '*') {
      const allowSet = this.config.allowedUsers
        .split(',')
        .map((s) => normalizeProfileId(s))
        .filter(Boolean);
      if (!allowSet.includes(profile.id)) {
        return { allowed: false, reason: 'Not allowed' };
      }
    }
    if (profile.role === 'guest' && !this.config.acceptGuest) {
      return { allowed: false, reason: 'No Guest' };
    }
    if (this.config.matureOnly && (profile.role === 'kid' || profile.role === 'guest')) {
      return { allowed: false, reason: 'Adults Only 🔞' };
    }
    if (this.config.requireStrongAuth && profile.authType !== 'password') {
      return { allowed: false, reason: 'Strong Auth 🔒' };
    }
    return { allowed: true, reason: null };
  }

  ensureActiveSession() {
    const current = this.getCurrentUser();
    if (current && !this.evaluatePolicy(current).allowed) {
      // Current user is disallowed by new policy -> reset identity to NULL and require fresh login!
      this.logout(true);
    }
  }

  /**
   * Returns the active login session object (with `source_ip`, `ip_address`, `hostname`, `device`, `logged_at`),
   * or `null` if unauthenticated (`identity === NULL`). Supports Dual / Multi-Player slots (`player-slot="p1"` / `"p2"`).
   */
  getAuthSession() {
    return getSlotAuthSession(this.config?.playerSlot, {
      appId: this.config?.appId,
      hostname: this.config?.hostname,
      ipAddress: this.config?.ipAddress || _telemetryCache.ipAddress,
    });
  }

  /**
   * Returns the authenticated profile object (enriched with `source_ip`, `ip_address`, `hostname`, `device`, `logged_at`, `player_slot`),
   * or `null` if not logged in (`identity === NULL`).
   */
  getCurrentUser() {
    return getSlotCurrentUser(this.config?.playerSlot, {
      appId: this.config?.appId,
      hostname: this.config?.hostname,
      ipAddress: this.config?.ipAddress || _telemetryCache.ipAddress,
    });
  }

  logout(emitEvent = true) {
    const prev = this.getCurrentUser();
    const slot = this.config?.playerSlot || null;
    try {
      if (slot) {
        const map = readSlotSessionsMap();
        map[slot] = null;
        localStorage.setItem(STORAGE_KEYS.AUTH_SLOTS, JSON.stringify(map));
      }
      if (!slot || slot === 'p1') {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    } catch {}
    this.selectedCandidate = null;
    this.highlightGuest = false;
    this.renderBadge();
    this.renderModalContent();
    this.$drawer.hidden = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('puffin-auth-updated', { detail: { user: null, session: null, playerSlot: slot } })
      );
    }
    if (emitEvent) {
      this.dispatchEvent(
        new CustomEvent('puffin-user-changed', {
          detail: { user: null, previousUser: prev, session: null, playerSlot: slot },
          bubbles: true,
          composed: true,
        })
      );
      for (const cb of this.listeners) {
        try {
          cb(null, prev, slot);
        } catch {}
      }
    }
    const isSecondarySlot = Boolean(slot && slot !== 'p1');
    if (this.config.requireLogin && !isSecondarySlot && !this.$dialog.open) {
      this.openModal();
    }
  }

  _persistLocalLoginSession(session) {
    const slot = this.config?.playerSlot || session?.player_slot || null;
    try {
      if (slot) {
        writeSlotSession(slot, session);
      }
      if (!slot || slot === 'p1') {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
      }
      const rawList = localStorage.getItem(STORAGE_KEYS.LOGINS);
      const list = rawList ? JSON.parse(rawList) : [];
      const arr = Array.isArray(list) ? list : [];
      const idx = arr.findIndex((item) => item && item.id === session.id);
      if (idx >= 0) {
        arr[idx] = session;
      } else {
        arr.unshift(session);
      }
      localStorage.setItem(STORAGE_KEYS.LOGINS, JSON.stringify(arr.slice(0, 100)));
    } catch {}
  }

  async _syncLoginTelemetry(initialSession) {
    try {
      const telemetry = await detectClientTelemetry(this.config);
      let enriched = validateAndNormalizeLoginPayload(
        {
          ...initialSession,
          hostname: initialSession.hostname || telemetry.hostname,
          source_ip: telemetry.source_ip,
          ip_address: telemetry.ip_address,
          device: telemetry.device,
        },
        telemetry
      );
      this._persistLocalLoginSession(enriched);

      if (typeof fetch === 'function') {
        const res = await fetch(`${this.config.apiUrl}/logins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enriched),
        });
        if (res.ok) {
          const data = await res.json();
          const serverIp = String(data?.source_ip || data?.ip_address || data?.login?.source_ip || '').trim();
          if (serverIp) {
            _telemetryCache.ipAddress = serverIp;
            enriched = validateAndNormalizeLoginPayload(
              {
                ...enriched,
                ...(data?.login || {}),
                source_ip: serverIp,
                ip_address: serverIp,
              },
              telemetry
            );
            this._persistLocalLoginSession(enriched);
          }
        }
      }

      if (typeof window !== 'undefined') {
        const activeUser = this.getCurrentUser();
        window.dispatchEvent(new CustomEvent('puffin-login-recorded', { detail: enriched }));
        if (activeUser && activeUser.id === enriched.userId) {
          window.dispatchEvent(
            new CustomEvent('puffin-auth-updated', { detail: { user: activeUser, session: enriched } })
          );
        }
      }
      return enriched;
    } catch {
      return initialSession;
    }
  }

  saveActiveSession(userId, emitEvent = true, options = {}) {
    const prev = this.getCurrentUser();
    const id = normalizeProfileId(userId, true);
    if (!id) {
      this.logout(emitEvent);
      return null;
    }
    const baseProfile = PUFFIN_PROFILES.find((p) => p.id === id) || PUFFIN_PROFILES[0];
    const guestName =
      baseProfile.id === 'guest'
        ? normalizeGuestName(options.guest_name ?? options.guestName ?? this.guestNameBuffer)
        : null;
    if (baseProfile.id === 'guest') {
      try {
        if (guestName) {
          localStorage.setItem(STORAGE_KEYS.GUEST_NAME, guestName);
        } else {
          localStorage.removeItem(STORAGE_KEYS.GUEST_NAME);
        }
      } catch {}
    }
    const nowIso = new Date().toISOString();
    const initialIp =
      this.config.ipAddress ||
      (typeof window !== 'undefined' &&
        (window.PUFFINLOGIN_ENV?.source_ip || window.PUFFINLOGIN_ENV?.ipAddress)) ||
      _telemetryCache.ipAddress ||
      '127.0.0.1';
    const initialHost =
      this.config.hostname ||
      (typeof window !== 'undefined' &&
        (window.PUFFINLOGIN_ENV?.hostname || window.location?.hostname)) ||
      '';
    const initialDevice =
      (typeof navigator !== 'undefined' &&
        (navigator.userAgentData?.platform || navigator.platform)) ||
      'Browser';

    const offlineNow = Boolean(options.offline_verified ?? isAirplaneModeActive());
    const seedUsed =
      options.seed_used || options.seedUsed || (offlineNow ? PUFFIN_OFFLINE_SEED : null);
    const offlineWarning =
      options.offline_warning ||
      options.offlineWarning ||
      (offlineNow ? this.t().offlineBannerBody(seedUsed || PUFFIN_OFFLINE_SEED) : null);

    const slot = this.config?.playerSlot || null;
    const session = validateAndNormalizeLoginPayload({
      id: `lgn_${Date.now()}_${baseProfile.id}${slot ? `_${slot}` : ''}`,
      player_id: baseProfile.id,
      player_slot: slot,
      guest_name: guestName,
      app_id: this.config.appId,
      logged_at: nowIso,
      source_ip: initialIp,
      ip_address: initialIp,
      hostname: initialHost === 'localhost' || initialHost === '127.0.0.1' ? '' : initialHost,
      device: initialDevice,
      auth_method: baseProfile.authType || 'none',
      offline_verified: offlineNow,
      auth_mode: offlineNow ? 'offline_md5_seed' : 'online',
      seed_used: seedUsed,
      offline_warning: offlineWarning,
    });

    this._persistLocalLoginSession(session);
    if (!offlineNow) {
      this._syncLoginTelemetry(session);
    }

    const next = this.getCurrentUser() || {
      ...baseProfile,
      player_slot: slot,
      playerSlot: slot,
      guest_name: guestName,
      guestName,
      displayName: guestName ? `${baseProfile.shortName} (${guestName})` : baseProfile.displayName,
      shortName: guestName ? `${baseProfile.shortName} (${guestName})` : baseProfile.shortName,
      loggedAt: session.loggedAt,
      logged_at: session.logged_at,
      appId: session.appId,
      app_id: session.app_id,
      source_ip: session.source_ip,
      ip_address: session.ip_address,
      ipAddress: session.ipAddress,
      hostname: session.hostname,
      device: session.device,
      offline_verified: offlineNow,
      offlineVerified: offlineNow,
      auth_mode: session.auth_mode,
      seed_used: session.seed_used,
      offline_warning: session.offline_warning,
    };

    this.highlightGuest = false;
    this.renderBadge();
    this.renderModalContent();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('puffin-auth-updated', { detail: { user: next, session, playerSlot: slot } })
      );
      window.dispatchEvent(new CustomEvent('puffin-login-recorded', { detail: session }));
    }
    if (emitEvent) {
      this.dispatchEvent(
        new CustomEvent('puffin-user-changed', {
          detail: { user: next, previousUser: prev, session, playerSlot: slot },
          bubbles: true,
          composed: true,
        })
      );
      for (const cb of this.listeners) {
        try {
          cb(next, prev, slot);
        } catch {}
      }
    }
    return next;
  }

  renderBadge() {
    const user = this.getCurrentUser();
    const tr = this.t();
    const slotTag = this.getSlotTag();
    const isOffline = isAirplaneModeActive() || Boolean(user?.offline_verified);
    if (this.$badgeOfflineIcon) {
      this.$badgeOfflineIcon.hidden = !isOffline;
    }
    if (!user) {
      // Unauthenticated (identity === NULL)
      this.$badgeBtn.dataset.userId = 'null';
      this.$badgeBtn.style.setProperty('--active-color', '#F97316');
      this.$badgeBtn.style.setProperty('--active-glow', 'rgba(249, 115, 22, 0.35)');
      this.$badgeImg.hidden = true;
      this.$badgeLock.hidden = false;
      this.$badgeName.textContent = slotTag ? `${slotTag} • ${tr.badgeLogin}` : tr.badgeLogin;
      return;
    }
    // Ultra-minimalist badge: ONLY Icon + Name (plus ✈️ indicator if offline!)
    this.$badgeBtn.dataset.userId = user.id;
    this.$badgeBtn.style.setProperty('--active-color', user.colorHex);
    this.$badgeBtn.style.setProperty('--active-glow', user.glowHex);
    this.$badgeImg.src = `${this.config.assetBaseUrl}/${user.avatar}`.replace(/\/\//g, '/');
    this.$badgeImg.alt = user.shortName;
    this.$badgeImg.hidden = false;
    this.$badgeLock.hidden = true;
    if (user.role === 'bot') {
      this.$badgeName.innerHTML = `<tt class="robot-tt">${user.shortName}</tt>`;
    } else {
      this.$badgeName.textContent = user.shortName;
    }
  }

  renderOfflineBanner() {
    if (!this.$offlineBanner) return;
    const tr = this.t();
    const session = this.getAuthSession();
    const offlineActive = isAirplaneModeActive() || Boolean(session?.offline_verified);
    const seedBundle = ensureOfflineSeedCached(false);
    const seedName = session?.seed_used || seedBundle?.seed || PUFFIN_OFFLINE_SEED;
    this.$offlineBanner.hidden = !offlineActive;
    if (offlineActive) {
      if (this.$offlineBannerTitle) {
        this.$offlineBannerTitle.textContent = tr.offlineBannerTitle;
      }
      if (this.$offlineBannerBody) {
        this.$offlineBannerBody.textContent = tr.offlineBannerBody(seedName);
      }
    }
  }

  _syncEmbeddedWidgets() {
    const tr = this.t();
    const gameId = this.config?.appId || 'puffin-login';
    if (this.$scoresScopeBtns?.length) {
      this.$scoresScopeBtns.forEach((btn) => {
        const sc = btn.getAttribute('data-scores-scope');
        const isAct = sc === this.scoresScope;
        btn.classList.toggle('active', isAct);
        btn.textContent = sc === 'ALL' ? tr.scopeAllGames : tr.scopeCurrentGame(gameId);
      });
    }
    if (this.$embeddedLeaderboard) {
      const targetFilter = this.scoresScope === 'ALL' ? 'ALL' : gameId;
      if (this.$embeddedLeaderboard.getAttribute('filter-game') !== targetFilter) {
        this.$embeddedLeaderboard.setAttribute('filter-game', targetFilter);
      }
      if (typeof this.$embeddedLeaderboard.refresh === 'function') {
        this.$embeddedLeaderboard.refresh();
      }
    }
    if (this.$embeddedRing) {
      const ringBg = `${this.config.assetBaseUrl}/assets/puffin-ring.png`.replace(/\/\//g, '/');
      if (this.$embeddedRing.getAttribute('bg-src') !== ringBg) {
        this.$embeddedRing.setAttribute('bg-src', ringBg);
      }
      if (typeof this.$embeddedRing.render === 'function') {
        this.$embeddedRing.render();
      }
    }
    if (this.$embeddedCards && typeof this.$embeddedCards.render === 'function') {
      this.$embeddedCards.render();
    }
  }

  switchModalTab(tabName = 'login') {
    const cleanTab =
      tabName === 'scores' || tabName === 'cards' || tabName === 'ring' ? tabName : 'login';
    this.activeTab = cleanTab;
    this.$dialog?.setAttribute('data-active-tab', cleanTab);
    this.$tabBtns?.forEach((btn) => {
      const isMatch = btn.getAttribute('data-modal-tab') === cleanTab;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    this.$tabPanels?.forEach((panel) => {
      const isMatch = panel.getAttribute('data-tab-panel') === cleanTab;
      panel.hidden = !isMatch;
    });
    this._syncEmbeddedWidgets();
  }

  openScores(scope = null) {
    if (scope === 'ALL' || scope === 'game') {
      this.scoresScope = scope;
    }
    this.openModal({ tab: 'scores', scoresScope: this.scoresScope });
  }

  openCards({ playerId = null, gameId = null } = {}) {
    if (this.$embeddedCards) {
      if (playerId) this.$embeddedCards.setAttribute('player-id', playerId);
      if (gameId) this.$embeddedCards.setAttribute('game-id', gameId);
    }
    this.openModal({ tab: 'cards' });
  }

  openRing() {
    this.openModal({ tab: 'ring' });
  }

  _startCardVideo(card) {
    const vid = card.querySelector('.card-avatar-video');
    if (!vid || vid.dataset.failed === '1') return;
    if (!vid.src && vid.dataset.src) {
      vid.src = vid.dataset.src;
      vid.addEventListener(
        'error',
        () => {
          vid.dataset.failed = '1';
          card.classList.remove('video-playing');
        },
        { once: true }
      );
      vid.addEventListener('playing', () => {
        card.classList.add('video-playing');
      });
    }
    const p = vid.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  }

  _stopCardVideo(card, keepIfSelected = true) {
    if (keepIfSelected && card.classList.contains('selected')) return;
    const vid = card.querySelector('.card-avatar-video');
    if (!vid) return;
    card.classList.remove('video-playing');
    try {
      vid.pause();
    } catch {}
  }

  renderModalContent() {
    const tr = this.t();
    const activeUser = this.getCurrentUser();
    const slotTag = this.config.playerSlot
      ? this.config.playerLabel || this.config.playerSlot.toUpperCase()
      : '';

    this.$title.textContent = slotTag ? `${tr.modalTitle} (${slotTag})` : tr.modalTitle;
    this.$sub.textContent = tr.modalSub;
    this.$sub.hidden = !tr.modalSub;
    this.$langBtn.textContent = this.config.lang === 'en' ? '🇬🇧 EN' : '🇮🇹 IT';
    this.$logoutBtn.hidden = !activeUser;
    this.$logoutBtn.textContent = tr.logoutBtn;
    // Hide close button if login is mandatory and identity is still NULL
    this.$closeBtn.hidden = !activeUser && this.config.requireLogin;
    this.$dialog.setAttribute('closedby', !activeUser && this.config.requireLogin ? 'none' : 'any');

    if (this.$tabLabelLogin) this.$tabLabelLogin.textContent = tr.tabLogin;
    if (this.$tabLabelScores) this.$tabLabelScores.textContent = tr.tabScores;
    if (this.$tabLabelCards) this.$tabLabelCards.textContent = tr.tabCards;
    if (this.$tabLabelRing) this.$tabLabelRing.textContent = tr.tabRing;
    if (this.$dockScoresLabel) {
      this.$dockScoresLabel.textContent = tr.dockScoresBtn.replace(/^🏆\s*/, '');
    }
    if (this.$dockCardsLabel) {
      this.$dockCardsLabel.textContent = tr.dockCardsBtn.replace(/^🃏\s*/, '');
    }
    if (this.$dockRingLabel) {
      const ringCount = getPuffinRingApps({ includeCandidates: true }).length;
      this.$dockRingLabel.textContent = tr.dockRingBtn(ringCount).replace(/^🔥💍\s*/, '');
    }

    const pills = [`<span class="policy-pill">🐧 v${PUFFIN_LOGIN_VERSION}</span>`];
    if (slotTag) {
      pills.push(`<span class="policy-pill">🎮 ${slotTag}</span>`);
    }
    if (isAirplaneModeActive() || activeUser?.offline_verified) {
      pills.push(`<span class="policy-pill warn">✈️ Offline MD5+Seed</span>`);
    }
    if (!this.config.acceptGuest) pills.push(`<span class="policy-pill warn">No Guest</span>`);
    if (this.config.requireStrongAuth) pills.push(`<span class="policy-pill warn">Strong Auth</span>`);
    if (this.config.matureOnly) pills.push(`<span class="policy-pill warn">Adults Only</span>`);
    this.$pills.innerHTML = pills.join('');
    this.$pills.hidden = pills.length === 0;

    this.renderOfflineBanner();
    this._syncEmbeddedWidgets();

    // Discover other slot occupants on the page for visual awareness in Dual Login mode
    const otherSlotOccupants = new Map();
    if (this.config.playerSlot && typeof document !== 'undefined') {
      document.querySelectorAll('puffin-login[player-slot]').forEach((el) => {
        if (el === this) return;
        const otherSlot = normalizePlayerSlot(el.getAttribute('player-slot'));
        const otherUser = typeof el.getCurrentUser === 'function' ? el.getCurrentUser() : null;
        if (otherSlot && otherUser?.id && otherUser.id !== 'guest') {
          otherSlotOccupants.set(otherUser.id, otherSlot.toUpperCase());
        }
      });
    }

    this.$grid.innerHTML = '';

    for (const p of PUFFIN_PROFILES) {
      const policy = this.evaluatePolicy(p);
      const lock = this.getLockoutStatus(p.id);
      const isSelected = (this.selectedCandidate?.id || activeUser?.id) === p.id;
      const isGuestHighlighted = p.id === 'guest' && this.highlightGuest && policy.allowed;
      const otherSlotBadge = otherSlotOccupants.get(p.id) || '';

      const card = document.createElement('button');
      card.type = 'button';
      card.dataset.profileId = p.id;
      card.className = `profile-card ${isSelected ? 'selected' : ''} ${
        isGuestHighlighted ? 'guest-highlight' : ''
      }`;
      card.style.setProperty('--card-color', p.colorHex);
      card.style.setProperty('--card-glow', p.glowHex);
      card.style.setProperty('--face-y', p.faceFocusY || '24%');
      if (!policy.allowed) {
        card.disabled = true;
        card.title = policy.reason;
      }

      const imgSrc = `${this.config.assetBaseUrl}/${p.avatar}`.replace(/\/\//g, '/');
      const videoSrc = p.video
        ? `${this.config.assetBaseUrl}/${p.video}`.replace(/\/\//g, '/')
        : '';
      const isBot = p.role === 'bot';
      const nameHtml = isBot ? `<tt class="robot-tt">${p.shortName}</tt>` : p.shortName;
      const botTooltipHtml = isBot
        ? `<span class="bot-only-tooltip">🤖 This is for bots not for you!</span>`
        : '';
      if (isBot) {
        card.title = 'This is for bots not for you!';
      }

      card.innerHTML = `
        ${lock.jammed ? '<span class="jam-badge" title="Jammed!">!</span>' : ''}
        ${otherSlotBadge ? `<span class="slot-occupant-pill" title="Active on ${otherSlotBadge}">${otherSlotBadge}</span>` : ''}
        ${botTooltipHtml}
        <div class="card-avatar-frame">
          <img class="card-avatar-img" src="${imgSrc}" alt="${p.shortName}" loading="lazy" />
          ${
            videoSrc
              ? `<video class="card-avatar-video" data-src="${videoSrc}" muted loop playsinline preload="none"></video>`
              : ''
          }
        </div>
        <div class="card-name">${nameHtml}</div>
      `;

      if (isBot) {
        card.addEventListener('mouseenter', () => this._startCardVideo(card));
        card.addEventListener('focus', () => this._startCardVideo(card));
        card.addEventListener('mouseleave', () => this._stopCardVideo(card, false));
        card.addEventListener('blur', () => this._stopCardVideo(card, false));
        card.addEventListener('click', (e) => {
          e.preventDefault();
          playTone(220, 80, 'square');
          setTimeout(() => playTone(165, 110, 'square'), 90);
          card.classList.add('bot-tooltip-flash');
          setTimeout(() => card.classList.remove('bot-tooltip-flash'), 1800);
        });
      } else if (policy.allowed) {
        card.addEventListener('click', () => this.selectCandidate(p));
        card.addEventListener('mouseenter', () => this._startCardVideo(card));
        card.addEventListener('focus', () => this._startCardVideo(card));
        card.addEventListener('mouseleave', () => this._stopCardVideo(card, true));
        card.addEventListener('blur', () => this._stopCardVideo(card, true));
      }
      this.$grid.appendChild(card);

      if (isSelected && policy.allowed && !isBot) {
        setTimeout(() => this._startCardVideo(card), 50);
      }

      // Row 1: Riccardo, Kate, Ale, Seby (4 cols)
      // Row 2: Nonna Lucilla (col 1), [empty spacer] (col 2), Guest (col 3), bot (col 4)
      if (p.id === 'lucilla') {
        const spacer = document.createElement('div');
        spacer.className = 'profile-grid-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        this.$grid.appendChild(spacer);
      }
    }
  }

  openModal(preselectOrOptions = null) {
    let targetTab = 'login';
    let preselectUserId = null;
    if (preselectOrOptions && typeof preselectOrOptions === 'object') {
      targetTab = preselectOrOptions.tab || 'login';
      preselectUserId = preselectOrOptions.userId || null;
      if (preselectOrOptions.scoresScope) {
        this.scoresScope = preselectOrOptions.scoresScope;
      }
    } else if (typeof preselectOrOptions === 'string') {
      if (
        preselectOrOptions === 'scores' ||
        preselectOrOptions === 'cards' ||
        preselectOrOptions === 'ring'
      ) {
        targetTab = preselectOrOptions;
      } else {
        preselectUserId = preselectOrOptions;
      }
    }

    if (!preselectUserId && !this.getCurrentUser() && this.config.defaultUser) {
      preselectUserId = this.config.defaultUser;
    }

    if (preselectUserId) {
      const found = PUFFIN_PROFILES.find((p) => p.id === normalizeProfileId(preselectUserId));
      if (found && found.role !== 'bot' && this.evaluatePolicy(found).allowed) {
        this.selectCandidate(found);
      }
    } else {
      this.selectedCandidate = null;
      this.$drawer.hidden = true;
      this.$feedback.textContent = '';
      this.renderModalContent();
    }
    this.switchModalTab(targetTab);
    if (typeof this.$dialog.showModal === 'function' && !this.$dialog.open) {
      this.$dialog.showModal();
    }
  }

  selectCandidate(profile, instantGuest = false) {
    if (!profile || profile.role === 'bot') return;
    if (this._jamTimer) {
      clearInterval(this._jamTimer);
      this._jamTimer = null;
    }
    const tr = this.t();
    this.selectedCandidate = profile;
    this.pinBuffer = '';
    this.showPassword = false;
    this.$feedback.textContent = '';
    this.$feedback.className = 'feedback-msg';
    this.renderModalContent();

    if (profile.authType === 'none' && instantGuest) {
      playTone(660, 90, 'triangle');
      this.saveActiveSession(profile.id, true);
      this.$dialog.close();
      return;
    }

    const lock = this.getLockoutStatus(profile.id);
    this.$drawer.hidden = false;
    this.$drawer.classList.toggle('jammed', lock.jammed);
    this.$drawer.style.setProperty('--drawer-color', profile.colorHex);
    this.$drawer.style.setProperty('--drawer-glow', profile.glowHex);

    // Populate the 3x3 (174x174px) Hero Spotlight Stage on the left of .auth-drawer!
    const imgSrc = `${this.config.assetBaseUrl}/${profile.avatar}`.replace(/\/\//g, '/');
    const videoSrc = profile.video
      ? `${this.config.assetBaseUrl}/${profile.video}`.replace(/\/\//g, '/')
      : '';
    this.$drawerSpotlight.innerHTML = `
      <div class="drawer-hero-frame" data-hero-id="${profile.id}">
        <img class="drawer-hero-img" src="${imgSrc}" alt="${profile.shortName}" />
        ${
          videoSrc
            ? `<video class="drawer-hero-video" src="${videoSrc}" autoplay muted loop playsinline></video>`
            : ''
        }
      </div>
      <span class="drawer-hero-class">${profile.emoji || ''} ${profile.rpgClass || ''}</span>
    `;
    const $spotVid = this.$drawerSpotlight.querySelector('.drawer-hero-video');
    if ($spotVid) {
      $spotVid.addEventListener('error', () => $spotVid.remove(), { once: true });
      const playPromise = $spotVid.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }

    if (profile.authType === 'none') {
      let savedGuestName = '';
      try {
        let slotGuest = '';
        if (this.config.playerSlot && typeof localStorage !== 'undefined') {
          const rawSlotGuests = localStorage.getItem(STORAGE_KEYS.GUEST_NAME_SLOTS);
          const slotMap = rawSlotGuests ? JSON.parse(rawSlotGuests) : {};
          slotGuest = slotMap?.[this.config.playerSlot] || '';
        }
        savedGuestName =
          this.getAuthSession()?.guest_name ||
          slotGuest ||
          (!this.config.playerSlot ? localStorage.getItem(STORAGE_KEYS.GUEST_NAME) : '') ||
          '';
      } catch {}
      const cleanInitialGuest = normalizeGuestName(savedGuestName) || '';
      const initialBtnText = cleanInitialGuest
        ? tr.playAsGuestNamedBtn(cleanInitialGuest)
        : tr.playAsGuestBtn;

      this.$drawerHeader.innerHTML = `
        <span><strong>${profile.shortName}</strong></span>
        <span class="attempts-pill">1-Click + Bragging</span>
      `;
      this.$forgotBtn.hidden = true;
      this.$drawerBody.innerHTML = `
        <form class="guest-brag-form" id="guest-login-form">
          <label class="guest-brag-label" for="guest-name-input">${tr.guestNameLabel}</label>
          <input
            type="text"
            id="guest-name-input"
            name="guest_name"
            class="pwd-input guest-name-input"
            placeholder="${tr.guestNamePlaceholder}"
            maxlength="32"
            autocomplete="nickname"
          />
          <button type="submit" class="action-btn" id="confirm-guest-btn" style="width:100%;padding:0.65rem 1rem;font-size:0.95rem;">
            🐧 <span id="confirm-guest-btn-label">${initialBtnText}</span>
          </button>
        </form>
      `;
      const $gForm = this.$drawerBody.querySelector('#guest-login-form');
      const $gInput = this.$drawerBody.querySelector('#guest-name-input');
      const $gLabel = this.$drawerBody.querySelector('#confirm-guest-btn-label');
      if ($gInput) {
        $gInput.value = cleanInitialGuest;
        setTimeout(() => $gInput.focus(), 30);
        $gInput.addEventListener('input', () => {
          const typed = normalizeGuestName($gInput.value);
          if ($gLabel) {
            $gLabel.textContent = typed ? tr.playAsGuestNamedBtn(typed) : tr.playAsGuestBtn;
          }
        });
      }
      $gForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        playTone(660, 90, 'triangle');
        const guestName = normalizeGuestName($gInput?.value);
        this.saveActiveSession(profile.id, true, { guest_name: guestName });
        this.$dialog.close();
      });
      return;
    }

    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - lock.attempts);
    const pillClass = lock.jammed || lock.attempts >= 2 ? 'attempts-pill danger' : 'attempts-pill';
    const pillText = lock.jammed
      ? tr.jammedPill(lock.remainingSec)
      : tr.attemptsLabel(lock.attempts, MAX_FAILED_ATTEMPTS, attemptsLeft);

    this.$drawerHeader.innerHTML = `
      <span><strong>${profile.shortName}</strong></span>
      <span class="${pillClass}">${pillText}</span>
    `;

    this.$forgotBtn.hidden = !profile.email;
    this.$forgotBtn.textContent = tr.forgotLink(profile.email);

    if (profile.authType === 'pin4') {
      this.renderKidsCutiePinPad(profile, lock);
    } else {
      this.renderAdultPasswordForm(profile, lock);
    }

    if (lock.jammed) {
      this._jamTimer = setInterval(() => {
        const fresh = this.getLockoutStatus(profile.id);
        if (!fresh.jammed) {
          clearInterval(this._jamTimer);
          this._jamTimer = null;
          this.selectCandidate(profile);
        } else {
          this.selectCandidate(profile);
        }
      }, 1000);
    }
  }

  _canUseGuestFallback() {
    const guestProfile = PUFFIN_PROFILES.find((p) => p.id === 'guest');
    return guestProfile && this.evaluatePolicy(guestProfile).allowed;
  }

  renderKidsCutiePinPad(profile, lock) {
    const tr = this.t();
    const boxesHtml = [0, 1, 2, 3]
      .map((i) => {
        if (lock.jammed) {
          return `<div class="pin-x-box jammed-box">💥</div>`;
        }
        const filled = i < this.pinBuffer.length;
        return `<div class="pin-x-box ${filled ? 'filled' : ''}">${filled ? 'X' : '•'}</div>`;
      })
      .join('');

    const keysOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'back'];
    const keysHtml = keysOrder
      .map((k) => {
        if (k === 'clear') {
          return `<button type="button" class="cutie-key ${lock.jammed ? 'jammed-key' : ''}" data-action="clear" title="Clear">🧹</button>`;
        }
        if (k === 'back') {
          return `<button type="button" class="cutie-key ${lock.jammed ? 'jammed-key' : ''}" data-action="back" title="Back">⌫</button>`;
        }
        const deco = KEY_DECORATIONS[k] || '✨';
        return `
          <button type="button" class="cutie-key ${lock.jammed ? 'jammed-key' : ''}" data-digit="${k}">
            <span>${k}</span>
            <span class="key-sub">${deco}</span>
          </button>
        `;
      })
      .join('');

    const guestBtnHtml = this._canUseGuestFallback()
      ? `<button type="button" class="guest-fallback-btn" data-action="switch-guest">${tr.playAsGuestBtn}</button>`
      : '';

    const jamBannerHtml = lock.jammed
      ? `
        <div class="jam-banner">
          <strong>${tr.jamTitlePin}</strong>
          ${tr.jamBody(lock.remainingSec)}
          <br/>
          <button type="button" class="unjam-btn" data-action="unjam">${tr.unjamBtn}</button>
          ${guestBtnHtml}
        </div>
      `
      : '';

    this.$drawerBody.innerHTML = `
      <div class="pin-xxxx-row" aria-label="4-digit PIN X X X X">${boxesHtml}</div>
      ${jamBannerHtml}
      <div class="cutie-numpad">${keysHtml}</div>
    `;

    this.$drawerBody.querySelector('[data-action="unjam"]')?.addEventListener('click', () => {
      playTone(620, 90, 'triangle');
      this.resetLockout(profile.id);
    });

    this.$drawerBody.querySelector('[data-action="switch-guest"]')?.addEventListener('click', () => {
      const guest = PUFFIN_PROFILES.find((p) => p.id === 'guest');
      if (guest) this.selectCandidate(guest);
    });

    this.$drawerBody.querySelectorAll('.cutie-key').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (lock.jammed) {
          playJammedSound();
          this.$feedback.textContent = this._canUseGuestFallback()
            ? tr.wrongPinGuest
            : tr.wrongPinNoGuest;
          this.$feedback.className = 'feedback-msg error';
          return;
        }

        const action = btn.getAttribute('data-action');
        if (action === 'clear') {
          playTone(330, 50, 'sine');
          this.pinBuffer = '';
          this.renderKidsCutiePinPad(profile, lock);
          return;
        }
        if (action === 'back') {
          playTone(370, 50, 'sine');
          this.pinBuffer = this.pinBuffer.slice(0, -1);
          this.renderKidsCutiePinPad(profile, lock);
          return;
        }

        const d = btn.getAttribute('data-digit');
        if (d !== null && this.pinBuffer.length < 4) {
          const stepNotes = [523.25, 587.33, 659.25, 783.99];
          playTone(stepNotes[this.pinBuffer.length] || 660, 75, 'triangle');
          this.pinBuffer += d;
          this.renderKidsCutiePinPad(profile, lock);

          if (this.pinBuffer.length === 4) {
            setTimeout(() => this.verifySecret(profile, this.pinBuffer), 140);
          }
        }
      });
    });
  }

  renderAdultPasswordForm(profile, lock) {
    const tr = this.t();
    const guestBtnHtml = this._canUseGuestFallback()
      ? `<button type="button" class="guest-fallback-btn" data-action="switch-guest">${tr.playAsGuestBtn}</button>`
      : '';

    if (lock.jammed) {
      this.$drawerBody.innerHTML = `
        <div class="jam-banner">
          <strong>${tr.jamTitlePwd}</strong>
          ${tr.jamBody(lock.remainingSec)}
          <br/>
          <button type="button" class="unjam-btn" data-action="unjam">${tr.unjamBtn}</button>
          ${guestBtnHtml}
        </div>
      `;
      this.$drawerBody.querySelector('[data-action="unjam"]')?.addEventListener('click', () => {
        this.resetLockout(profile.id);
      });
      this.$drawerBody.querySelector('[data-action="switch-guest"]')?.addEventListener('click', () => {
        const guest = PUFFIN_PROFILES.find((p) => p.id === 'guest');
        if (guest) this.selectCandidate(guest);
      });
      return;
    }

    this.$drawerBody.innerHTML = `
      <form class="pwd-row">
        <input
          type="${this.showPassword ? 'text' : 'password'}"
          class="pwd-input"
          placeholder="${tr.pwdPlaceholder(profile.shortName)}"
          autocomplete="current-password"
          required
        />
        <button type="button" class="icon-btn" title="Show/Hide">👁️</button>
        <button type="submit" class="action-btn">${tr.enterBtn}</button>
      </form>
    `;

    const $form = this.$drawerBody.querySelector('form');
    const $input = this.$drawerBody.querySelector('.pwd-input');
    const $eye = this.$drawerBody.querySelector('.icon-btn');

    setTimeout(() => $input?.focus(), 30);

    $eye.addEventListener('click', () => {
      this.showPassword = !this.showPassword;
      $input.type = this.showPassword ? 'text' : 'password';
    });

    $form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.verifySecret(profile, $input.value);
    });
  }

  async verifySecret(profile, inputSecret) {
    const tr = this.t();
    const lockCheck = this.getLockoutStatus(profile.id);
    if (lockCheck.jammed) {
      playJammedSound();
      return;
    }

    const clean = String(inputSecret || '').trim();
    const authRes = await verifyPuffinCredentials(profile.id, clean, {
      lang: this.config.lang,
      appId: this.config.appId,
      apiUrl: this.config.apiUrl,
    });
    if (authRes.ok) {
      this.resetLockout(profile.id);
      playTone(587.33, 80, 'triangle');
      setTimeout(() => playTone(880, 140, 'triangle'), 85);
      const dispName =
        this.config.lang === 'en' ? profile.displayNameEn || profile.displayName : profile.displayName;
      if (authRes.offline_verified) {
        this.$feedback.textContent =
          authRes.warning || tr.welcomeOfflineMsg(dispName, authRes.seed || PUFFIN_OFFLINE_SEED);
        this.$feedback.className = 'feedback-msg offline-warn';
      } else {
        this.$feedback.textContent = tr.welcomeMsg(dispName);
        this.$feedback.className = 'feedback-msg ok';
      }
      this.saveActiveSession(profile.id, true, {
        offline_verified: authRes.offline_verified,
        seed_used: authRes.seed,
        offline_warning: authRes.warning,
      });
      setTimeout(() => this.$dialog.close(), authRes.offline_verified ? 520 : 260);
    } else {
      const newLock = this.recordFailedAttempt(profile.id);
      this.pinBuffer = '';
      this.highlightGuest = true;

      const canGuest = this._canUseGuestFallback();
      const baseMsg =
        profile.authType === 'pin4'
          ? canGuest
            ? tr.wrongPinGuest
            : tr.wrongPinNoGuest
          : canGuest
          ? tr.wrongPwdGuest
          : tr.wrongPwdNoGuest;

      if (newLock.jammed) {
        playJammedSound();
      } else {
        playTone(190, 160, 'sawtooth');
      }

      this.renderModalContent();
      this.selectCandidate(profile);

      const guestShortcut = canGuest
        ? ` <button type="button" class="guest-fallback-btn" id="inline-guest-btn">${tr.playAsGuestBtn}</button>`
        : '';
      this.$feedback.innerHTML = `<span>${baseMsg}</span>${guestShortcut}`;
      this.$feedback.className = 'feedback-msg error';

      this.$feedback.querySelector('#inline-guest-btn')?.addEventListener('click', () => {
        const guest = PUFFIN_PROFILES.find((p) => p.id === 'guest');
        if (guest) this.selectCandidate(guest);
      });
    }
  }

  async triggerForgotPassword() {
    const tr = this.t();
    const p = this.selectedCandidate;
    if (!p || !p.email) return;
    this.$feedback.textContent = tr.sendingEmail(p.email);
    this.$feedback.className = 'feedback-msg ok';
    try {
      await fetch(`${this.config.apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: p.id, email: p.email, appId: this.config.appId }),
      });
    } catch {}
    this.$feedback.textContent = tr.sentEmail(p.email);
  }
}

/* ============================================================================
 * 4. ULTRA-MINIMALIST HALL OF FAME (`<puffin-leaderboard>`)
 *    At rest: ONLY Rank + Photo + User Name + High Score!
 *    On hover: Avatar zooms out to tiny RPG body + reveals extra details!
 * ============================================================================ */

const LEADERBOARD_CSS = `
:host {
  display: block;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
  interpolate-size: allow-keywords;
}

.hof-list {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  max-width: 520px;
  margin: 0 auto;
}

.hof-row {
  background: rgba(20, 24, 46, 0.9);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.95rem;
  padding: 0.45rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  transition: border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease, padding 0.22s ease;
  cursor: default;
}

.hof-row:hover,
.hof-row:focus-within,
.hof-row.is-expanded {
  border-color: var(--row-color, #FACC15);
  background: rgba(30, 36, 68, 0.97);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.48);
  padding: 0.65rem 0.9rem;
  align-items: stretch;
  outline: none;
}

.hof-content-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hof-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.hof-left {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.hof-rank {
  min-width: 1.5rem;
  font-size: 0.84rem;
  font-weight: 800;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
  text-align: center;
  flex-shrink: 0;
}

.hof-row[data-rank="1"] .hof-rank { color: #facc15; font-weight: 900; }
.hof-row[data-rank="2"] .hof-rank { color: #e2e8f0; font-weight: 900; }
.hof-row[data-rank="3"] .hof-rank { color: #fb923c; font-weight: 900; }

.lb-avatar-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 24%;
  overflow: hidden;
  border: 2px solid var(--row-color, #FACC15);
  background: #0b0d19;
  flex-shrink: 0;
  position: relative;
  transition: width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
              height 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-radius 0.28s ease,
              box-shadow 0.28s ease;
}

.hof-row:hover .lb-avatar-wrap,
.hof-row:focus-within .lb-avatar-wrap,
.hof-row.is-expanded .lb-avatar-wrap {
  width: 6.75rem;
  height: 6.75rem;
  border-radius: 1rem;
  border-width: 2.5px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.6);
}

.lb-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 23%;
  translate: 0px 8%;
  rotate: 0deg;
  scale: 1.54;
  transition: scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              translate 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              object-position 0.3s ease;
}

.lb-avatar-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.hof-row.video-playing .lb-avatar-video {
  opacity: 1;
}

.hof-row:hover .lb-avatar-img,
.hof-row:focus-within .lb-avatar-img,
.hof-row.is-expanded .lb-avatar-img {
  object-position: center 50%;
  translate: 0px 0%;
  scale: 1.0;
}

.hof-name {
  font-size: 0.98rem;
  font-weight: 800;
  color: #f8fafc;
  white-space: nowrap;
  flex-shrink: 0;
}

.hof-role-pill {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--row-color, #fde047);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  padding: 0.06rem 0.45rem;
  margin-right: 0.35rem;
  white-space: nowrap;
}

.hof-row[data-player-id="guest"] .lb-avatar-wrap,
.hof-row[data-player-id="null"] .lb-avatar-wrap {
  filter: grayscale(100%) contrast(1.12);
}

.robot-tt {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.82rem;
  font-weight: 900;
  color: #22d3ee;
  background: rgba(6, 182, 212, 0.16);
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 4px;
  padding: 0.04rem 0.3rem;
  letter-spacing: 0.02em;
  text-shadow: 0 0 8px rgba(34, 211, 238, 0.55);
}

.hof-score {
  font-size: 1.08rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: var(--row-color, #fde047);
  flex-shrink: 0;
}

/* HOVER-ONLY DETAILS (flows in the right column beside the full-height left avatar!) */
.hof-hover-details {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  font-size: 0.74rem;
  color: #94a3b8;
  line-height: 1.4;
  transition: max-height 0.25s ease, opacity 0.22s ease, margin-top 0.22s ease;
  margin-top: 0;
}

.hof-row:hover .hof-hover-details,
.hof-row:focus-within .hof-hover-details,
.hof-row.is-expanded .hof-hover-details {
  max-height: 6.5rem;
  opacity: 1;
  margin-top: 0.42rem;
  padding-top: 0.38rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.14);
}

.hof-summary-line {
  color: #e2e8f0;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.hof-hover-details code {
  color: #cbd5e1;
  font-size: 0.68rem;
}

/* RICCARDO ADMIN BAR & PER-ROW CONTROLS (Only visible when logged in as riccardo!) */
.hof-admin-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  background: rgba(250, 204, 21, 0.12);
  border: 1.5px solid rgba(250, 204, 21, 0.45);
  border-radius: 0.85rem;
  padding: 0.45rem 0.75rem;
  margin-bottom: 0.5rem;
}

.hof-admin-badge {
  font-size: 0.76rem;
  font-weight: 900;
  color: #fde047;
}

.hof-pantheon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #1e293b;
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 0.55rem;
  padding: 0.26rem 0.6rem;
  font-size: 0.73rem;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.12s ease;
}

.hof-pantheon-btn:hover {
  background: #0f172a;
  transform: translateY(-1px);
}

.hof-right-group {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  flex-shrink: 0;
}

.hof-row-pantheon-btn {
  display: inline-flex;
  align-items: center;
  background: rgba(56, 189, 248, 0.14);
  color: #7dd3fc;
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 0.48rem;
  padding: 0.2rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 800;
  text-decoration: none;
}

.hof-row-pantheon-btn:hover {
  background: rgba(56, 189, 248, 0.26);
}

.hof-row-del-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: #dc2626;
  color: #fff;
  border: 1px solid #f87171;
  border-radius: 0.48rem;
  padding: 0.2rem 0.48rem;
  font-size: 0.68rem;
  font-weight: 900;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;
}

.hof-row-del-btn:hover {
  background: #b91c1c;
  transform: scale(1.05);
}

.hof-game-link {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  background: rgba(250, 204, 21, 0.14);
  color: #fde047;
  border: 1px solid rgba(250, 204, 21, 0.45);
  border-radius: 0.38rem;
  padding: 0.06rem 0.4rem;
  font-family: monospace;
  font-size: 0.68rem;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.12s ease;
}

.hof-game-link:hover {
  background: rgba(250, 204, 21, 0.28);
  color: #fff;
  transform: translateY(-1px);
}

/* GeoCities-style Puffin Login Ring Footer inside Hall of Fame */
.hof-ring-footer {
  margin-top: 0.45rem;
  padding: 0.65rem 0.8rem;
  border-radius: 0.95rem;
  background: linear-gradient(135deg, rgba(45, 22, 8, 0.92) 0%, rgba(18, 14, 36, 0.96) 50%, rgba(45, 22, 8, 0.92) 100%);
  border: 1.5px solid rgba(251, 146, 60, 0.55);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45), inset 0 0 18px rgba(251, 146, 60, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
}

.hof-ring-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  flex-wrap: nowrap;
}

@media (max-width: 520px) {
  .hof-ring-nav {
    flex-wrap: wrap;
    justify-content: center;
  }
}

.hof-ring-hub-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #fde047;
  font-weight: 900;
  font-size: 0.78rem;
  text-decoration: none;
  letter-spacing: 0.02em;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(234, 88, 12, 0.35) 0%, rgba(124, 45, 18, 0.45) 100%);
  border: 1px solid rgba(251, 191, 36, 0.65);
  box-shadow: 0 0 14px rgba(249, 115, 22, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.hof-ring-hub-link:hover {
  transform: scale(1.04);
  box-shadow: 0 0 20px rgba(250, 204, 21, 0.6);
  color: #fff;
}

.hof-ring-step-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  background: rgba(15, 23, 42, 0.85);
  color: #fdba74;
  border: 1px solid rgba(251, 146, 60, 0.4);
  border-radius: 0.55rem;
  padding: 0.24rem 0.55rem;
  font-size: 0.7rem;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.hof-ring-step-btn:hover {
  background: rgba(234, 88, 12, 0.28);
  color: #fff;
  border-color: #facc15;
}

.hof-ring-pills {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.hof-ring-app-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.16rem 0.5rem;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 800;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.16);
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.hof-ring-app-pill.is-live {
  border-color: rgba(52, 211, 153, 0.55);
  color: #a7f3d0;
}

.hof-ring-app-pill.is-upcoming {
  border-style: dashed;
  border-color: rgba(251, 191, 36, 0.45);
  color: #fde68a;
}

.hof-ring-app-pill:hover {
  transform: translateY(-1px);
  border-color: #facc15;
  color: #fff;
}
`;

export const VETRINA_GAMES_JSON_URL = 'https://palladius.github.io/vetrina/data/games.json';
export const VETRINA_RING_HASH_URL = 'https://palladius.github.io/vetrina/#puffin-ring';
export const DEFAULT_RING_HUB_URL = 'https://puffin-login-932724269481.europe-west1.run.app/ring.html';

export const PUFFIN_LOGIN_RING_DEFAULT = [
  {
    id: 'demo-snake',
    puffin_game_id: 'puffin-snake',
    title: '🐍🐧 Puffin Snake',
    shortTitle: 'Puffin Snake',
    emoji: '🐍',
    play_url: 'https://palladius.github.io/demo-snake/',
    cloud_url: 'https://puffin-login-932724269481.europe-west1.run.app/snake.html',
    repo_url: 'https://github.com/palladius/demo-snake',
    screenshot: 'https://palladius.github.io/vetrina/assets/screenshots/demo-snake.png',
    supports_puffin_login: true,
    status: 'live',
  },
  {
    id: 'tubature',
    puffin_game_id: 'tubature',
    title: '🚰 Tubature: The Dungeon Plumber',
    shortTitle: 'Tubature',
    emoji: '🚰',
    play_url: 'https://palladius.github.io/tubature/',
    repo_url: 'https://github.com/palladius/tubature',
    screenshot: 'https://palladius.github.io/vetrina/assets/screenshots/tubature.jpg',
    supports_puffin_login: true,
    status: 'live',
  },
  {
    id: 'kids-jigsaw-puzzle',
    puffin_game_id: 'kids-jigsaw-puzzle',
    title: '🧩 Kids Jigsaw Puzzle',
    shortTitle: 'Jigsaw Puzzle',
    emoji: '🧩',
    play_url: 'https://palladius.github.io/kids-jigsaw-puzzle/',
    repo_url: 'https://github.com/palladius/kids-jigsaw-puzzle',
    screenshot: 'https://palladius.github.io/vetrina/assets/screenshots/kids-jigsaw-puzzle.png',
    supports_puffin_login: true,
    status: 'live',
  },
  {
    id: 'carlesso-fotoquad',
    puffin_game_id: 'carlesso-fotoquad',
    title: '📸🧩 FotoQuad Solitario',
    shortTitle: 'FotoQuad',
    emoji: '📸',
    play_url: 'https://palladius.github.io/carlesso-fotoquad/',
    repo_url: 'https://github.com/palladius/carlesso-fotoquad',
    screenshot: 'https://palladius.github.io/vetrina/assets/screenshots/carlesso-fotoquad.jpg',
    supports_puffin_login: true,
    status: 'live',
  },
  {
    id: 'tribecca',
    puffin_game_id: 'tribecca',
    title: '🇮🇹♟️🔺 TriBecca: Scacchi 3D a 3 Giocatori',
    shortTitle: 'TriBecca',
    emoji: '♟️',
    play_url: 'https://palladius.github.io/tribecca/',
    repo_url: 'https://github.com/palladius/tribecca',
    screenshot: 'https://palladius.github.io/vetrina/assets/screenshots/tribecca.png',
    supports_puffin_login: true,
    status: 'live',
  },
  {
    id: 'dots-and-lines',
    puffin_game_id: 'dots-and-lines',
    title: '🟦⚡ Dots and Lines Deluxe (Dual Puffin)',
    shortTitle: 'Dots & Lines',
    emoji: '🟦',
    play_url: 'https://palladius.github.io/dots-and-lines/',
    repo_url: 'https://github.com/palladius/dots-and-lines',
    screenshot: 'https://palladius.github.io/dots-and-lines/assets/01-start-rules.jpg',
    supports_puffin_login: true,
    status: 'live',
  },
];

export const PUFFIN_LOGIN_RING_CANDIDATES = [
  {
    id: 'family-mahjong-3d',
    puffin_game_id: 'family-mahjong-3d',
    title: '🀄 Family 3D Mahjong',
    shortTitle: '3D Mahjong',
    emoji: '🀄',
    play_url: 'https://palladius.github.io/family-mahjong-3d/',
    repo_url: 'https://github.com/palladius/family-mahjong-3d',
    screenshot: 'https://palladius.github.io/vetrina/assets/screenshots/family-mahjong-3d.jpg',
    supports_puffin_login: false,
    status: 'candidate',
  },
  {
    id: 'ale-french',
    puffin_game_id: 'ale-french',
    title: '🇫🇷 Ale & Seby French',
    shortTitle: 'Ale French',
    emoji: '🇫🇷',
    play_url: 'https://palladius.github.io/ale-french/',
    repo_url: 'https://github.com/palladius/ale-french',
    screenshot: 'https://palladius.github.io/vetrina/assets/screenshots/ale-french.png',
    supports_puffin_login: false,
    status: 'candidate',
  },
];

let _cachedRingApps = [...PUFFIN_LOGIN_RING_DEFAULT];
let _vetrinaRingSynced = false;

export function getPuffinRingApps({ includeCandidates = false } = {}) {
  if (!includeCandidates) {
    return _cachedRingApps;
  }
  const existingIds = new Set(_cachedRingApps.map((a) => a.id));
  const extras = PUFFIN_LOGIN_RING_CANDIDATES.filter((c) => !existingIds.has(c.id));
  return [..._cachedRingApps, ...extras];
}

export function resolveGameFromRing(gameId) {
  const clean = String(gameId || '').trim().toLowerCase();
  const all = getPuffinRingApps({ includeCandidates: true });
  return (
    all.find(
      (a) =>
        a.id.toLowerCase() === clean ||
        (a.puffin_game_id && a.puffin_game_id.toLowerCase() === clean)
    ) || null
  );
}

export async function syncPuffinRingFromVetrina() {
  if (_vetrinaRingSynced) return _cachedRingApps;
  try {
    const res = await fetch(VETRINA_GAMES_JSON_URL);
    if (!res.ok) return _cachedRingApps;
    const games = await res.json();
    if (!Array.isArray(games)) return _cachedRingApps;

    const byId = new Map(_cachedRingApps.map((a) => [a.id, { ...a }]));
    for (const g of games) {
      if (!g || !g.id) continue;
      const tags = Array.isArray(g.tags) ? g.tags.map((t) => String(t).toLowerCase()) : [];
      const isLiveRing = g.supports_puffin_login === true || tags.includes('supports_puffin_login');
      const isExplicitUpcoming = g.supports_puffin_login === false;
      if (!isLiveRing && !isExplicitUpcoming && !byId.has(g.id)) continue;

      const prev = byId.get(g.id) || {};
      const rawTitle = String(g.title || prev.title || g.id);
      const firstEmojiMatch = rawTitle.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
      const emoji = prev.emoji || (firstEmojiMatch ? firstEmojiMatch[0] : '🎮');
      const cleanName = rawTitle
        .replace(/^[^\w\p{L}]+/u, '')
        .split('—')[0]
        .split(':')[0]
        .trim();
      const shot = g.screenshot
        ? g.screenshot.startsWith('http')
          ? g.screenshot
          : `https://palladius.github.io/vetrina/${g.screenshot.replace(/^\//, '')}`
        : prev.screenshot;

      byId.set(g.id, {
        ...prev,
        id: g.id,
        puffin_game_id: g.puffin_game_id || prev.puffin_game_id || g.id,
        title: rawTitle,
        shortTitle: prev.shortTitle || cleanName || g.id,
        emoji,
        play_url: g.play_url || prev.play_url || VETRINA_RING_HASH_URL,
        repo_url: g.repo_url || prev.repo_url || '',
        screenshot: shot,
        supports_puffin_login: Boolean(isLiveRing),
        status: isLiveRing ? 'live' : prev.status || 'upcoming',
      });
    }
    _cachedRingApps = Array.from(byId.values());
    _vetrinaRingSynced = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('puffin-ring-updated', { detail: _cachedRingApps }));
    }
  } catch {}
  return _cachedRingApps;
}

let sharedLbSheet = null;
function getLeaderboardStyleSheet() {
  if (!sharedLbSheet && typeof CSSStyleSheet !== 'undefined' && 'replaceSync' in CSSStyleSheet.prototype) {
    sharedLbSheet = new CSSStyleSheet();
    sharedLbSheet.replaceSync(LEADERBOARD_CSS);
  }
  return sharedLbSheet;
}

const lbTemplate = typeof document !== 'undefined' ? document.createElement('template') : null;
if (lbTemplate) {
  lbTemplate.innerHTML = `<div class="hof-list" role="list" aria-label="Hall of Fame Top Scores"></div>`;
}

export class PuffinLeaderboardElement extends BaseElement {
  static get observedAttributes() {
    return ['filter-game'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const sheet = getLeaderboardStyleSheet();
    if (sheet && 'adoptedStyleSheets' in this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    } else {
      const styleEl = document.createElement('style');
      styleEl.textContent = LEADERBOARD_CSS;
      this.shadowRoot.append(styleEl);
    }
    this.shadowRoot.append(lbTemplate.content.cloneNode(true));
    this.activeFilter = this.getAttribute('filter-game') || 'ALL';
    this.$list = this.shadowRoot.querySelector('.hof-list');
    this._onScore = () => this.render();
    this.$list.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-del-id]');
      if (!delBtn) return;
      e.preventDefault();
      e.stopPropagation();
      const scoreId = delBtn.getAttribute('data-del-id');
      if (scoreId) {
        PuffinLogin.deleteScore(scoreId);
      }
    });
  }

  connectedCallback() {
    if (this.hasAttribute('filter-game')) {
      this.activeFilter = this.getAttribute('filter-game') || 'ALL';
    }
    ensureDummyScoresSeeded(false);
    window.addEventListener('puffin-score-recorded', this._onScore);
    window.addEventListener('puffin-lang-changed', this._onScore);
    window.addEventListener('puffin-auth-updated', this._onScore);
    window.addEventListener('puffin-user-changed', this._onScore);
    window.addEventListener('puffin-ring-updated', this._onScore);
    this.render();
    this.syncFromCloud();
    syncPuffinRingFromVetrina();
  }

  async syncFromCloud() {
    try {
      const cfg = resolvePuffinConfig();
      const res = await fetch(`${cfg.apiUrl}/scores?limit=250`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data?.scores) || data.scores.length === 0) return;
      const deletedSet = getDeletedScoreIds();
      const localList = ensureDummyScoresSeeded(false);
      const byId = new Map(localList.map((s) => [s.id, s]));
      let added = false;
      for (const remote of data.scores) {
        try {
          const norm = validateAndNormalizeScorePayload(remote);
          if (!deletedSet.has(norm.id) && !byId.has(norm.id)) {
            byId.set(norm.id, norm);
            added = true;
          }
        } catch {}
      }
      if (added) {
        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(Array.from(byId.values())));
        this.render();
      }
    } catch {}
  }

  attributeChangedCallback(name, _oldVal, newVal) {
    if (name === 'filter-game' && this.isConnected) {
      this.activeFilter = newVal || 'ALL';
      this.render();
    }
  }

  disconnectedCallback() {
    window.removeEventListener('puffin-score-recorded', this._onScore);
    window.removeEventListener('puffin-lang-changed', this._onScore);
    window.removeEventListener('puffin-auth-updated', this._onScore);
    window.removeEventListener('puffin-user-changed', this._onScore);
    window.removeEventListener('puffin-ring-updated', this._onScore);
  }

  render() {
    const activeUser = PuffinLogin.getCurrentUser();
    const isAdmin = activeUser?.id === 'riccardo';
    const pantheonCollectionUrl =
      'https://console.cloud.google.com/firestore/databases/puffin-login/data/panel/scores?project=ror-goldie';

    const scores = PuffinLogin.getLeaderboard({
      appId: this.activeFilter === 'ALL' ? undefined : this.activeFilter,
      limit: TOP_TEN_LIMIT,
    });

    const adminHeaderHtml = isAdmin
      ? `
        <div class="hof-admin-bar">
          <span class="hof-admin-badge">👑 Admin: Riccardo</span>
          <a class="hof-pantheon-btn" href="${pantheonCollectionUrl}" target="_blank" rel="noopener">
            🔥 Pantheon Firestore (scores) ↗
          </a>
        </div>
      `
      : '';

    const rowsHtml = scores.map((entry, idx) => {
      const rank = idx + 1;
      const profile = getProfileById(entry.player_id);
      const timeInfo = formatTimeRange(entry.started_at, entry.ended_at);
      const hostStr =
        entry.hostname && entry.hostname !== 'localhost' && entry.hostname !== '127.0.0.1'
          ? entry.hostname
          : entry.ip_address || '127.0.0.1';
      const extraPairs = Object.entries(entry.extra || {})
        .slice(0, 4)
        .map(([k, v]) => `${k}:${v}`)
        .join(', ');
      const docLeafUrl = `https://console.cloud.google.com/firestore/databases/puffin-login/data/panel/scores/${encodeURIComponent(
        entry.id
      )}?project=ror-goldie`;

      const adminRowBtns = isAdmin
        ? `
          <a class="hof-row-pantheon-btn" href="${docLeafUrl}" target="_blank" rel="noopener" title="Vedi foglia ${entry.id} su Pantheon Firestore">
            🔥 Foglia ↗
          </a>
          <button type="button" class="hof-row-del-btn" data-del-id="${entry.id}" title="Cancella record farlocco (${entry.id})">
            🗑️ Cancella
          </button>
        `
        : '';

      const nameHtml =
        profile.role === 'bot'
          ? `<tt class="robot-tt">${profile.shortName}</tt>`
          : entry.shortName || profile.shortName;

      const rolePillHtml = `<span class="hof-role-pill">${profile.emoji || ''} ${profile.rpgClass || ''}</span>`;
      const summaryHtml = entry.summary_text
        ? `<div class="hof-summary-line">${rolePillHtml}${entry.summary_text}</div>`
        : `<div class="hof-summary-line">${rolePillHtml}</div>`;

      return `
        <div class="hof-row" role="listitem" tabindex="0" data-rank="${rank}" data-player-id="${profile.id || 'null'}" style="--row-color: ${profile.colorHex}">
          <div class="lb-avatar-wrap">
            <img class="lb-avatar-img" src="${profile.avatar}" alt="${profile.shortName}" loading="lazy" />
            ${
              profile.video
                ? `<video class="lb-avatar-video" data-src="${profile.video}" muted loop playsinline preload="none"></video>`
                : ''
            }
          </div>
          <div class="hof-content-col">
            <div class="hof-main">
              <div class="hof-left">
                <span class="hof-rank">#${rank}</span>
                <span class="hof-name">${nameHtml}</span>
              </div>
              <div class="hof-right-group">
                <span class="hof-score">${Number(entry.score).toLocaleString('en-US')}</span>
                ${adminRowBtns}
              </div>
            </div>
            <div class="hof-hover-details">
              ${summaryHtml}
              <div>
                ${(() => {
                  const gInfo = resolveGameFromRing(entry.game_id);
                  if (gInfo && gInfo.play_url) {
                    return `<a class="hof-game-link" href="${gInfo.play_url}" target="_blank" rel="noopener" title="Play ${gInfo.shortTitle} (${gInfo.play_url})">${gInfo.emoji || '🎮'} ${entry.game_id} ↗</a>`;
                  }
                  return `<code>${entry.game_id}</code>`;
                })()} • ⏱️ ${timeInfo.durationText} (${timeInfo.rangeText}) • 🌐 ${hostStr}${
        extraPairs ? ` • <code>${extraPairs}</code>` : ''
      }
              </div>
            </div>
          </div>
        </div>
      `;
    });

    const ringApps = getPuffinRingApps();
    const curGameId = (this.activeFilter !== 'ALL' ? this.activeFilter : resolvePuffinConfig().appId || '').toLowerCase();
    const curIdx = Math.max(
      0,
      ringApps.findIndex(
        (a) => a.id.toLowerCase() === curGameId || (a.puffin_game_id || '').toLowerCase() === curGameId
      )
    );
    const prevApp = ringApps[(curIdx - 1 + ringApps.length) % ringApps.length] || ringApps[0];
    const nextApp = ringApps[(curIdx + 1) % ringApps.length] || ringApps[0];
    const ringHubUrl = this.getAttribute('ring-url') || './ring.html';

    const ringPillsHtml = ringApps
      .map((a) => {
        const isLive = a.status === 'live';
        const statusDot = isLive ? '🟢' : '🔜';
        return `<a class="hof-ring-app-pill ${isLive ? 'is-live' : 'is-upcoming'}" href="${a.play_url}" target="_blank" rel="noopener" title="${a.title} (${isLive ? 'Live in Puffin Login Ring' : 'Coming Soon to Puffin Login Ring'})">${statusDot} ${a.emoji} ${a.shortTitle}</a>`;
      })
      .join('');

    const ringFooterHtml = `
      <div class="hof-ring-footer" role="navigation" aria-label="Puffin Login Ring WebRing">
        <div class="hof-ring-nav">
          <a class="hof-ring-step-btn" href="${prevApp.play_url}" target="_blank" rel="noopener" title="Previous App in Ring: ${prevApp.title}">
            ⬅️ ${prevApp.emoji} ${prevApp.shortTitle}
          </a>
          <a class="hof-ring-hub-link" href="${ringHubUrl}" title="Open the Glorious Puffin Login Ring of Fire Hub!">
            🔥💍 Puffin Login Ring (${ringApps.length} Apps)
          </a>
          <button type="button" class="hof-ring-hub-link" data-open-magic-cards="${curGameId}" style="cursor:pointer;" title="Apri il tuo Album delle Carte Magic Collezionabili!">
            🃏 Album Carte Magic
          </button>
          <a class="hof-ring-step-btn" href="${nextApp.play_url}" target="_blank" rel="noopener" title="Next App in Ring: ${nextApp.title}">
            ${nextApp.emoji} ${nextApp.shortTitle} ➡️
          </a>
        </div>
        <div class="hof-ring-pills">
          ${ringPillsHtml}
          <a class="hof-ring-app-pill" href="${VETRINA_RING_HASH_URL}" target="_blank" rel="noopener" title="Filter all Puffin Login Ring apps on palladius/vetrina">
            🎠 Vetrina #puffin-ring ↗
          </a>
        </div>
      </div>
    `;

    this.$list.innerHTML = adminHeaderHtml + rowsHtml.join('') + ringFooterHtml;

    this.$list.querySelector('[data-open-magic-cards]')?.addEventListener('click', () => {
      // Close any surrounding game Hall of Fame <dialog> (like #hof-dialog in Puffin Snake) and open the Magic Cards Album!
      const parentDialog = this.closest('dialog');
      if (parentDialog && parentDialog.open && !parentDialog.hasAttribute('data-active-tab')) {
        try {
          parentDialog.close();
        } catch {}
      }
      if (typeof window !== 'undefined' && window.PuffinLogin && typeof window.PuffinLogin.openCards === 'function') {
        window.PuffinLogin.openCards();
      } else {
        window.open('./cards.html', '_blank', 'noopener');
      }
    });

    this.$list.querySelectorAll('.hof-row').forEach((row) => {
      const startVid = () => {
        const vid = row.querySelector('.lb-avatar-video');
        if (!vid || vid.dataset.failed === '1') return;
        if (!vid.src && vid.dataset.src) {
          vid.src = vid.dataset.src;
          vid.addEventListener(
            'error',
            () => {
              vid.dataset.failed = '1';
              row.classList.remove('video-playing');
            },
            { once: true }
          );
          vid.addEventListener('playing', () => {
            row.classList.add('video-playing');
          });
        }
        const p = vid.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      };
      const stopVid = () => {
        const vid = row.querySelector('.lb-avatar-video');
        if (!vid) return;
        row.classList.remove('video-playing');
        try {
          vid.pause();
        } catch {}
      };
      row.addEventListener('mouseenter', startVid);
      row.addEventListener('focusin', startVid);
      row.addEventListener('mouseleave', stopVid);
      row.addEventListener('focusout', stopVid);
    });
  }
}

const _activeGameStarts = new Map();

export const PuffinLogin = {
  version: PUFFIN_LOGIN_VERSION,
  VERSION: PUFFIN_LOGIN_VERSION,
  normalizePlayerSlot,
  buildCanonicalH2HKey,
  computeHeadToHeadStats,

  /**
   * Finds the `<puffin-login>` element matching `slot` (e.g. `'p1'`, `'p2'`), or the primary element if `slot` is omitted.
   */
  getSlotElement(slot = null) {
    if (typeof document === 'undefined') return null;
    const cleanSlot = normalizePlayerSlot(slot);
    if (cleanSlot) {
      const elements = Array.from(document.querySelectorAll('puffin-login'));
      const matched = elements.find(
        (el) =>
          normalizePlayerSlot(el.getAttribute('player-slot') || el.getAttribute('slot-id')) ===
          cleanSlot
      );
      if (matched) return matched;
      if (cleanSlot === 'p1') {
        return elements.find((el) => !el.hasAttribute('player-slot')) || null;
      }
      return null;
    }
    return document.querySelector('puffin-login');
  },

  /**
   * Dedicated programmatic login for Antigravity UAT Bot ('bot' / 'saga').
   * Never selectable via human UI ("This is for bots not for you!").
   * Supports optional `slot` (`'p1'`, `'p2'`) for Dual PuffinLogin games.
   */
  async loginAsBot(plainSecret, slot = null) {
    const botProfile = PUFFIN_PROFILES.find((p) => p.id === 'saga');
    if (!botProfile) return null;
    const hash = await computePuffinSecretHash('saga', plainSecret);
    if (hash !== botProfile.secretHash) {
      throw new Error('Invalid UAT Bot secret');
    }
    const cleanSlot = normalizePlayerSlot(slot);
    const el = this.getSlotElement(cleanSlot);
    if (el) {
      el.saveActiveSession('saga', true);
      if (el.$dialog?.open) el.$dialog.close();
      return el.getCurrentUser();
    }
    const session = validateAndNormalizeLoginPayload({
      player_id: 'saga',
      player_slot: cleanSlot,
    });
    if (cleanSlot) {
      writeSlotSession(cleanSlot, session);
      if (cleanSlot === 'p1' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
        } catch {}
      }
      return this.getCurrentUser(cleanSlot);
    }
    return botProfile;
  },
  /**
   * Programmatic login as Guest with an optional bragging friend name (`guest_name: "Paolo"`)
   * and optional `slot` (`'p1'`, `'p2'`) for Dual PuffinLogin games.
   */
  loginAsGuest(guestName = null, slot = null) {
    const cleanGuest = normalizeGuestName(guestName);
    const cleanSlot = normalizePlayerSlot(slot);
    const el = this.getSlotElement(cleanSlot);
    if (el) {
      el.saveActiveSession('guest', true, { guest_name: cleanGuest });
      if (el.$dialog?.open) el.$dialog.close();
      return el.getCurrentUser();
    }
    const session = validateAndNormalizeLoginPayload({
      player_id: 'guest',
      guest_name: cleanGuest,
      player_slot: cleanSlot,
    });
    try {
      if (cleanSlot) {
        writeSlotSession(cleanSlot, session);
        if (cleanGuest && typeof localStorage !== 'undefined') {
          const rawSlotGuests = localStorage.getItem(STORAGE_KEYS.GUEST_NAME_SLOTS);
          const slotGuests = rawSlotGuests ? JSON.parse(rawSlotGuests) : {};
          slotGuests[cleanSlot] = cleanGuest;
          localStorage.setItem(STORAGE_KEYS.GUEST_NAME_SLOTS, JSON.stringify(slotGuests));
        }
        if (cleanSlot === 'p1' && typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
          if (cleanGuest) localStorage.setItem(STORAGE_KEYS.GUEST_NAME, cleanGuest);
        }
        return this.getCurrentUser(cleanSlot);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
        if (cleanGuest) localStorage.setItem(STORAGE_KEYS.GUEST_NAME, cleanGuest);
      }
    } catch {}
    return this.getCurrentUser();
  },
  init(options = {}) {
    if (typeof window !== 'undefined') {
      window.PUFFINLOGIN_ENV = { ...(window.PUFFINLOGIN_ENV || {}), ...options };
    }
    ensureDummyScoresSeeded(false);
    ensureOfflineSeedCached(false);
    const cfg = resolvePuffinConfig(options);
    _activeGameStarts.set(cfg.appId, new Date().toISOString());

    const allEls =
      typeof document !== 'undefined' ? Array.from(document.querySelectorAll('puffin-login')) : [];
    if (allEls.length === 0 && options.mountBadge !== false && typeof document !== 'undefined') {
      const el = document.createElement('puffin-login');
      const container =
        (typeof options.mountBadge === 'string' && document.querySelector(options.mountBadge)) ||
        document.body;
      container.appendChild(el);
    } else {
      for (const el of allEls) {
        if (typeof el.syncConfigFromAttributes === 'function') {
          el.syncConfigFromAttributes();
          el.ensureActiveSession();
          el.renderBadge();
          el.renderModalContent();
        }
      }
    }
    return this;
  },

  startGameSession(appId) {
    const cfg = resolvePuffinConfig(appId ? { appId } : {});
    const startedAt = new Date().toISOString();
    _activeGameStarts.set(cfg.appId, startedAt);
    return startedAt;
  },

  /**
   * Returns the active login session object (`{ id, player_id, userId, player_slot, app_id, logged_at, source_ip, ip_address, hostname, device }`),
   * or `null` if unauthenticated (`identity === NULL`).
   * Pass `slot` (`'p1'`, `'p2'`) in Dual PuffinLogin games to query a specific player slot.
   */
  getAuthSession(slot = null) {
    const cleanSlot = normalizePlayerSlot(slot);
    if (cleanSlot) {
      const slotEl = this.getSlotElement(cleanSlot);
      if (slotEl && typeof slotEl.getAuthSession === 'function') return slotEl.getAuthSession();
      return getSlotAuthSession(cleanSlot);
    }
    const el = typeof document !== 'undefined' ? document.querySelector('puffin-login') : null;
    if (el && typeof el.getAuthSession === 'function') return el.getAuthSession();
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.AUTH);
      if (raw) {
        const parsed = JSON.parse(raw);
        const uid = parsed?.player_id || parsed?.userId;
        if (uid) return validateAndNormalizeLoginPayload(parsed);
      }
    } catch {}
    return null;
  },

  /**
   * Returns the active logged-in profile (enriched with `source_ip`, `ip_address`, `hostname`, `device`, `logged_at`, `player_slot`),
   * or `null` if unauthenticated (`identity === NULL`).
   * Pass `slot` (`'p1'`, `'p2'`) in Dual PuffinLogin games to query a specific player slot.
   */
  getCurrentUser(slot = null) {
    const cleanSlot = normalizePlayerSlot(slot);
    if (cleanSlot) {
      const slotEl = this.getSlotElement(cleanSlot);
      if (slotEl && typeof slotEl.getCurrentUser === 'function') return slotEl.getCurrentUser();
      return getSlotCurrentUser(cleanSlot);
    }
    const el = typeof document !== 'undefined' ? document.querySelector('puffin-login') : null;
    if (el && typeof el.getCurrentUser === 'function') return el.getCurrentUser();
    const session = this.getAuthSession();
    if (!session?.userId) return null;
    const found = PUFFIN_PROFILES.find((p) => p.id === session.userId);
    if (!found) return null;
    const guestName = found.id === 'guest' ? normalizeGuestName(session.guest_name) : null;
    return {
      ...found,
      guest_name: guestName,
      guestName,
      displayName: guestName ? `${found.shortName} (${guestName})` : found.displayName,
      shortName: guestName ? `${found.shortName} (${guestName})` : found.shortName,
      player_slot: session.player_slot || null,
      playerSlot: session.playerSlot || session.player_slot || null,
      loggedAt: session.loggedAt,
      logged_at: session.logged_at,
      appId: session.appId,
      app_id: session.app_id,
      source_ip: session.source_ip,
      ip_address: session.ip_address,
      ipAddress: session.ipAddress,
      hostname: session.hostname,
      device: session.device,
    };
  },

  /**
   * Returns a map of active slot users (`{ p1: Profile|null, p2: Profile|null }`) for Dual PuffinLogin games.
   */
  getPlayers(slots = ['p1', 'p2']) {
    const out = {};
    for (const rawSlot of slots) {
      const cleanSlot = normalizePlayerSlot(rawSlot);
      if (!cleanSlot) continue;
      out[cleanSlot] = this.getCurrentUser(cleanSlot);
    }
    return out;
  },

  /**
   * Returns local login history (sorted newest first) for dashboards.
   */
  getLoginHistory({ appId, app_id, game_id, playerId, player_id, userId, limit = 50 } = {}) {
    const targetApp = app_id || game_id || appId;
    const targetPlayer = player_id || playerId || userId;
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.LOGINS);
      const list = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(list) ? list : [];
      return arr
        .map((item) => validateAndNormalizeLoginPayload(item))
        .filter(
          (item) =>
            (!targetApp || item.app_id === targetApp) &&
            (!targetPlayer || item.player_id === normalizeProfileId(targetPlayer))
        )
        .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at))
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  /**
   * Fetches and merges Cloud Firestore + local login events (with `source_ip` / `ip_address`) for dashboards.
   */
  async fetchCloudLogins({ appId, app_id, game_id, playerId, player_id, userId, limit = 50 } = {}) {
    const targetApp = app_id || game_id || appId;
    const targetPlayer = player_id || playerId || userId;
    const localList = this.getLoginHistory({ appId: targetApp, playerId: targetPlayer, limit });
    try {
      const cfg = resolvePuffinConfig({ appId: targetApp });
      const q = new URLSearchParams();
      if (targetApp) q.set('app_id', targetApp);
      if (targetPlayer) q.set('player_id', normalizeProfileId(targetPlayer));
      if (limit) q.set('limit', String(limit));
      const res = await fetch(`${cfg.apiUrl}/logins?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.logins) && data.logins.length > 0) {
          const byId = new Map();
          for (const item of [...data.logins, ...localList]) {
            if (item && item.id && !byId.has(item.id)) {
              byId.set(item.id, validateAndNormalizeLoginPayload(item));
            }
          }
          return Array.from(byId.values())
            .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at))
            .slice(0, limit);
        }
      }
    } catch {}
    return localList;
  },

  isLoggedIn(slot = null) {
    return this.getCurrentUser(slot) !== null;
  },

  isDualLoggedIn(slots = ['p1', 'p2']) {
    return slots.every((s) => this.getCurrentUser(s) !== null);
  },

  logout(slot = null) {
    const cleanSlot = normalizePlayerSlot(slot);
    if (cleanSlot) {
      const slotEl = this.getSlotElement(cleanSlot);
      if (slotEl) {
        slotEl.logout(true);
        return;
      }
      writeSlotSession(cleanSlot, null);
      if (cleanSlot === 'p1' && typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEYS.AUTH);
        } catch {}
      }
      return;
    }
    const el = this.getSlotElement();
    if (el) el.logout(true);
  },

  setLang(lang) {
    if (typeof document !== 'undefined') {
      document.querySelectorAll('puffin-login').forEach((el) => el.setLang(lang));
    }
  },

  resetLockout(userId) {
    const el = this.getSlotElement();
    if (el) el.resetLockout(userId);
  },

  resetDummyScores() {
    return ensureDummyScoresSeeded(true);
  },

  on(eventName, callback, slot = null) {
    const cleanSlot = normalizePlayerSlot(slot);
    if (eventName === 'USER_CHANGED') {
      if (cleanSlot) {
        const slotEl = this.getSlotElement(cleanSlot);
        if (slotEl) {
          slotEl.listeners.add(callback);
          return () => slotEl.listeners.delete(callback);
        }
      }
      if (typeof document !== 'undefined') {
        const allEls = Array.from(document.querySelectorAll('puffin-login'));
        if (allEls.length > 0) {
          allEls.forEach((el) => el.listeners.add(callback));
          return () => allEls.forEach((el) => el.listeners.delete(callback));
        }
      }
    }
    return () => {};
  },

  /**
   * Computes Head-to-Head (`H2H`) rivalry stats between two players (`playerAId` vs `playerBId`).
   */
  getHeadToHeadStats(playerAId = 'ale', playerBId = 'seby', options = {}) {
    const scores = options.scores || ensureDummyScoresSeeded(false);
    return computeHeadToHeadStats(scores, playerAId, playerBId, options);
  },

  /**
   * Records a Dual Match result (both P1 and P2 scores + H2H metadata) to local storage & Firestore.
   */
  async submitDualMatchScore({
    appId,
    game_id,
    gameId,
    p1User,
    p2User,
    p1Boxes = 0,
    p2Boxes = 0,
    p1Score,
    p2Score,
    totalBoxes = 16,
    grid = '4x4',
    moves = 0,
    maxComboP1 = 0,
    maxComboP2 = 0,
    p1MoveStats = null,
    p2MoveStats = null,
    avgMoveMsP1,
    maxMoveMsP1,
    avgMoveMsP2,
    maxMoveMsP2,
    durationSec = 120,
    startedAt,
    endedAt,
    mode = '2p-local',
    skipCardDrop = false,
  } = {}) {
    const targetGame = game_id || gameId || appId || resolvePuffinConfig().appId || 'dots-and-lines';
    const user1 = p1User || this.getCurrentUser('p1') || { id: 'guest', shortName: 'Guest (P1)' };
    const user2 = p2User || this.getCurrentUser('p2') || { id: 'guest', shortName: 'Guest (P2)' };
    const b1 = Number.isFinite(Number(p1Boxes)) ? Number(p1Boxes) : 0;
    const b2 = Number.isFinite(Number(p2Boxes)) ? Number(p2Boxes) : 0;
    const outcome1 = b1 > b2 ? 'win' : b1 < b2 ? 'loss' : 'tie';
    const outcome2 = b2 > b1 ? 'win' : b2 < b1 ? 'loss' : 'tie';

    const resolvedAvgMs1 = Math.round(Number(avgMoveMsP1 ?? p1MoveStats?.avgMs ?? 0)) || 0;
    const resolvedMaxMs1 = Math.round(Number(maxMoveMsP1 ?? p1MoveStats?.maxMs ?? 0)) || 0;
    const resolvedAvgSec1 = Number((resolvedAvgMs1 / 1000).toFixed(2));
    const resolvedMaxSec1 = Number((resolvedMaxMs1 / 1000).toFixed(2));
    const resolvedMoves1 = Number(p1MoveStats?.moves ?? 0) || 0;

    const resolvedAvgMs2 = Math.round(Number(avgMoveMsP2 ?? p2MoveStats?.avgMs ?? 0)) || 0;
    const resolvedMaxMs2 = Math.round(Number(maxMoveMsP2 ?? p2MoveStats?.maxMs ?? 0)) || 0;
    const resolvedAvgSec2 = Number((resolvedAvgMs2 / 1000).toFixed(2));
    const resolvedMaxSec2 = Number((resolvedMaxMs2 / 1000).toFixed(2));
    const resolvedMoves2 = Number(p2MoveStats?.moves ?? 0) || 0;

    const moveTimingTelemetry = {
      p1: {
        player_id: user1.id,
        moves: resolvedMoves1,
        avg_move_ms: resolvedAvgMs1,
        max_move_ms: resolvedMaxMs1,
        avg_move_sec: resolvedAvgSec1,
        max_move_sec: resolvedMaxSec1,
      },
      p2: {
        player_id: user2.id,
        moves: resolvedMoves2,
        avg_move_ms: resolvedAvgMs2,
        max_move_ms: resolvedMaxMs2,
        avg_move_sec: resolvedAvgSec2,
        max_move_sec: resolvedMaxSec2,
      },
    };

    const calcScore = (boxes, oppBoxes, maxCombo, outcome) => {
      const base = boxes * 100;
      const diffBonus = Math.max(0, boxes - oppBoxes) * 35;
      const comboBonus = Math.max(0, maxCombo) * 40;
      const winBonus = outcome === 'win' ? 250 : outcome === 'tie' ? 100 : 25;
      return base + diffBonus + comboBonus + winBonus;
    };

    const finalScore1 = Number.isFinite(Number(p1Score))
      ? Number(p1Score)
      : calcScore(b1, b2, maxComboP1, outcome1);
    const finalScore2 = Number.isFinite(Number(p2Score))
      ? Number(p2Score)
      : calcScore(b2, b1, maxComboP2, outcome2);

    const h2hKey = buildCanonicalH2HKey(
      user1.id,
      user2.id,
      user1.guest_name || user1.guestName,
      user2.guest_name || user2.guestName
    );
    const endIso = endedAt || new Date().toISOString();
    const startIso =
      startedAt || new Date(Date.parse(endIso) - Math.max(5, durationSec) * 1000).toISOString();

    const p1Record = await this.submitScore({
      game_id: targetGame,
      player_id: user1.id,
      guest_name: user1.guest_name || user1.guestName || null,
      player_slot: 'p1',
      opponent_id: user2.id,
      opponent_guest_name: user2.guest_name || user2.guestName || null,
      opponent_score: b2,
      boxes_claimed: b1,
      max_combo: maxComboP1,
      avg_move_ms: resolvedAvgMs1,
      max_move_ms: resolvedMaxMs1,
      avg_move_sec: resolvedAvgSec1,
      max_move_sec: resolvedMaxSec1,
      outcome: outcome1,
      h2h_key: h2hKey,
      score: finalScore1,
      duration_sec: durationSec,
      started_at: startIso,
      ended_at: endIso,
      skipCardDrop,
      summary_text: `${user1.shortName || user1.id} ${b1}–${b2} ${user2.shortName || user2.id} (${grid}, max combo ${maxComboP1}x, avg ${resolvedAvgSec1}s/move, max ${resolvedMaxSec1}s)`,
      extra: {
        mode,
        grid,
        boxes: b1,
        opponent_boxes: b2,
        total_boxes: totalBoxes,
        moves,
        player_moves: resolvedMoves1,
        max_combo: maxComboP1,
        avg_move_ms: resolvedAvgMs1,
        max_move_ms: resolvedMaxMs1,
        avg_move_sec: resolvedAvgSec1,
        max_move_sec: resolvedMaxSec1,
        opponent_avg_move_ms: resolvedAvgMs2,
        opponent_max_move_ms: resolvedMaxMs2,
        opponent_avg_move_sec: resolvedAvgSec2,
        opponent_max_move_sec: resolvedMaxSec2,
        move_timing: moveTimingTelemetry,
        opponent_id: user2.id,
        outcome: outcome1,
        h2h_key: h2hKey,
        player_slot: 'p1',
      },
    });

    let p2Record = null;
    if (mode !== '1p-bot' && user2 && user2.id !== 'cpu') {
      p2Record = await this.submitScore({
        game_id: targetGame,
        player_id: user2.id,
        guest_name: user2.guest_name || user2.guestName || null,
        player_slot: 'p2',
        opponent_id: user1.id,
        opponent_guest_name: user1.guest_name || user1.guestName || null,
        opponent_score: b1,
        boxes_claimed: b2,
        max_combo: maxComboP2,
        avg_move_ms: resolvedAvgMs2,
        max_move_ms: resolvedMaxMs2,
        avg_move_sec: resolvedAvgSec2,
        max_move_sec: resolvedMaxSec2,
        outcome: outcome2,
        h2h_key: h2hKey,
        score: finalScore2,
        duration_sec: durationSec,
        started_at: startIso,
        ended_at: endIso,
        skipCardDrop: true,
        summary_text: `${user2.shortName || user2.id} ${b2}–${b1} ${user1.shortName || user1.id} (${grid}, max combo ${maxComboP2}x, avg ${resolvedAvgSec2}s/move, max ${resolvedMaxSec2}s)`,
        extra: {
          mode,
          grid,
          boxes: b2,
          opponent_boxes: b1,
          total_boxes: totalBoxes,
          moves,
          player_moves: resolvedMoves2,
          max_combo: maxComboP2,
          avg_move_ms: resolvedAvgMs2,
          max_move_ms: resolvedMaxMs2,
          avg_move_sec: resolvedAvgSec2,
          max_move_sec: resolvedMaxSec2,
          opponent_avg_move_ms: resolvedAvgMs1,
          opponent_max_move_ms: resolvedMaxMs1,
          opponent_avg_move_sec: resolvedAvgSec1,
          opponent_max_move_sec: resolvedMaxSec1,
          move_timing: moveTimingTelemetry,
          opponent_id: user1.id,
          outcome: outcome2,
          h2h_key: h2hKey,
          player_slot: 'p2',
        },
      });
    }

    return {
      h2hKey,
      p1Record,
      p2Record,
      moveTiming: moveTimingTelemetry,
      h2hStats: this.getHeadToHeadStats(user1.id, user2.id, {
        gameId: targetGame,
        guestNameA: user1.guest_name || user1.guestName,
        guestNameB: user2.guest_name || user2.guestName,
      }),
    };
  },

  async submitScore(payload = {}) {
    const slotHint = normalizePlayerSlot(payload.player_slot ?? payload.playerSlot);
    const activeUser = this.getCurrentUser(slotHint);
    const gameId = payload.game_id || payload.gameId || payload.appId || resolvePuffinConfig().appId;
    const cfg = resolvePuffinConfig({
      appId: gameId,
      hostname: payload.hostname,
      ipAddress: payload.ip_address || payload.ipAddress,
    });
    const telemetry = await detectClientTelemetry(cfg);

    const explicitPlayerId =
      payload.player_id !== undefined
        ? payload.player_id
        : payload.playerId !== undefined
        ? payload.playerId
        : payload.userId !== undefined
        ? payload.userId
        : activeUser
        ? activeUser.id
        : null;

    const explicitGuestName =
      payload.guest_name ??
      payload.guestName ??
      (payload.extra && (payload.extra.guest_name ?? payload.extra.guestName)) ??
      (payload.metadata && (payload.metadata.guest_name ?? payload.metadata.guestName)) ??
      (activeUser?.id === 'guest' ? activeUser.guest_name : null);

    const endIso = payload.ended_at || payload.endedAt || new Date().toISOString();
    const rawMeta = payload.extra || payload.metadata || {};
    const explicitDurSec = Number(
      payload.duration_sec ??
        payload.durationSec ??
        rawMeta.duration_sec ??
        rawMeta.durationSec ??
        rawMeta.seconds ??
        rawMeta.timeSeconds ??
        (rawMeta.durationMs !== undefined ? Math.round(Number(rawMeta.durationMs) / 1000) : NaN)
    );
    const hasExplicitDur = Number.isFinite(explicitDurSec) && explicitDurSec > 0;
    const fallbackDurSec = hasExplicitDur ? Math.max(1, Math.round(explicitDurSec)) : 210;
    const startIso =
      payload.started_at ||
      payload.startedAt ||
      (hasExplicitDur
        ? new Date(Date.parse(endIso) - fallbackDurSec * 1000).toISOString()
        : _activeGameStarts.get(cfg.appId)) ||
      new Date(Date.parse(endIso) - fallbackDurSec * 1000).toISOString();

    _activeGameStarts.set(cfg.appId, new Date().toISOString());

    const normalized = validateAndNormalizeScorePayload(
      {
        ...payload,
        game_id: cfg.appId,
        player_id: explicitPlayerId,
        guest_name: explicitGuestName,
        duration_sec: hasExplicitDur ? fallbackDurSec : payload.duration_sec,
        started_at: startIso,
        ended_at: endIso,
      },
      telemetry
    );

    try {
      const list = ensureDummyScoresSeeded(false);
      list.push(normalized);
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(list));

      const outboxRaw = localStorage.getItem(STORAGE_KEYS.OUTBOX);
      const outbox = outboxRaw ? JSON.parse(outboxRaw) : [];
      outbox.push(normalized);
      localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(outbox));
    } catch {}

    try {
      fetch(`${cfg.apiUrl}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      }).catch(() => {});
    } catch {}

    if (!payload.skipCardDrop && (Number(normalized.score) || 0) > 0) {
      if (payload.interactivePack) {
        this.openGameBoosterPack({
          player_id: normalized.player_id || 'guest',
          game_id: normalized.game_id,
          score: normalized.score,
          difficulty: normalized.extra?.difficulty || normalized.extra?.mode || payload.mode || '',
          extra: normalized.extra,
          interactive: true,
        }).catch(() => {});
      } else {
        this.unlockCard({
          player_id: normalized.player_id || 'guest',
          game_id: normalized.game_id,
          score: normalized.score,
          difficulty: normalized.extra?.difficulty || normalized.extra?.mode || payload.mode || '',
          extra: normalized.extra,
          autoIncrementCounter: true,
          showToast: payload.showCardToast !== false,
        }).catch(() => {});
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('puffin-score-recorded', { detail: normalized }));
    }
    return normalized;
  },

  getLeaderboard({ appId, game_id, gameId, mode, limit = TOP_TEN_LIMIT } = {}) {
    const targetGame = game_id || gameId || appId;
    try {
      const list = ensureDummyScoresSeeded(false);
      return list
        .filter(
          (item) =>
            (!targetGame || item.game_id === targetGame) &&
            (!mode || item.extra?.mode === mode || item.extra?.difficulty === mode)
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  async getTopScores({ appId, game_id, gameId, mode, limit = TOP_TEN_LIMIT } = {}) {
    const targetGame = game_id || gameId || appId;
    const deletedSet = getDeletedScoreIds();
    const localTop = this.getLeaderboard({ game_id: targetGame, mode, limit });
    try {
      const cfg = resolvePuffinConfig({ appId: targetGame });
      const q = new URLSearchParams();
      if (targetGame) q.set('game_id', targetGame);
      if (limit) q.set('limit', String(limit));
      const res = await fetch(`${cfg.apiUrl}/scores?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.scores) && data.scores.length > 0) {
          const byId = new Map();
          for (const item of [...data.scores, ...localTop]) {
            if (item && item.id && !deletedSet.has(item.id) && !byId.has(item.id)) {
              byId.set(item.id, item);
            }
          }
          return Array.from(byId.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        }
      }
    } catch {}
    return localTop;
  },

  async deleteScore(scoreId) {
    const cleanId = String(scoreId || '').trim();
    if (!cleanId) return false;
    try {
      const deletedSet = getDeletedScoreIds();
      deletedSet.add(cleanId);
      localStorage.setItem(STORAGE_KEYS.DELETED_SCORES, JSON.stringify(Array.from(deletedSet)));

      const list = ensureDummyScoresSeeded(false).filter((s) => s.id !== cleanId);
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(list));
    } catch {}

    try {
      const cfg = resolvePuffinConfig();
      await fetch(`${cfg.apiUrl}/scores/${encodeURIComponent(cleanId)}`, {
        method: 'DELETE',
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('puffin-score-recorded', { detail: { deletedId: cleanId } }));
    }
    return true;
  },

  getRingApps(options) {
    return getPuffinRingApps(options);
  },

  syncRingFromVetrina() {
    return syncPuffinRingFromVetrina();
  },

  getGameDashboard(gameId) {
    const targetGame = gameId || resolvePuffinConfig().appId;
    const list = ensureDummyScoresSeeded(false);
    return computePerGameDashboard(list, targetGame);
  },

  async fetchCloudGameDashboard(gameId) {
    const targetGame = gameId || resolvePuffinConfig().appId;
    try {
      const cfg = resolvePuffinConfig({ appId: targetGame });
      const res = await fetch(
        `${cfg.apiUrl}/dashboard?game_id=${encodeURIComponent(targetGame)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data.dashboard) return data.dashboard;
      }
    } catch {}
    return this.getGameDashboard(targetGame);
  },

  getCardsCatalog(options = {}) {
    return getPuffinCardsCatalog(options);
  },

  getUserCards({ player_id, playerId, userId, game_id, gameId } = {}) {
    const targetPlayer = player_id || playerId || userId;
    const targetGame = game_id || gameId;
    const all = ensureDummyUserCardsSeeded(false);
    return all.filter((uc) => {
      if (
        targetPlayer &&
        targetPlayer !== 'ALL' &&
        uc.player_id !== normalizeProfileId(targetPlayer)
      ) {
        return false;
      }
      if (
        targetGame &&
        targetGame !== 'ALL' &&
        uc.game_id.toLowerCase() !== String(targetGame).toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  },

  async fetchCloudCards({ player_id, playerId, game_id, gameId } = {}) {
    const targetPlayer = player_id || playerId;
    const targetGame = game_id || gameId;
    const localList = this.getUserCards({ player_id: targetPlayer, game_id: targetGame });
    try {
      const cfg = resolvePuffinConfig({ appId: targetGame });
      const q = new URLSearchParams();
      if (targetPlayer && targetPlayer !== 'ALL') q.set('player_id', normalizeProfileId(targetPlayer));
      if (targetGame && targetGame !== 'ALL') q.set('game_id', targetGame);
      const res = await fetch(`${cfg.apiUrl}/cards?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.userCards) && data.userCards.length > 0) {
          const byId = new Map();
          for (const item of [...data.userCards, ...localList]) {
            if (item && item.id && !byId.has(item.id)) {
              byId.set(item.id, validateAndNormalizeUserCardRecord(item, normalizeProfileId));
            }
          }
          const merged = Array.from(byId.values());
          try {
            if (typeof localStorage !== 'undefined' && !targetPlayer && !targetGame) {
              localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(merged));
            }
          } catch {}
          return merged;
        }
      }
    } catch {}
    return localList;
  },

  async unlockCard(payload = {}) {
    const activeUser = this.getCurrentUser();
    const resolvedPlayer =
      normalizeProfileId(
        payload.player_id ?? payload.playerId ?? payload.userId ?? activeUser?.id ?? 'guest',
        false
      ) || 'guest';
    const gameId = String(
      payload.game_id || payload.gameId || payload.appId || resolvePuffinConfig().appId || 'tubature'
    )
      .trim()
      .toLowerCase();

    let dropMeta = null;
    let targetCardId = payload.card_id || payload.cardId || '';
    const matchNumber =
      payload.matchNumber !== undefined && payload.matchNumber !== null
        ? Number(payload.matchNumber)
        : payload.autoIncrementCounter
        ? incrementGamePackCounter(resolvedPlayer, gameId, 1)
        : null;
    if (!targetCardId) {
      dropMeta = rollPuffinCardDrop({
        game_id: gameId,
        score: payload.score,
        difficulty: payload.difficulty || payload.mode,
        extra: payload.extra,
        matchNumber,
        strict98Mode: Boolean(payload.strict98Mode),
      });
      targetCardId = dropMeta.card.card_id;
    }

    const localResult = unlockPuffinCardLocal({
      player_id: resolvedPlayer,
      card_id: targetCardId,
      game_id: gameId,
      score: payload.score,
    });

    try {
      const cfg = resolvePuffinConfig({ appId: gameId });
      fetch(`${cfg.apiUrl}/cards/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: resolvedPlayer,
          card_id: targetCardId,
          game_id: gameId,
          score: payload.score || 0,
          difficulty: payload.difficulty || '',
        }),
      }).catch(() => {});
    } catch {}

    const fullResult = {
      ok: true,
      ...localResult,
      matchNumber: dropMeta?.matchNumber || matchNumber || null,
      isJackpot98: Boolean(dropMeta?.isJackpot98),
      meritDowngraded: Boolean(dropMeta?.meritDowngraded),
      rolledRarity: dropMeta?.rolledRarity || localResult.card.rarity,
    };

    if (payload.showToast !== false && typeof window !== 'undefined') {
      showPuffinCardRevealToast(fullResult);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('puffin-card-unlocked', { detail: fullResult }));
    }
    return fullResult;
  },

  /**
   * Opens a 3-Card Booster Pack for `game_id` (`tubature`, `carchess3d`, etc.) so the player
   * can pick 1 card of their choice ("una carta a scelta di quel pacco").
   * Tracks match count (`1..97` Commons -> `98th` Rare / Super-Rare Mythic Jackpot!).
   */
  async openGameBoosterPack(payload = {}) {
    const activeUser = this.getCurrentUser();
    const resolvedPlayer =
      normalizeProfileId(
        payload.player_id ?? payload.playerId ?? payload.userId ?? activeUser?.id ?? 'guest',
        false
      ) || 'guest';
    const gameId = String(
      payload.game_id || payload.gameId || payload.appId || resolvePuffinConfig().appId || 'tubature'
    )
      .trim()
      .toLowerCase();

    const packResult = rollGameBoosterPack({
      game_id: gameId,
      player_id: resolvedPlayer,
      score: payload.score || 1800,
      difficulty: payload.difficulty || payload.mode || 'medium',
      extra: payload.extra,
      matchNumber: payload.matchNumber,
      packSize: payload.packSize || 3,
      strict98Mode: Boolean(payload.strict98Mode),
      autoIncrementCounter: payload.matchNumber === undefined || payload.matchNumber === null,
    });

    if (payload.interactive !== false && typeof document !== 'undefined' && document.body) {
      return new Promise((resolve) => {
        showPuffinBoosterDraftModal({
          packResult,
          onPick: async (pickedChoice) => {
            const unlocked = await this.unlockCard({
              player_id: resolvedPlayer,
              game_id: gameId,
              card_id: pickedChoice.card.card_id,
              score: payload.score || 1800,
              matchNumber: packResult.matchNumber,
              showToast: true,
            });
            resolve({ ...packResult, picked: unlocked });
          },
        });
      });
    }

    const firstChoice = packResult.choices[0];
    const unlocked = await this.unlockCard({
      player_id: resolvedPlayer,
      game_id: gameId,
      card_id: firstChoice.card.card_id,
      score: payload.score || 1800,
      matchNumber: packResult.matchNumber,
      showToast: payload.showToast !== false,
    });
    return { ...packResult, picked: unlocked };
  },

  getGamePackCounter,
  setGamePackCounter,
  incrementGamePackCounter,
  rollGameBoosterPack,
  resolveCardFrontMedia,
  playMythicCardMusic,
  stopMythicCardMusic,

  resetDummyCards() {
    return ensureDummyUserCardsSeeded(true);
  },

  getFamilyInsights(options = {}) {
    const scores = options.scores || ensureDummyScoresSeeded(false);
    const userCards = options.userCards || ensureDummyUserCardsSeeded(false);
    return computeFamilyInsights({
      scores,
      userCards,
      profiles: PUFFIN_PROFILES,
      ringApps: getPuffinRingApps({ includeCandidates: true }),
    });
  },

  async fetchCloudInsights() {
    try {
      const cfg = resolvePuffinConfig();
      const res = await fetch(`${cfg.apiUrl}/insights`);
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data.insights) return data.insights;
      }
    } catch {}
    return this.getFamilyInsights();
  },

  comparePlayers(playerAId = 'ale', playerBId = 'seby', customInsights = null) {
    const insights = customInsights || this.getFamilyInsights();
    return compareFamilyRivals(insights, playerAId, playerBId);
  },

  md5Hex,
  computePuffinSecretMd5,
  verifyPuffinCredentials,
  OFFLINE_SEED: PUFFIN_OFFLINE_SEED,

  getOfflineSeed(forceReset = false) {
    return ensureOfflineSeedCached(forceReset);
  },

  setAirplaneMode(enabled) {
    return setAirplaneModeState(enabled);
  },

  isAirplaneMode(options = {}) {
    return isAirplaneModeActive(options);
  },

  async flushOfflineOutbox() {
    if (isAirplaneModeActive()) {
      return { ok: false, flushed: 0, reason: 'airplane_mode' };
    }
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.OUTBOX);
      const outbox = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(outbox) || outbox.length === 0) {
        return { ok: true, flushed: 0 };
      }
      const cfg = resolvePuffinConfig();
      const remaining = [];
      let flushed = 0;
      for (const scoreItem of outbox) {
        try {
          const res = await fetch(`${cfg.apiUrl}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scoreItem),
          });
          if (res.ok) {
            flushed += 1;
          } else {
            remaining.push(scoreItem);
          }
        } catch {
          remaining.push(scoreItem);
        }
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(remaining));
      }
      return { ok: true, flushed, remaining: remaining.length };
    } catch {
      return { ok: false, flushed: 0 };
    }
  },

  openScores(scope = null) {
    const el = typeof document !== 'undefined' ? document.querySelector('puffin-login') : null;
    if (el && typeof el.openScores === 'function') {
      el.openScores(scope);
    }
  },

  openCards(opts = {}) {
    const el = typeof document !== 'undefined' ? document.querySelector('puffin-login') : null;
    if (el && typeof el.openCards === 'function') {
      el.openCards(opts);
    } else if (typeof window !== 'undefined') {
      window.open('./cards.html', '_blank', 'noopener');
    }
  },

  openRing() {
    const el = typeof document !== 'undefined' ? document.querySelector('puffin-login') : null;
    if (el && typeof el.openRing === 'function') {
      el.openRing();
    }
  },

  playCardBackExplosion,
  playCardAudioOrFanfare,
};

export function computeFamilyInsights(options = {}) {
  return computeFamilyInsightsRaw({
    scores: options.scores || DEFAULT_DUMMY_SCORES,
    userCards: options.userCards || DEFAULT_DUMMY_USER_CARDS,
    profiles: options.profiles || PUFFIN_PROFILES,
    ringApps: options.ringApps || getPuffinRingApps({ includeCandidates: true }),
  });
}

export function ensureDummyUserCardsSeeded(forceReset = false) {
  const seeds = DEFAULT_DUMMY_USER_CARDS.map((uc) =>
    validateAndNormalizeUserCardRecord(uc, normalizeProfileId)
  );
  try {
    if (typeof localStorage === 'undefined') return seeds;
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    const existing = raw ? JSON.parse(raw) : [];
    if (forceReset || !Array.isArray(existing) || existing.length === 0) {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(seeds));
      return seeds;
    }
    const byId = new Map();
    for (const s of seeds) {
      byId.set(s.id, s);
    }
    let addedNewSeed = false;
    const existingIds = new Set();
    for (const rawItem of existing) {
      const norm = validateAndNormalizeUserCardRecord(rawItem, normalizeProfileId);
      existingIds.add(norm.id);
      const prev = byId.get(norm.id);
      if (prev) {
        byId.set(norm.id, {
          ...prev,
          ...norm,
          count: Math.max(Number(prev.count) || 1, Number(norm.count) || 1),
          best_score_context: Math.max(
            Number(prev.best_score_context) || 0,
            Number(norm.best_score_context) || 0
          ),
        });
      } else {
        byId.set(norm.id, norm);
      }
    }
    for (const s of seeds) {
      if (!existingIds.has(s.id)) addedNewSeed = true;
    }
    const merged = Array.from(byId.values());
    if (addedNewSeed) {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return seeds;
  }
}

export function unlockPuffinCardLocal({
  player_id = 'guest',
  card_id = 'tubature:ruby',
  game_id = 'tubature',
  score = 0,
} = {}) {
  const cleanPlayer = normalizeProfileId(player_id, false) || 'guest';
  const cleanCardId = normalizeCardId(card_id, game_id);
  const cardMeta = getCardById(cleanCardId, game_id);
  const nowIso = new Date().toISOString();
  const list = ensureDummyUserCardsSeeded(false);

  const idx = list.findIndex(
    (item) => item.player_id === cleanPlayer && item.card_id === cardMeta.card_id
  );
  let record;
  let isNew = true;
  if (idx >= 0) {
    isNew = false;
    const prev = list[idx];
    record = {
      ...prev,
      count: (Number(prev.count) || 1) + 1,
      last_unlocked_at: nowIso,
      best_score_context: Math.max(Number(prev.best_score_context) || 0, Number(score) || 0),
    };
    list[idx] = record;
  } else {
    record = validateAndNormalizeUserCardRecord(
      {
        player_id: cleanPlayer,
        card_id: cardMeta.card_id,
        game_id: cardMeta.game_id,
        rarity: cardMeta.rarity,
        count: 1,
        first_unlocked_at: nowIso,
        last_unlocked_at: nowIso,
        best_score_context: Number(score) || 0,
      },
      normalizeProfileId
    );
    list.push(record);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(list));
    }
  } catch {}

  return { card: cardMeta, ownership: record, isNew };
}

const RING_CSS = `
:host {
  display: block;
  font-family: 'Nunito', 'Quicksand', system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

.ring-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.15rem;
  width: 100%;
}

.ring-controls-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.ring-mode-btn {
  cursor: pointer;
  padding: 0.38rem 0.85rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.85);
  color: #fde68a;
  border: 1.5px solid rgba(251, 191, 36, 0.45);
  transition: all 0.18s ease;
}

.ring-mode-btn.active,
.ring-mode-btn:hover {
  background: linear-gradient(135deg, #ea580c, #d97706);
  color: #fff;
  border-color: #fde047;
  box-shadow: 0 0 16px rgba(249, 115, 22, 0.55);
}

.ring-stage {
  position: relative;
  width: min(100%, 540px);
  aspect-ratio: 1 / 1;
  border-radius: 1.75rem;
  overflow: hidden;
  border: 3px solid rgba(251, 191, 36, 0.65);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.78), 0 0 40px rgba(249, 115, 22, 0.35);
  background: #070913;
  user-select: none;
}

.ring-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.ring-orbit-wheel {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  animation: puffinOrbitSpin 32s linear infinite;
}

.ring-stage:hover .ring-orbit-wheel,
.ring-stage:hover .ring-medallion-upright {
  animation-play-state: paused;
}

@keyframes puffinOrbitSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes puffinOrbitCounterSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

.ring-spoke {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: rotate(var(--spoke-angle, 0deg)) translateY(calc(-1 * var(--orbit-radius, 188px)));
}

@media (max-width: 540px) {
  .ring-spoke {
    transform: rotate(var(--spoke-angle, 0deg)) translateY(-35vw);
  }
}

.ring-spoke-unrotate {
  transform: rotate(calc(-1 * var(--spoke-angle, 0deg)));
}

.ring-medallion-upright {
  animation: puffinOrbitCounterSpin 32s linear infinite;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 0;
  height: 0;
  position: relative;
}

.ring-medallion {
  position: absolute;
  top: 0;
  left: 0;
  translate: -50% -50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #fff;
  transition: scale 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ring-medallion:hover,
.ring-medallion:focus-visible {
  scale: 1.22;
  z-index: 30;
}

.ring-medallion-circle {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #facc15;
  background: #0f172a;
  box-shadow: 0 0 22px rgba(250, 204, 21, 0.75), 0 6px 18px rgba(0, 0, 0, 0.85);
  position: relative;
}

@media (max-width: 500px) {
  .ring-medallion-circle {
    width: 64px;
    height: 64px;
  }
}

.ring-medallion[data-status="live"] .ring-medallion-circle {
  border-color: #34d399;
  box-shadow: 0 0 24px rgba(52, 211, 153, 0.85), 0 0 12px rgba(250, 204, 21, 0.65);
}

.ring-medallion[data-status="upcoming"] .ring-medallion-circle {
  border-color: #fbbf24;
  border-style: dashed;
}

.ring-medallion[data-status="candidate"] .ring-medallion-circle {
  border-color: #38bdf8;
  opacity: 0.9;
}

.ring-medallion-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ring-medallion-status {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 0.58rem;
  font-weight: 900;
  padding: 0.1rem 0.36rem;
  border-radius: 999px;
  background: #064e3b;
  color: #6ee7b7;
  border: 1.5px solid #34d399;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.75);
  white-space: nowrap;
}

.ring-medallion[data-status="upcoming"] .ring-medallion-status {
  background: #451a03;
  color: #fde68a;
  border-color: #fbbf24;
}

.ring-medallion[data-status="candidate"] .ring-medallion-status {
  background: #0c4a6e;
  color: #bae6fd;
  border-color: #38bdf8;
}

.ring-medallion-label {
  margin-top: 0.28rem;
  background: rgba(9, 13, 28, 0.92);
  color: #fef08a;
  border: 1.5px solid rgba(250, 204, 21, 0.6);
  border-radius: 999px;
  padding: 0.14rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 900;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.85);
}

.ring-geocities-bar {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 1rem;
  background: linear-gradient(90deg, rgba(45, 20, 8, 0.92), rgba(20, 16, 42, 0.95), rgba(45, 20, 8, 0.92));
  border: 1.5px solid rgba(251, 146, 60, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
  flex-wrap: nowrap;
}

@media (max-width: 640px) {
  .ring-geocities-bar {
    flex-wrap: wrap;
    justify-content: center;
  }
}

.ring-geo-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.34rem 0.62rem;
  border-radius: 0.65rem;
  background: rgba(15, 23, 42, 0.9);
  color: #fde047;
  border: 1px solid rgba(250, 204, 21, 0.45);
  font-size: 0.72rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ring-geo-btn:hover {
  background: rgba(234, 88, 12, 0.32);
  color: #fff;
  border-color: #facc15;
  transform: translateY(-1px);
}

.ring-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.75rem;
  width: 100%;
}

.ring-app-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.8rem;
  border-radius: 0.95rem;
  background: rgba(17, 24, 39, 0.88);
  border: 1.5px solid rgba(255, 255, 255, 0.14);
  text-decoration: none;
  color: #f8fafc;
  transition: transform 0.16s ease, border-color 0.16s ease;
}

.ring-app-card:hover {
  transform: translateY(-2px);
  border-color: #facc15;
}

.ring-app-card.is-live {
  border-color: rgba(52, 211, 153, 0.55);
}

.ring-app-thumb {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #facc15;
  flex-shrink: 0;
}

.ring-app-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ring-app-title {
  font-size: 0.84rem;
  font-weight: 900;
  color: #fef08a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ring-app-url {
  font-size: 0.66rem;
  color: #94a3b8;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;

export class PuffinRingElement extends BaseElement {
  static get observedAttributes() {
    return ['include-candidates', 'bg-src'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const styleEl = document.createElement('style');
    styleEl.textContent = RING_CSS;
    this.shadowRoot.append(styleEl);
    this.$root = document.createElement('div');
    this.$root.className = 'ring-wrap';
    this.shadowRoot.append(this.$root);
    this.includeCandidates = this.hasAttribute('include-candidates');
    this._onRingUpdate = () => this.render();
  }

  connectedCallback() {
    this.includeCandidates = this.hasAttribute('include-candidates');
    window.addEventListener('puffin-ring-updated', this._onRingUpdate);
    this.render();
    syncPuffinRingFromVetrina();
  }

  disconnectedCallback() {
    window.removeEventListener('puffin-ring-updated', this._onRingUpdate);
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.includeCandidates = this.hasAttribute('include-candidates');
      this.render();
    }
  }

  render() {
    const apps = getPuffinRingApps({ includeCandidates: this.includeCandidates });
    const total = apps.length || 1;
    const bgSrc = this.getAttribute('bg-src') || './assets/puffin-ring.png';

    const spokesHtml = apps
      .map((app, idx) => {
        const angleDeg = Math.round((360 / total) * idx);
        const statusLabel =
          app.status === 'live' ? '🟢 LIVE' : app.status === 'upcoming' ? '🔜 NEXT' : '📋 CANDIDATE';
        return `
          <div class="ring-spoke" style="--spoke-angle: ${angleDeg}deg; --orbit-radius: 196px;">
            <div class="ring-spoke-unrotate" style="--spoke-angle: ${angleDeg}deg;">
              <div class="ring-medallion-upright">
                <a class="ring-medallion" href="${app.play_url}" target="_blank" rel="noopener" data-status="${app.status}" data-ring-id="${app.id}" title="${app.title} — ${app.play_url}">
                  <div class="ring-medallion-circle">
                    <img class="ring-medallion-img" src="${app.screenshot}" alt="${app.shortTitle}" loading="lazy" />
                  </div>
                  <span class="ring-medallion-status">${statusLabel}</span>
                  <span class="ring-medallion-label">${app.emoji} ${app.shortTitle}</span>
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    const cardsHtml = apps
      .map((app) => {
        const badge =
          app.status === 'live'
            ? '🟢 Live in Ring (supports_puffin_login: true)'
            : app.status === 'upcoming'
            ? '🔜 Arriving Next in Ring'
            : '📋 Future Candidate';
        return `
          <a class="ring-app-card ${app.status === 'live' ? 'is-live' : ''}" href="${app.play_url}" target="_blank" rel="noopener">
            <img class="ring-app-thumb" src="${app.screenshot}" alt="${app.shortTitle}" loading="lazy" />
            <div class="ring-app-meta">
              <div class="ring-app-title">${app.emoji} ${app.shortTitle}</div>
              <div style="font-size:0.68rem; color:#fde68a; font-weight:700;">${badge}</div>
              <div class="ring-app-url">${app.play_url}</div>
            </div>
          </a>
        `;
      })
      .join('');

    const firstApp = apps[0];
    const lastApp = apps[apps.length - 1] || firstApp;

    this.$root.innerHTML = `
      <div class="ring-controls-top">
        <button type="button" class="ring-mode-btn ${!this.includeCandidates ? 'active' : ''}" data-mode="core">
          🔥 Core Ring (${getPuffinRingApps({ includeCandidates: false }).length} Apps: ${getPuffinRingApps({ includeCandidates: false }).map((a) => a.shortTitle).join(' + ')})
        </button>
        <button type="button" class="ring-mode-btn ${this.includeCandidates ? 'active' : ''}" data-mode="all">
          🌌 Preview Full N-App Orbit (${getPuffinRingApps({ includeCandidates: true }).length} Apps)
        </button>
      </div>

      <div class="ring-stage" aria-label="Rotating Puffin Login Ring of Fire">
        <img class="ring-bg-img" src="${bgSrc}" alt="Puffin Login Ring of Fire" />
        <div class="ring-orbit-wheel">
          ${spokesHtml}
        </div>
      </div>

      <div class="ring-geocities-bar">
        <a class="ring-geo-btn" href="${lastApp.play_url}" target="_blank" rel="noopener">
          ⬅️ Prev: ${lastApp.emoji} ${lastApp.shortTitle}
        </a>
        <a class="ring-geo-btn" href="${VETRINA_RING_HASH_URL}" target="_blank" rel="noopener">
          🎠 Central Registry: palladius/vetrina (#puffin-ring) ↗
        </a>
        <button type="button" class="ring-geo-btn" data-action="random">
          🎲 Random Ring App
        </button>
        <a class="ring-geo-btn" href="${firstApp.play_url}" target="_blank" rel="noopener">
          Next: ${firstApp.emoji} ${firstApp.shortTitle} ➡️
        </a>
      </div>

      <div class="ring-cards-grid">
        ${cardsHtml}
      </div>
    `;

    this.$root.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.includeCandidates = mode === 'all';
        this.render();
      });
    });

    const randBtn = this.$root.querySelector('[data-action="random"]');
    if (randBtn) {
      randBtn.addEventListener('click', () => {
        const pick = apps[Math.floor(Math.random() * apps.length)] || firstApp;
        if (pick?.play_url) {
          window.open(pick.play_url, '_blank', 'noopener');
        }
      });
    }
  }
}

export const PuffinCardsElement = createPuffinCardsElementClass({
  BaseElementClass: BaseElement,
  getPuffinLoginApi: () => PuffinLogin,
  getProfileByIdFn: getProfileById,
});

const GAME_DASHBOARD_CSS = `
:host {
  display: block;
  font-family: 'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  color: #e2e8f0;
}
:host([hidden]) {
  display: none !important;
}
.gd-wrap {
  background: #0f1115;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px 18px;
}
.gd-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.gd-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}
.gd-pills {
  display: inline-flex;
  flex-wrap: wrap;
  background: #111319;
  padding: 2px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 10px;
}
.gd-pill {
  background: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 5px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.gd-pill.active {
  background: #252b38;
  color: #f8fafc;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.gd-section-title {
  margin: 14px 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
}
.gd-table-wrap {
  overflow-x: auto;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
table.gd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
}
table.gd-table th {
  background: #12151c;
  color: #94a3b8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  padding: 7px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
}
table.gd-table tbody tr {
  background: #15181f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
table.gd-table tbody tr:nth-child(even) {
  background: #191d26;
}
table.gd-table tbody tr:hover {
  background: #212632;
}
table.gd-table td {
  padding: 6px 10px;
  height: 36px;
  vertical-align: middle;
  white-space: nowrap;
}
.gd-hero-cell {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.gd-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--hero-color, #94a3b8);
  background: #1e2430;
}
.num-chip {
  display: inline-block;
  min-width: 48px;
  text-align: center;
  padding: 2px 7px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.num-chip--ok {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.28);
  color: #34d399;
}
.num-chip--warn {
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.28);
  color: #fbbf24;
}
.num-chip--bad {
  background: rgba(244, 63, 94, 0.14);
  border: 1px solid rgba(244, 63, 94, 0.28);
  color: #fb7185;
}
.gd-mode-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  border-left: 3px solid #38bdf8;
  padding-left: 8px;
}
.icon-svg {
  width: 15px;
  height: 15px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: -2px;
}
`;

export function renderPerGameDashboardHtml(dashboard, activeGameId = 'carlesso-fotoquad') {
  const dash =
    dashboard && dashboard.bySubMode
      ? dashboard
      : computePerGameDashboard(ensureDummyScoresSeeded(false), activeGameId);
  const diffOrder = {
    facile: 1,
    easy: 1,
    '3x3': 2,
    '4x4': 3,
    medio: 4,
    moyen: 4,
    medium: 4,
    '5x5': 5,
    '6x6': 6,
    easy_6x6: 6,
    difficile: 7,
    hard: 7,
    '7x7': 8,
    '8x8': 9,
  };
  const sortBuckets = (arr) =>
    [...arr].sort(
      (a, b) =>
        (diffOrder[a.key] ?? 50) - (diffOrder[b.key] ?? 50) ||
        String(a.key).localeCompare(String(b.key))
    );
  const subEntries = sortBuckets(Object.values(dash.bySubMode || {}));
  const gridEntries = sortBuckets(Object.values(dash.byGrid || {}));
  const timeRows = gridEntries.length > 0 ? gridEntries : subEntries;
  const playerEntries = Object.values(dash.byPlayer || {}).sort(
    (a, b) => b.bestScore - a.bestScore
  );

  const fmtSec = (sec) => {
    const s = Number(sec) || 0;
    if (s <= 0) return '—';
    return `${s}s`;
  };

  const renderHeroAvatar = (hero) => {
    if (!hero) return '—';
    const av = hero.avatar || `assets/avatars/${hero.player_id || 'guest'}.png`;
    return `<span class="gd-hero-cell" title="${hero.displayName || hero.shortName}">
      <img class="gd-avatar" src="${av}" alt="${hero.shortName}" style="--hero-color:${hero.colorHex || '#94a3b8'}" />
      <span>${hero.shortName}</span>
    </span>`;
  };

  const svgTrophy = `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
  const svgClock = `<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  const champRowsHtml = subEntries
    .map((b) => {
      const c = b.champion;
      const f = b.fastestPlayer;
      const pctTone =
        c && c.percentage !== null
          ? c.percentage >= 80
            ? 'num-chip--ok'
            : c.percentage >= 60
            ? 'num-chip--warn'
            : 'num-chip--bad'
          : 'num-chip--ok';
      const scoreChip = c
        ? `<span class="num-chip ${pctTone}">${c.score} pt${
            c.percentage !== null && c.percentage !== undefined ? ` · ${c.percentage}%` : ''
          }</span>`
        : '—';
      const podiumStr = (b.podium || [])
        .map((p, i) => `#${i + 1} ${p.shortName} (${p.score})`)
        .join(' · ');
      return `
        <tr data-submode="${b.key}">
          <td><span class="gd-mode-tag">${b.label.toUpperCase()}</span></td>
          <td>${c ? `${renderHeroAvatar(c)} ${scoreChip}` : '—'}</td>
          <td>${f ? `${renderHeroAvatar(f)} <span class="num-chip num-chip--ok">${fmtSec(f.duration_sec)}</span>` : '—'}</td>
          <td>${podiumStr || '—'}</td>
          <td><span class="num-chip num-chip--ok">${b.totalMatches}</span></td>
        </tr>
      `;
    })
    .join('');

  const timeRowsHtml = timeRows
    .map((b) => {
      const d = b.durationStats || {};
      const f = b.fastestPlayer;
      const perHeroStr = Object.values(b.byPlayer || {})
        .slice(0, 3)
        .map((p) => `${p.shortName}: ${p.avgDurationSec}s`)
        .join(' · ');
      return `
        <tr data-time-row="${b.key}">
          <td><span class="gd-mode-tag">${b.label.toUpperCase()}</span></td>
          <td><span class="num-chip num-chip--warn">${fmtSec(d.avgSec)}</span></td>
          <td>${f ? `${svgClock} <span class="num-chip num-chip--ok">${fmtSec(d.minSec)}</span> (${f.shortName})` : fmtSec(d.minSec)}</td>
          <td>${fmtSec(d.medianSec)}</td>
          <td>${b.efficiencyStats?.minMoves ?? '—'} / ${b.efficiencyStats?.minHints ?? '—'}</td>
          <td>${perHeroStr || '—'}</td>
        </tr>
      `;
    })
    .join('');

  const playerRowsHtml = playerEntries
    .map(
      (p) => `
        <tr data-player-row="${p.player_id || 'null'}">
          <td>${renderHeroAvatar(p)}</td>
          <td>${p.matches}</td>
          <td><span class="num-chip num-chip--ok">${p.bestScore} pt</span></td>
          <td>${p.avgScore} pt</td>
          <td><span class="num-chip num-chip--ok">${fmtSec(p.bestDurationSec)}</span></td>
          <td>${fmtSec(p.avgDurationSec)}</td>
          <td>${p.minMoves ?? '—'}</td>
          <td>${p.minHints ?? '—'}</td>
        </tr>
      `
    )
    .join('');

  return `
    <h3 class="gd-section-title">${svgTrophy} Campioni</h3>
    <div class="gd-table-wrap">
      <table class="gd-table" id="gd-champions-table">
        <thead>
          <tr>
            <th>Livello</th>
            <th>Campione Punteggio</th>
            <th>Record Tempo</th>
            <th>Podio</th>
            <th>Partite</th>
          </tr>
        </thead>
        <tbody>
          ${champRowsHtml || '<tr><td colspan="5">Nessuna partita</td></tr>'}
        </tbody>
      </table>
    </div>

    <h3 class="gd-section-title">${svgClock} Tempi</h3>
    <div class="gd-table-wrap">
      <table class="gd-table" id="gd-times-table">
        <thead>
          <tr>
            <th>Livello</th>
            <th>Tempo Medio</th>
            <th>Tempo Minimo</th>
            <th>Mediana</th>
            <th>Mosse / Aiuti</th>
            <th>Medie Giocatori</th>
          </tr>
        </thead>
        <tbody>
          ${timeRowsHtml || '<tr><td colspan="6">Nessun dato</td></tr>'}
        </tbody>
      </table>
    </div>

    <h3 class="gd-section-title">Eroi</h3>
    <div class="gd-table-wrap">
      <table class="gd-table" id="gd-players-table">
        <thead>
          <tr>
            <th>Eroe</th>
            <th>Partite</th>
            <th>Best Score</th>
            <th>Media Score</th>
            <th>Miglior Tempo</th>
            <th>Tempo Medio</th>
            <th>Min Mosse</th>
            <th>Min Aiuti</th>
          </tr>
        </thead>
        <tbody>
          ${playerRowsHtml || '<tr><td colspan="8">Nessun giocatore</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

export class PuffinGameDashboardElement extends BaseElement {
  static get observedAttributes() {
    return ['game-id'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const styleEl = document.createElement('style');
    styleEl.textContent = GAME_DASHBOARD_CSS;
    this.shadowRoot.append(styleEl);
    this.$root = document.createElement('div');
    this.$root.className = 'gd-wrap';
    this.shadowRoot.append(this.$root);
    this.activeGameId = this.getAttribute('game-id') || 'ale-french';
    this._onUpdate = () => this.refresh();
  }

  connectedCallback() {
    this.activeGameId = this.getAttribute('game-id') || 'ale-french';
    window.addEventListener('puffin-score-recorded', this._onUpdate);
    this.refresh();
  }

  disconnectedCallback() {
    window.removeEventListener('puffin-score-recorded', this._onUpdate);
  }

  attributeChangedCallback(name, _oldVal, newVal) {
    if (name === 'game-id' && newVal && this.isConnected) {
      this.activeGameId = newVal;
      this.refresh();
    }
  }

  async refresh() {
    const dash = await PuffinLogin.fetchCloudGameDashboard(this.activeGameId);
    this.render(dash);
  }

  render(dashData) {
    const games = [
      { id: 'ale-french', label: '🇫🇷 Ale French' },
      { id: 'carlesso-fotoquad', label: 'FotoQuad' },
      { id: 'kids-jigsaw-puzzle', label: 'Kids Jigsaw' },
      { id: 'tubature', label: 'Tubature' },
      { id: 'puffin-snake', label: 'Puffin Snake' },
      { id: 'carchess3d', label: 'CarChess 3D' },
      { id: 'smurfs-and-dragons', label: 'Smurfs & Dragons' },
      { id: 'family-mahjong-3d', label: '3D Mahjong' },
      { id: 'pupurabbu-3d', label: 'Pupurabbu 3D' },
    ];

    const pillsHtml = games
      .map(
        (g) => `
          <button type="button" class="gd-pill ${
            g.id === this.activeGameId ? 'active' : ''
          }" data-game-pill="${g.id}">
            ${g.label}
          </button>
        `
      )
      .join('');

    const bodyHtml = renderPerGameDashboardHtml(dashData, this.activeGameId);

    this.$root.innerHTML = `
      <div class="gd-header">
        <h2 class="gd-title">Sinottica</h2>
        <div class="gd-pills" role="radiogroup" aria-label="Gioco">
          ${pillsHtml}
        </div>
      </div>
      ${bodyHtml}
    `;

    this.$root.querySelectorAll('[data-game-pill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeGameId = btn.getAttribute('data-game-pill');
        this.setAttribute('game-id', this.activeGameId);
      });
    });
  }
}

if (typeof customElements !== 'undefined') {
  if (!customElements.get('puffin-leaderboard')) {
    customElements.define('puffin-leaderboard', PuffinLeaderboardElement);
  }
  if (!customElements.get('puffin-ring')) {
    customElements.define('puffin-ring', PuffinRingElement);
  }
  if (!customElements.get('puffin-cards')) {
    customElements.define('puffin-cards', PuffinCardsElement);
  }
  if (!customElements.get('puffin-game-dashboard')) {
    customElements.define('puffin-game-dashboard', PuffinGameDashboardElement);
  }
  if (!customElements.get('puffin-login')) {
    customElements.define('puffin-login', PuffinLoginElement);
  }
}

if (typeof window !== 'undefined') {
  window.PuffinLogin = PuffinLogin;
}
