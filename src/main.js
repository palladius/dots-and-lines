/**
 * main.js — Dots & Lines Deluxe (Pipopipette Neon Dual-Puffin Edition)
 *
 * Orchestrates:
 * - Dual PuffinLogin (`player-slot="p1"` vs `player-slot="p2"`) with dynamic Pixar colors & avatars
 * - Pure `DotsEngine` grid state (`3x3`, `4x4`, `4x5` Paolo Classic, `5x5`, `6x6`) + Undo stack + Smart CPU Bot
 * - `NeonBoardRenderer` (laser lines, white-hot latest segment core, particle bursts, avatar stamps)
 * - `SoundEngine` (ascending Do-Re-Mi-Fa-Sol-La-Si-Do combo scale + fanfare)
 * - Cloud High Scores & Head-to-Head (`H2H`) Rivalry stats via `PuffinLogin.submitDualMatchScore()`
 */

import { PuffinLogin } from './puffin-login.js';
import {
  createGameState,
  claimSegment,
  undoMove,
  chooseBotMove,
  getMoveTimeStats,
} from './core/DotsEngine.js';
import { SoundEngine } from './audio/SoundEngine.js';
import { NeonBoardRenderer } from './ui/NeonBoardRenderer.js';

const COPY = {
  it: {
    langToggleHtml: 'EN · <strong>it</strong>',
    langShort: 'IT',
    heroSub: 'Edizione Neon Dual-Puffin • Ale 🐉 vs Seby 🏎️ vs Papino 👑',
    rulesHeading: 'Regole',
    rulesItems: [
      'Scorri (swipe) o tocca tra due puntini adiacenti per tracciare una linea neon.',
      'Chiudi il 4° lato di un quadrato per conquistarlo con il tuo avatar e guadagnare un <strong>turno extra</strong>!',
      'Incatena più quadrati di fila per attivare la <strong>Scala Musicale Combo (Do-Re-Mi-Fa-Sol!)</strong>.',
    ],
    gridLabel: 'Dimensione Griglia',
    continueBtn: 'CONTINUA PARTITA',
    newGameBtnStart: 'NUOVA PARTITA',
    instruction: 'Scorri o tocca per unire • Annulla se serve',
    undoBtn: 'Annulla',
    newGameBtn: 'Nuova partita',
    playAgainBtn: '↻ Gioca Ancora',
    closeBtn: 'Chiudi',
    dualPrompt: 'Doppio Login: clicca i badge P1 e P2 per scegliere chi sfida chi!',
    h2hTemplate: (nameA, winsA, winsB, nameB, ties, maxCombo, holder) =>
      `⚔️ H2H ${nameA} ${winsA} – ${winsB} ${nameB}${ties ? ` (${ties} par.)` : ''}${
        maxCombo ? ` • Max Combo: ${maxCombo}x (${holder})` : ''
      }`,
    vsBotLabel: (nameA) => `🤖 ${nameA} sfida il Bot CPU Neon`,
    victoryTitle: (name) => `🏆 Vince ${name}!`,
    tieTitle: '🤝 Pareggio Epico!',
    summaryLine: (n1, s1, s2, n2, grid, combo) =>
      `${n1} (${s1} box) vs ${n2} (${s2} box) su griglia ${grid} • Max Combo ${combo}x`,
    avgMoveLabel: '⏱️ Media/mossa',
    maxMoveLabel: '🐢 Max/mossa',
    movesWord: 'mosse',
  },
  en: {
    langToggleHtml: '<strong>EN</strong> · it',
    langShort: 'EN',
    heroSub: 'Dual-Puffin Neon Edition • Ale 🐉 vs Seby 🏎️ vs Dad 👑',
    rulesHeading: 'Rules',
    rulesItems: [
      'Swipe or tap between two adjacent dots to draw a neon line.',
      'Complete the 4th side of a box to claim it with your avatar and earn an <strong>extra turn</strong>!',
      'Chain multiple boxes in a row to trigger the ascending <strong>Musical Combo Scale (Do-Re-Mi-Fa-Sol!)</strong>.',
    ],
    gridLabel: 'Grid Size',
    continueBtn: 'CONTINUE',
    newGameBtnStart: 'NEW GAME',
    instruction: 'Swipe to connect • Undo if needed',
    undoBtn: 'Undo',
    newGameBtn: 'New game',
    playAgainBtn: '↻ Play Again',
    closeBtn: 'Close',
    dualPrompt: 'Dual Login: tap the P1 & P2 badges to pick the two challengers!',
    h2hTemplate: (nameA, winsA, winsB, nameB, ties, maxCombo, holder) =>
      `⚔️ H2H ${nameA} ${winsA} – ${winsB} ${nameB}${ties ? ` (${ties} ties)` : ''}${
        maxCombo ? ` • Max Combo: ${maxCombo}x (${holder})` : ''
      }`,
    vsBotLabel: (nameA) => `🤖 ${nameA} vs Neon CPU Bot`,
    victoryTitle: (name) => `🏆 ${name} Wins!`,
    tieTitle: '🤝 Epic Tie!',
    summaryLine: (n1, s1, s2, n2, grid, combo) =>
      `${n1} (${s1} boxes) vs ${n2} (${s2} boxes) on ${grid} grid • Max Combo ${combo}x`,
    avgMoveLabel: '⏱️ Avg/move',
    maxMoveLabel: '🐢 Max/move',
    movesWord: 'moves',
  },
};

// Default distinct neon themes when a slot is unauthenticated or shares the same profile
const FALLBACK_P1 = {
  id: 'guest',
  shortName: 'Player 1',
  displayName: 'Player 1',
  colorHex: '#22D3EE', // Paolo's Cyan default when not logged in
  glowHex: 'rgba(34, 211, 238, 0.45)',
  avatar: './assets/avatars/guest-simple.svg',
  emoji: '👤',
  iconKind: 'guest',
};

const FALLBACK_P2 = {
  id: 'guest',
  shortName: 'Player 2',
  displayName: 'Player 2',
  colorHex: '#F43F5E', // Paolo's Magenta default when not logged in
  glowHex: 'rgba(244, 63, 94, 0.45)',
  avatar: './assets/avatars/guest-simple.svg',
  emoji: '👤',
  iconKind: 'guest',
};

const CPU_BOT_PROFILE = {
  id: 'cpu',
  shortName: 'Bot CPU',
  displayName: 'Bot CPU 🤖',
  colorHex: '#16A34A', // Dark terminal-phosphor green (purple #A855F7 is Kate's color, don't clash!)
  glowHex: 'rgba(22, 163, 74, 0.45)',
  avatar: './assets/avatars/bot-simple.svg',
  emoji: '🤖',
  iconKind: 'bot',
};

class DotsAndLinesApp {
  constructor() {
    this.lang = localStorage.getItem('dots_lang_v1') || 'en'; // Match Paolo's EN default with 1-click IT
    this.gridKey = localStorage.getItem('dots_grid_v1') || '4x5';
    this.mode = localStorage.getItem('dots_mode_v1') || '2p-local'; // '2p-local' | '1p-bot'
    this.sound = new SoundEngine();
    this.state = null;
    this.botTimer = null;

    this._cacheDom();
    this._initPuffinLogin();

    this.renderer = new NeonBoardRenderer(this.$canvas, {
      onSelectSegment: (type, r, c) => this.handleHumanSegment(type, r, c),
    });

    this._bindUiEvents();
    this._syncAppVersion();
    this.syncPlayersFromPuffin();
    this.applyLanguage();
    this.syncSoundButtons();
    this.startNewGame(this.gridKey, false);

    window.addEventListener('resize', () => this.renderer.resize());
  }

  _syncAppVersion() {
    fetch('./VERSION', { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : ''))
      .then((txt) => {
        const clean = String(txt || '').trim();
        if (clean) {
          document.querySelectorAll('.app-version-label').forEach((el) => {
            el.textContent = clean;
          });
        }
      })
      .catch(() => {});
  }

  _cacheDom() {
    this.$startScreen = document.getElementById('start-screen');
    this.$continueBtn = document.getElementById('continue-game-btn');
    this.$startNewBtn = document.getElementById('start-new-game-btn');
    this.$startLangBtn = document.getElementById('start-lang-btn');
    this.$startSoundBtn = document.getElementById('start-sound-btn');
    this.$startHofBtn = document.getElementById('start-hof-btn');
    this.$gridSelector = document.getElementById('grid-selector');

    this.$homeBtn = document.getElementById('home-btn');
    this.$hudLangBtn = document.getElementById('hud-lang-btn');
    this.$hudSoundBtn = document.getElementById('hud-sound-btn');
    this.$hudHofBtn = document.getElementById('hud-hof-btn');

    this.$p1Card = document.getElementById('p1-card');
    this.$p2Card = document.getElementById('p2-card');
    this.$p1Score = document.getElementById('p1-score');
    this.$p2Score = document.getElementById('p2-score');
    this.$p1SlotLabel = document.getElementById('p1-slot-label');
    this.$p2SlotLabel = document.getElementById('p2-slot-label');
    this.$p1ComboPill = document.getElementById('p1-combo-pill');
    this.$p2ComboPill = document.getElementById('p2-combo-pill');
    this.$puffinP1 = document.getElementById('puffin-p1');
    this.$puffinP2 = document.getElementById('puffin-p2');
    this.$p2BotPill = document.getElementById('p2-bot-pill');

    this.$h2hSummary = document.getElementById('h2h-summary');
    this.$mode2pBtn = document.getElementById('mode-2p-btn');
    this.$modeBotBtn = document.getElementById('mode-bot-btn');
    this.$instructionText = document.getElementById('instruction-text');
    this.$liveComboBadge = document.getElementById('live-combo-badge');

    this.$canvas = document.getElementById('dots-canvas');
    this.$undoBtn = document.getElementById('undo-btn');
    this.$newGameBtn = document.getElementById('new-game-btn');

    this.$gameoverDialog = document.getElementById('gameover-dialog');
    this.$winnerBanner = document.getElementById('winner-banner');
    this.$winnerAvatar = document.getElementById('winner-avatar');
    this.$winnerTitle = document.getElementById('winner-title');
    this.$winnerSub = document.getElementById('winner-sub');
    this.$winnerTimingStats = document.getElementById('winner-timing-stats');
    this.$winnerH2hLine = document.getElementById('winner-h2h-line');
    this.$playAgainBtn = document.getElementById('play-again-btn');
    this.$closeDialogBtn = document.getElementById('close-dialog-btn');
  }

  _initPuffinLogin() {
    PuffinLogin.init({
      appId: 'dots-and-lines',
      apiUrl: 'https://puffin-login-932724269481.europe-west1.run.app/v1',
      requireLogin: false,
      acceptGuest: true,
      mountBadge: false,
    });

    window.addEventListener('puffin-user-changed', () => {
      this.syncPlayersFromPuffin();
      this.updateHud();
    });
  }

  getResolvedPlayers() {
    const u1 = PuffinLogin.getCurrentUser('p1');
    const u2 =
      this.mode === '1p-bot' ? CPU_BOT_PROFILE : PuffinLogin.getCurrentUser('p2');

    const resolveAvatarUrl = (av, id) => {
      if (id === 'cpu' || id === 'saga') return './assets/avatars/bot-simple.svg';
      if (id === 'guest') return './assets/avatars/guest-simple.svg';
      const raw = String(av || '').trim();
      if (!raw) return './assets/avatars/guest-simple.svg';
      if (raw.startsWith('http') || raw.startsWith('./') || raw.startsWith('/')) return raw;
      if (raw.startsWith('assets/')) return `./${raw}`;
      return `./assets/avatars/${raw}`;
    };

    const resolveIconKind = (id, isLogged) => {
      if (id === 'cpu' || id === 'saga') return 'bot';
      if (!isLogged || id === 'guest') return 'guest';
      return 'family';
    };

    const p1 = u1
      ? {
          id: u1.id,
          guest_name: u1.guest_name,
          name: u1.shortName || u1.displayName,
          shortName: u1.shortName || u1.displayName,
          colorHex: u1.id === 'guest' ? '#22D3EE' : u1.colorHex || '#EF4444',
          glowHex: `${u1.id === 'guest' ? '#22D3EE' : u1.colorHex || '#EF4444'}73`,
          avatar: resolveAvatarUrl(u1.avatar, u1.id),
          emoji: u1.id === 'guest' ? '👤' : u1.emoji || '🐉',
          iconKind: resolveIconKind(u1.id, true),
          isLogged: true,
        }
      : {
          ...FALLBACK_P1,
          name: 'Player 1',
          isLogged: false,
        };

    let p2 = u2
      ? {
          id: u2.id,
          guest_name: u2.guest_name,
          name: u2.shortName || u2.displayName,
          shortName: u2.shortName || u2.displayName,
          colorHex: u2.id === 'guest' ? '#F43F5E' : u2.colorHex || '#3B82F6',
          glowHex: `${u2.id === 'guest' ? '#F43F5E' : u2.colorHex || '#3B82F6'}73`,
          avatar: resolveAvatarUrl(u2.avatar, u2.id),
          emoji:
            u2.id === 'cpu'
              ? '🤖'
              : u2.id === 'guest'
              ? '👤'
              : u2.emoji || '🏎️',
          iconKind: resolveIconKind(u2.id, true),
          isLogged: true,
        }
      : {
          ...FALLBACK_P2,
          name: 'Player 2',
          isLogged: false,
        };

    // If both slots picked the exact same color (e.g. Guest vs Guest), give P2 a contrasting neon magenta/cyan
    if (p1.colorHex.toLowerCase() === p2.colorHex.toLowerCase()) {
      p2 = {
        ...p2,
        colorHex: '#F43F5E',
        glowHex: 'rgba(244, 63, 94, 0.45)',
      };
    }

    return { p1, p2, rawP1: u1, rawP2: u2 };
  }

  syncPlayersFromPuffin() {
    const { p1, p2, rawP1, rawP2 } = this.getResolvedPlayers();

    document.documentElement.style.setProperty('--p1-color', p1.colorHex);
    document.documentElement.style.setProperty('--p1-glow', p1.glowHex);
    document.documentElement.style.setProperty('--p2-color', p2.colorHex);
    document.documentElement.style.setProperty('--p2-glow', p2.glowHex);

    this.$p1SlotLabel.textContent = p1.isLogged ? `P1 • ${p1.name}` : 'PLAYER 1';
    this.$p2SlotLabel.textContent =
      this.mode === '1p-bot'
        ? 'CPU BOT'
        : p2.isLogged
        ? `P2 • ${p2.name}`
        : 'PLAYER 2';

    // Use the simple minimalist SVG icon inside the <puffin-login> badge when logged in as Guest or Bot
    const syncSlotBadgeSimpleIcon = (el, player) => {
      const badgeImg =
        el?.$badgeImg || el?.shadowRoot?.querySelector('.badge-avatar-img');
      if (!badgeImg) return;
      if (player.iconKind === 'guest') {
        badgeImg.src = './assets/avatars/guest-simple.svg';
        badgeImg.style.filter = 'none';
        badgeImg.style.objectFit = 'contain';
        badgeImg.style.objectPosition = 'center';
      } else if (player.iconKind === 'bot') {
        badgeImg.src = './assets/avatars/bot-simple.svg';
        badgeImg.style.filter = 'none';
        badgeImg.style.objectFit = 'contain';
        badgeImg.style.objectPosition = 'center';
      } else {
        badgeImg.style.filter = '';
        badgeImg.style.objectFit = '';
        badgeImg.style.objectPosition = '';
      }
    };
    syncSlotBadgeSimpleIcon(this.$puffinP1, p1);
    syncSlotBadgeSimpleIcon(this.$puffinP2, p2);

    if (this.mode === '1p-bot') {
      this.$puffinP2.hidden = true;
      this.$p2BotPill.hidden = false;
    } else {
      this.$puffinP2.hidden = false;
      this.$p2BotPill.hidden = true;
    }

    this.renderer?.setPlayers({ p1, p2 });
    this._updateH2HStrip(rawP1, rawP2, p1, p2);
  }

  _updateH2HStrip(rawP1, rawP2, p1, p2) {
    const tr = COPY[this.lang] || COPY.it;
    if (this.mode === '1p-bot') {
      this.$h2hSummary.innerHTML = `<span>${tr.vsBotLabel(p1.name)}</span>`;
      return;
    }
    if (rawP1 && rawP2) {
      const h2h = PuffinLogin.getHeadToHeadStats(rawP1.id, rawP2.id, {
        gameId: 'dots-and-lines',
        guestNameA: rawP1.guest_name,
        guestNameB: rawP2.guest_name,
      });
      const holderName =
        h2h.longestComboOverall?.holder === rawP1.id ? p1.name : p2.name;
      this.$h2hSummary.textContent = tr.h2hTemplate(
        p1.name,
        h2h.winsA,
        h2h.winsB,
        p2.name,
        h2h.ties,
        h2h.longestComboOverall?.count || 0,
        holderName
      );
    } else {
      this.$h2hSummary.textContent = `🐧 ${tr.dualPrompt}`;
    }
  }

  _bindUiEvents() {
    const toggleLang = () => {
      this.lang = this.lang === 'en' ? 'it' : 'en';
      localStorage.setItem('dots_lang_v1', this.lang);
      PuffinLogin.setLang(this.lang);
      this.applyLanguage();
      this.syncPlayersFromPuffin();
      this.updateHud();
    };

    this.$startLangBtn.addEventListener('click', toggleLang);
    this.$hudLangBtn.addEventListener('click', toggleLang);

    const toggleSound = () => {
      this.sound.toggle();
      this.syncSoundButtons();
    };
    this.$startSoundBtn.addEventListener('click', toggleSound);
    this.$hudSoundBtn.addEventListener('click', toggleSound);

    const openHofOnly = () => {
      this.$winnerBanner.hidden = true;
      if (typeof this.$gameoverDialog.showModal === 'function' && !this.$gameoverDialog.open) {
        this.$gameoverDialog.showModal();
      }
    };
    this.$startHofBtn.addEventListener('click', openHofOnly);
    this.$hudHofBtn.addEventListener('click', openHofOnly);

    this.$gridSelector.querySelectorAll('[data-grid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const g = btn.getAttribute('data-grid');
        this.gridKey = g;
        localStorage.setItem('dots_grid_v1', g);
        this.$gridSelector.querySelectorAll('[data-grid]').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-grid') === g);
        });
      });
    });

    this.$continueBtn.addEventListener('click', () => {
      this.sound.playLineClick();
      this.$startScreen.hidden = true;
      if (this.state) {
        this.state.turnStartedAtMs = Date.now();
      }
      this.renderer.resize();
    });

    this.$startNewBtn.addEventListener('click', () => {
      this.sound.playLineClick();
      this.$startScreen.hidden = true;
      this.startNewGame(this.gridKey, true);
    });

    this.$homeBtn.addEventListener('click', () => {
      this.sound.playLineClick();
      this.$continueBtn.hidden = !this.state || this.state.isGameOver;
      this.$startScreen.hidden = false;
    });

    this.$undoBtn.addEventListener('click', () => {
      if (!this.state) return;
      if (this.botTimer) {
        clearTimeout(this.botTimer);
        this.botTimer = null;
      }
      const res = undoMove(this.state);
      if (res.ok) {
        // In 1P vs Bot mode, if undoing leaves it on Bot's turn, undo until P1's turn
        if (this.mode === '1p-bot' && this.state.currentTurn === 'p2' && this.state.history.length > 0) {
          undoMove(this.state);
        }
        this.sound.playUndo();
        this.updateHud();
      }
    });

    this.$newGameBtn.addEventListener('click', () => {
      this.sound.playLineClick();
      this.startNewGame(this.gridKey, true);
    });

    this.$mode2pBtn.addEventListener('click', () => {
      this.setMode('2p-local');
    });

    this.$modeBotBtn.addEventListener('click', () => {
      this.setMode('1p-bot');
    });

    this.$playAgainBtn.addEventListener('click', () => {
      if (this.$gameoverDialog.open) this.$gameoverDialog.close();
      this.startNewGame(this.gridKey, true);
    });

    this.$closeDialogBtn.addEventListener('click', () => {
      if (this.$gameoverDialog.open) this.$gameoverDialog.close();
    });
  }

  setMode(newMode) {
    this.mode = newMode === '1p-bot' ? '1p-bot' : '2p-local';
    localStorage.setItem('dots_mode_v1', this.mode);
    this.$mode2pBtn.classList.toggle('active', this.mode === '2p-local');
    this.$modeBotBtn.classList.toggle('active', this.mode === '1p-bot');
    this.syncPlayersFromPuffin();
    this.startNewGame(this.gridKey, true);
  }

  applyLanguage() {
    const tr = COPY[this.lang] || COPY.it;
    document.documentElement.lang = this.lang;
    this.$startLangBtn.innerHTML = tr.langToggleHtml;
    this.$hudLangBtn.textContent = tr.langShort;
    document.getElementById('hero-subtitle-text').textContent = tr.heroSub;
    document.getElementById('rules-heading').textContent = tr.rulesHeading;
    document.getElementById('rules-list').innerHTML = tr.rulesItems
      .map((item) => `<li>${item}</li>`)
      .join('');
    document.getElementById('grid-label').textContent = tr.gridLabel;
    this.$continueBtn.textContent = tr.continueBtn;
    this.$startNewBtn.textContent = tr.newGameBtnStart;
    if (this.$instructionText) {
      this.$instructionText.textContent = tr.instruction;
    }
    document.getElementById('undo-label').textContent = tr.undoBtn;
    document.getElementById('new-game-label').textContent = tr.newGameBtn;
    this.$playAgainBtn.textContent = tr.playAgainBtn;
    this.$closeDialogBtn.textContent = tr.closeBtn;

    this.$gridSelector.querySelectorAll('[data-grid]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-grid') === this.gridKey);
    });
    if (this.$mode2pBtn) this.$mode2pBtn.classList.toggle('active', this.mode === '2p-local');
    if (this.$modeBotBtn) this.$modeBotBtn.classList.toggle('active', this.mode === '1p-bot');
  }

  syncSoundButtons() {
    const icon = this.sound.enabled ? '🔊' : '🔇';
    this.$startSoundBtn.textContent = icon;
    this.$hudSoundBtn.textContent = icon;
  }

  startNewGame(gridKey = this.gridKey, resetTimer = true) {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
    this.gridKey = gridKey;
    this.state = createGameState(gridKey);
    if (resetTimer) {
      PuffinLogin.startGameSession('dots-and-lines');
    }
    this.renderer.setState(this.state);
    this.updateHud();
  }

  handleHumanSegment(type, r, c) {
    if (!this.state || this.state.isGameOver) return;
    if (this.mode === '1p-bot' && this.state.currentTurn === 'p2') return;
    this._executeSegmentMove(type, r, c);
  }

  _executeSegmentMove(type, r, c) {
    const res = claimSegment(this.state, type, r, c);
    if (!res.ok) return;

    if (res.capturedBoxes.length > 0) {
      this.sound.playBoxCombo(res.comboCount, res.capturedBoxes.length);
    } else {
      this.sound.playLineClick();
    }

    this.renderer.triggerMoveEffects(res);
    this.updateHud();

    if (res.isGameOver) {
      setTimeout(() => this._onGameOver(), 420);
      return;
    }

    if (this.mode === '1p-bot' && this.state.currentTurn === 'p2') {
      this.botTimer = setTimeout(() => this._runBotTurn(), 380);
    }
  }

  _runBotTurn() {
    if (!this.state || this.state.isGameOver || this.state.currentTurn !== 'p2') return;
    const move = chooseBotMove(this.state);
    if (!move) return;
    this._executeSegmentMove(move.type, move.r, move.c);
  }

  updateHud() {
    if (!this.state) return;
    this.$p1Score.textContent = String(this.state.scores.p1);
    this.$p2Score.textContent = String(this.state.scores.p2);

    this.$p1Card.classList.toggle('is-active-turn', !this.state.isGameOver && this.state.currentTurn === 'p1');
    this.$p2Card.classList.toggle('is-active-turn', !this.state.isGameOver && this.state.currentTurn === 'p2');

    const solfege =
      this.state.currentCombo >= 2 ? this.sound.getSolfegeLabel(this.state.currentCombo) : '';

    if (this.state.currentTurn === 'p1' && this.state.currentCombo >= 2) {
      this.$p1ComboPill.textContent = `🔥 x${this.state.currentCombo} ${solfege}`;
    } else {
      this.$p1ComboPill.textContent =
        this.state.maxCombo.p1 >= 2 ? `Max ${this.state.maxCombo.p1}x` : '';
    }

    if (this.state.currentTurn === 'p2' && this.state.currentCombo >= 2) {
      this.$p2ComboPill.textContent = `🔥 x${this.state.currentCombo} ${solfege}`;
    } else {
      this.$p2ComboPill.textContent =
        this.state.maxCombo.p2 >= 2 ? `Max ${this.state.maxCombo.p2}x` : '';
    }

    if (this.$liveComboBadge) {
      if (this.state.currentCombo >= 2) {
        this.$liveComboBadge.hidden = false;
        this.$liveComboBadge.textContent = `🔥 COMBO x${this.state.currentCombo} — ${solfege}`;
      } else {
        this.$liveComboBadge.hidden = true;
      }
    }

    this.$undoBtn.disabled = this.state.history.length === 0;
  }

  async _onGameOver() {
    const tr = COPY[this.lang] || COPY.it;
    const { p1, p2 } = this.getResolvedPlayers();
    const s1 = this.state.scores.p1;
    const s2 = this.state.scores.p2;
    const isTie = this.state.winner === 'tie';
    const winnerPlayer = this.state.winner === 'p1' ? p1 : p2;

    this.sound.playVictoryFanfare(isTie);

    this.$winnerBanner.hidden = false;
    const winnerAvatarSrc = isTie ? p1.avatar : winnerPlayer.avatar;
    this.$winnerAvatar.hidden = !winnerAvatarSrc; // unlogged => no face
    if (winnerAvatarSrc) this.$winnerAvatar.src = winnerAvatarSrc;
    this.$winnerAvatar.style.borderColor = isTie ? '#facc15' : winnerPlayer.colorHex;
    this.$winnerTitle.textContent = isTie
      ? tr.tieTitle
      : tr.victoryTitle(winnerPlayer.name);

    const bestCombo = Math.max(this.state.maxCombo.p1, this.state.maxCombo.p2);
    this.$winnerSub.textContent = tr.summaryLine(
      p1.name,
      s1,
      s2,
      p2.name,
      this.state.gridKey,
      bestCombo
    );

    const moveStats = getMoveTimeStats(this.state);
    if (this.$winnerTimingStats) {
      const renderPlayerTimingCard = (pl, st) => `
        <div class="winner-timing-card" style="border-color:${pl.colorHex}66;">
          <div class="winner-timing-header" style="color:${pl.colorHex};">
            <span>${pl.emoji || '⚡'} ${pl.name}</span>
            <span style="font-size:0.68rem;color:#94a3b8;">${st.moves} ${tr.movesWord}</span>
          </div>
          <div class="winner-timing-row">
            <span>${tr.avgMoveLabel}</span>
            <strong>${st.avgSec.toFixed(2)}s</strong>
          </div>
          <div class="winner-timing-row">
            <span>${tr.maxMoveLabel}</span>
            <strong>${st.maxSec.toFixed(2)}s</strong>
          </div>
        </div>
      `;
      this.$winnerTimingStats.innerHTML =
        renderPlayerTimingCard(p1, moveStats.p1) +
        renderPlayerTimingCard(p2, moveStats.p2);
    }

    const durationSec = Math.max(
      5,
      Math.round((Date.parse(this.state.endedAt) - Date.parse(this.state.startedAt)) / 1000)
    );

    try {
      const dualRes = await PuffinLogin.submitDualMatchScore({
        appId: 'dots-and-lines',
        p1User: { id: p1.id, guest_name: p1.guest_name, shortName: p1.name },
        p2User: { id: p2.id, guest_name: p2.guest_name, shortName: p2.name },
        p1Boxes: s1,
        p2Boxes: s2,
        totalBoxes: this.state.totalBoxes,
        grid: this.state.gridKey,
        moves: this.state.moveCount,
        maxComboP1: this.state.maxCombo.p1,
        maxComboP2: this.state.maxCombo.p2,
        p1MoveStats: moveStats.p1,
        p2MoveStats: moveStats.p2,
        avgMoveMsP1: moveStats.p1.avgMs,
        maxMoveMsP1: moveStats.p1.maxMs,
        avgMoveMsP2: moveStats.p2.avgMs,
        maxMoveMsP2: moveStats.p2.maxMs,
        durationSec,
        startedAt: this.state.startedAt,
        endedAt: this.state.endedAt,
        mode: this.mode,
      });

      if (dualRes?.h2hStats && this.mode === '2p-local') {
        const h = dualRes.h2hStats;
        const holder = h.longestComboOverall?.holder === p1.id ? p1.name : p2.name;
        this.$winnerH2hLine.textContent = tr.h2hTemplate(
          p1.name,
          h.winsA,
          h.winsB,
          p2.name,
          h.ties,
          h.longestComboOverall?.count || 0,
          holder
        );
      } else {
        this.$winnerH2hLine.textContent = '';
      }
    } catch {}

    this.syncPlayersFromPuffin();

    if (typeof this.$gameoverDialog.showModal === 'function' && !this.$gameoverDialog.open) {
      this.$gameoverDialog.showModal();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dotsApp = new DotsAndLinesApp();
});
