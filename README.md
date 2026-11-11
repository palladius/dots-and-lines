# 🔴🔵 Dots and Lines Deluxe — Dual PuffinLogin Edition

> *"Fallo più bello di quello di Paolo, con Dual-Puffin Login per sfide infuocate tra Ale, Sebi e Papino!"* — Riccardo

**Live su GitHub Pages**: **[https://palladius.github.io/dots-and-lines/](https://palladius.github.io/dots-and-lines/)**

## ✨ Caratteristiche Principali

1. **🐧 Doppio Login Simultaneo (`Dual PuffinLogin v2.1.0`)**:
   - **Player 1 (`player-slot="p1"`, default `ale` 🐉)** e **Player 2 (`player-slot="p2"`, default `seby` 🏎️)** hanno ciascuno il proprio badge `<puffin-login>` indipendente (`localStorage['puffin_auth_slots_v1']`).
   - I colori neon delle linee, il bagliore del turno attivo e il **timbro Avatar Pixar** al centro di ogni quadrato conquistato si adattano dinamicamente ai due profili loggati (*Ale Rosso `#EF4444` vs Seby Blu `#3B82F6`*, *Ale vs Papino Riccardo Giallo `#FACC15`*, *Mamma Kate Viola `#A855F7`*, *Nonna Lucilla Rosa `#EC4899`*, o *Ospite*).
2. **⚡ Gameplay & Neon VFX (Ispirato al gioco di Paolo)**:
   - Supporta **Swipe** tra due puntini adiacenti oppure **Tap** diretto sul segmento.
   - Ultima linea tracciata evidenziata con **nucleo laser bianco incandescente** (*white-hot core*), proprio come nell'app di Paolo.
   - Esplosione di **28 particelle neon** + onda d'urto (*shockwave*) + *squash & stretch* elastico a ogni box chiuso.
   - **5 Griglie**: `3×3`, `4×4`, **`4×5` (Classica di Paolo — 20 box)**, `5×5`, `6×6`, più modalità **👥 2P Dual** e **🤖 vs Bot CPU**.
3. **🎵 Scala Musicale Combo (`Do-Re-Mi-Fa-Sol-La-Si-Do`)**:
   - Ogni box chiuso regala un **turno extra** e suona una nota ascendente della scala maggiore (`C5 -> D5 -> E5 -> F5 -> G5 -> A5 -> B5 -> C6`) sintetizzata via Web Audio API.
4. **📊 Statistiche Testa a Testa (`H2H`) & Cloud Hall of Fame**:
   - Bilancio vittorie H2H e record di *Max Combo* salvati su Cloud Firestore (`ror-goldie` / `puffin-login`) e collegati al **Puffin Login Ring**.

## 🧪 Sviluppo & Test

```bash
just test
just serve 8096
```

Specifica completa in [`SPEC.md`](SPEC.md).
