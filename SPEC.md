---
speck_version: "0.2"
mode: manual
idea_file: input_prompt.md
created_at: "2026-11-08T11:27:00Z"
updated_at: "2026-11-11T14:30:00Z"
title: "Dots & Lines Deluxe (Pipopipette Neon Dual-Puffin)"
tags: [game, html5, canvas, puffin-login, dual-login, mobile, family, 2-player]
author: "Ermete Bottazzi, Antigravity & Riccardo Carlesso"
source_of_inspiration: "Paolo's Dots & Lines mobile game + PuffinLogin v2.1.0 Dual-Slot Spec"
repo: "https://github.com/palladius/dots-and-lines"
play_url: "https://palladius.github.io/dots-and-lines/"
---

# 🔴🔵 Dots & Lines Deluxe (Il Gioco dei Puntini, Linee e Conquiste)

> *"Fallo più bello di quello di Paolo, con Dual-Puffin Login per sfide infuocate tra Ale, Sebi e Papino!"* — Riccardo

## 1. Problem Statement

Il classico gioco di carta e penna dei **puntini e quadratini** (*Dots and Boxes*, storicamente noto in Italia anche come *Pipopipette*) è una pietra miliare della logica combinatoria e un perfetto passatempo a due giocatori faccia a faccia. L'implementazione mobile creata dall'amico **Paolo** ha una grafica dark minimalista elegante (neon ciano e magenta su nero profondo, vedi screenshot in `assets/`), ma manca di:
1. **Identità e continuità familiare**: Nessuna integrazione con i profili dei bambini (Ale, Sebi, Papino, Mamma Kate, Nonna Lucilla).
2. **Dual Login Simultaneo (Player 1 vs Player 2)**: Giocando sullo stesso tablet o smartphone condiviso (tavolo, divano, treno), i due giocatori non possono loggarsi insieme per registrare scontri diretti personalizzati (es. *Ale 🐉 [Rosso] vs Sebi 🏎️ [Blu]*, oppure *Ale vs Papino 👑 [Giallo]*).
3. **Juiciness e Game Feel Premium**: Effetti particellari all'esplosione dei box chiusi, sound design dinamico con feedback vocale (stile Mario Kart / arcade party), animazioni al completamento delle catene ("combo streak") e trofei salvati nel cloud di famiglia.

---

## 2. Obiettivi & Core Features (Più bello di quello di Paolo!)

* **🕹️ Gameplay Classico Impeccabile**:
  - Griglia regolabile di punti:
    - **Small (`3x3` box / `4x4` punti = 9 box)**
    - **Classic Square (`4x4` box / `5x5` punti = 16 box)**
    - **Paolo Classic (`4x5` box / `5x6` punti = 20 box — Default)**
    - **Large (`5x5` box / `6x6` punti = 25 box)**
    - **Epic (`6x6` box / `7x7` punti = 36 box)**
  - Regola aurea: Chi traccia il quarto lato e chiude un quadrato (o due quadrati contemporaneamente!) guadagna **1 punto per quadrato** e **gioca immediatamente un turno extra**.
  - Riconoscimento **swipe** intuitivo tra due nodi adiacenti oppure **tap** secco sullo spazio tra due punti, con anteprima laser prima del rilascio e nucleo bianco brillante sull'ultima linea tracciata.
  - Modalità **2 Giocatori Locali (Dual Puffin)** e **1 Giocatore vs CPU Bot (Smart AI)**.
* **🐧 Dual PuffinLogin Integrato (`v2.1.0` — Must-Have)**:
  - **Player 1 (Sinistra, `player-slot="p1"`)** e **Player 2 (Destra, `player-slot="p2"`)** hanno ciascuno il proprio badge `<puffin-login>` indipendente (`pvt-puffin-login` v2.1.0).
  - Supporto per tutti i profili canonici Carlesso:
    * `ale` 🐉 (Rosso `#EF4444`, PIN candy `2018`)
    * `seby` 🏎️ (Blu `#3B82F6`, PIN candy `2020`)
    * `riccardo` 👑 (Giallo `#FACC15`, Password)
    * `kate` 💜 (Viola `#A855F7`, Password)
    * `lucilla` 🌸 (Rosa `#EC4899`, Password)
    * `guest` 🐧 (Ospite rapido con nickname custom per slot, es. `Guest (Paolo)` vs `Guest (Marco)`)
  - La palette dei segmenti, delle luci neon e delle caselle conquistate **eredita dinamicamente il colore e l'avatar Pixar del profilo loggato**! (Se Ale gioca contro Sebi, il gioco è letteralmente Rosso `#EF4444` vs Blu `#3B82F6` con avatar 3D che firmano ogni box conquistato).
* **✨ Effetti Visivi "Juicy" (Next-Gen Neon Dark Mode)**:
  - Nodi luminosi a impulso reattivo (*breathing dots*).
  - Tracciamento linee con scia laser / neon glow ad alta definizione e *white-hot core* sull'ultimo segmento giocato.
  - Quando un giocatore chiude un box: **flash di luce**, onda d'urto particellare (*particle burst*), timbro dell'avatar/stemma del giocatore al centro del box e animazione rimbalzo elastico (*squash & stretch*).
  - Se si innesca una catena di scatole consecutive: combo meter moltiplicatore con suoni in scala musicale ascendente (`Do-Re-Mi-Fa-Sol-La-Si-Do`!).
* **🔊 Audio & Sound FX Arcade**:
  - Click laser sintetizzato Web Audio al tracciamento linea.
  - Suono "Pop" cristallino + scala armonica ascendente alla conquista di box in catena.
  - Fanfara da stadio a fine partita con podio animato e sintesi vocale entusiasta opzionale (IT/EN).
* **📊 Cloud High Scores & Statistiche Testa a Testa (`H2H`)**:
  - Salva i risultati nel backend Firestore di `pvt-puffin-login` (GCP `ror-goldie`):
    - Bilancio vittorie H2H calcolato tramite `PuffinLogin.getHeadToHeadStats(p1, p2)` (`h2h_key: "ale__vs__seby"` o `"ale__vs__riccardo"`).
    - Record di catena più lunga chiusa in un singolo turno (*Longest Combo Streak* / `max_combo`).

---

## 3. Architettura del Doppio Login (`Dual PuffinLogin v2.1.0`)

### 3.1. Isolamento delle Sessioni per Slot (`puffin_auth_slots_v1`)
Nelle normali app single-player, `<puffin-login>` legge e scrive un'unica chiave `localStorage['puffin_auth_v2']`. In un gioco a 2 giocatori sullo stesso dispositivo, il login del Giocatore 2 sovrascriverebbe quello del Giocatore 1.

Con **PuffinLogin v2.1.0**, ogni istanza `<puffin-login>` accetta gli attributi:
- `player-slot="p1"` | `player-slot="p2"` (normalizzati tramite `normalizePlayerSlot()`)
- `default-user="ale"` | `default-user="seby"` (pre-seleziona l'eroe all'apertura del modal quando lo slot non è ancora autenticato)
- `compact` e `hide-quick-buttons` (versione compatta pensata per essere incastonata direttamente dentro le card punteggio Player 1 e Player 2)

```html
<div class="player-card" id="card-p1">
  <puffin-login
    id="puffin-p1"
    app-id="dots-and-lines"
    player-slot="p1"
    default-user="ale"
    compact
    hide-quick-buttons
  ></puffin-login>
</div>

<div class="player-card" id="card-p2">
  <puffin-login
    id="puffin-p2"
    app-id="dots-and-lines"
    player-slot="p2"
    default-user="seby"
    compact
    hide-quick-buttons
  ></puffin-login>
</div>
```

### 3.2. Storage & Sincronizzazione Cross-Game
1. **`localStorage['puffin_auth_slots_v1']`**: Mappa JSON `{ "p1": SessionPayload, "p2": SessionPayload }`.
   - Lo slot `p1` si sincronizza bidirezionalmente con `localStorage['puffin_auth_v2']` (così chi è già loggato su `palladius.github.io` si ritrova automaticamente come Player 1).
   - Lo slot `p2` è completamente isolato in `puffin_auth_slots_v1.p2` e non viene mai sovrascritto da `p1`.
2. **`localStorage['puffin_guest_name_slots_v1']`**: Permette a due ospiti sullo stesso telefono di avere soprannomi distinti (`Guest (Paolo)` su `p1` vs `Guest (Marco)` su `p2`).
3. **Indicatore di Occupazione Slot nel Modal**: Quando si apre il modal di `p2`, la card del profilo già attivo su `p1` mostra il badge `P1` (`.slot-occupant-pill`) per chiarezza visiva.

### 3.3. Schema Cloud Firestore per Scontri Diretti (`scores` & `h2h_key`)
Al termine della partita, `PuffinLogin.submitDualMatchScore(...)` registra il match con chiave canonica ordinata `h2h_key` (es. `"ale__vs__seby"` o `"ale__vs__riccardo"`):

```json
{
  "id": "scr_1762870000000_ale",
  "game_id": "dots-and-lines",
  "player_id": "ale",
  "player_slot": "p1",
  "opponent_id": "seby",
  "opponent_score": 7,
  "boxes_claimed": 13,
  "max_combo": 6,
  "outcome": "win",
  "h2h_key": "ale__vs__seby",
  "score": 1450,
  "duration_sec": 125,
  "extra": {
    "mode": "2p-local",
    "grid": "4x5",
    "boxes": 13,
    "opponent_boxes": 7,
    "total_boxes": 20,
    "moves": 49,
    "max_combo": 6,
    "opponent_id": "seby",
    "outcome": "win",
    "h2h_key": "ale__vs__seby",
    "player_slot": "p1"
  }
}
```

---

## 4. Mockup & Riferimenti Grafici (L'App di Paolo)

Gli screenshot originali dell'ispirazione sono archiviati in `assets/`:

1. `assets/01-start-rules.jpg` & `assets/05-gameplay-box-closed-tie.jpg`: Schermata iniziale con regole, selettore `EN · it`, toggle audio, logo neon 2x2 e pulsanti `CONTINUE` / `NEW GAME`.
2. `assets/02-gameplay-p1-moves.jpg`: Visualizzazione turni, card `PLAYER 1` e `PLAYER 2` affiancate con bordo neon attivo, tracciamento segmento con nucleo bianco luminoso.
3. `assets/03-gameplay-p2-line.jpg`: Tracciamento verticale e glow neon Player 2.
4. `assets/04-gameplay-p1-turn.jpg`: Punteggio intermedio, box conquistati arrotondati con riempimento neon semitrasparente e barra inferiore `↩ Undo` / `↻ New game`.

---

## 5. Architettura Tecnica

* **Tech Stack**: HTML5 Canvas 2D High-DPI + ES Modules (`src/core/DotsEngine.js`, `src/audio/SoundEngine.js`, `src/ui/NeonBoardRenderer.js`, `src/main.js`) + Web Component `src/puffin-login.js` (`v2.1.0`).
* **Hosting Target**: `https://palladius.github.io/dots-and-lines/` (sotto lo stesso origin `palladius.github.io` delle altre app del **Puffin Login Ring**).
* **Game Engine State (`DotsEngine`)**:
  - Matrice dei segmenti orizzontali `H[boxRows + 1][boxCols]` e verticali `V[boxRows][boxCols + 1]`.
  - Matrice dei quadrati `boxes[boxRows][boxCols]` contenente `{ owner: 'p1' | 'p2' | null, moveIndex }`.
  - Stack immutabile di `history` per `undo()` completo (incluso il ripristino di combo e turni extra).
  - Intelligenza artificiale CPU (`chooseBotMove`) che:
    1. Chiude immediatamente qualsiasi catena di box con 3 lati già disegnati.
    2. Preferisce mosse sicure (che non lasciano il 3° lato di un box all'avversario).
    3. Quando costretta a cedere una catena, sceglie la mossa che sacrifica il minor numero di box.
