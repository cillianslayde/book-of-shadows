/* ═══════════════════════════════════════════
   BOOK OF SHADOWS — wiccan-main.js
   ~/>  0x75  ·  v1q
═══════════════════════════════════════════ */

/* ══════════════════════════════
   STORAGE
   All entries auto-saved to localStorage under bos_entries.
   Auto-initialised on load — zero user action required.
   Base64 images stored inline on each entry as entry.images[].
   Large images compressed to max 800px / JPEG 0.75 before storage.
══════════════════════════════ */
const LS_KEY = 'bos_entries';

function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const p   = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function lsSave(entries) {
  const ordered = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ordered));
  } catch (err) {
    console.error('localStorage write failed:', err);
    alert('Storage quota exceeded — consider removing images or older entries.');
  }
}

/* ══════════════════════════════
   STATE
   Display state tracked via DOM only — state.tarotView removed.
   imageDataUrls: accumulates compressed data URIs for the current entry.
   _activePickForm: tracks which form the file picker was triggered from.
   editingId: null when composing new; set to entry.id when editing existing.
══════════════════════════════ */
const state = {
  entries:        lsLoad(),
  activeType:     'journal',
  selectedMood:   '✨ inspired',
  spellCategory:  'protection',
  spellMoon:      'any',
  ritualOccasion: 'esbat',
  redeType:       'rede',
  readerSort:     'desc',
  recentFilter:   'all',
  grimoireQuery:  '',
  calYear:        new Date().getFullYear(),
  calMonth:       new Date().getMonth(),
  calSelected:    null,
  pendingDelete:  null,
  readerScrollTo: null,
  spreadKey:      'celtic',
  drawnCards:     [],
  imageDataUrls:  [],
  editingId:      null      // id of the entry being edited, or null for new entries
};

/* Tracks which form triggered the hidden file picker */
let _activePickForm = 'journal';

/* ══════════════════════════════
   SABBATS
══════════════════════════════ */
const SABBATS = [
  { name: 'Yule',        emoji: '❄️',  month: 11, day: 21 },
  { name: 'Imbolc',      emoji: '🕯',  month:  1, day:  1 },
  { name: 'Ostara',      emoji: '🌸',  month:  2, day: 20 },
  { name: 'Beltane',     emoji: '🔥',  month:  4, day:  1 },
  { name: 'Litha',       emoji: '☀️',  month:  5, day: 21 },
  { name: 'Lughnasadh',  emoji: '🌾',  month:  7, day:  1 },
  { name: 'Mabon',       emoji: '🍂',  month:  8, day: 22 },
  { name: 'Samhain',     emoji: '💀',  month:  9, day: 31 }
];

/* ══════════════════════════════
   TAROT DECK — Full 78 Cards
   Each card: name, technical (esoteric/wiccan), layman
══════════════════════════════ */
const DECK = [
  // ── MAJOR ARCANA ──────────────────────────────────────────────────────────
  { name:'0. The Fool',           technical:'Pure potentiality. The Spirit of Ether. The first step into the Great Rite.',      layman:'Optimism, fresh starts, and acting on instinct.' },
  { name:'1. The Magician',       technical:'Master of the Four Tools. Elemental alignment. As Above, So Below.',               layman:'Taking action and focusing your willpower.' },
  { name:'2. The High Priestess', technical:'Daughter of the Stars. Keeper of the Grimoire. Lunar gnosis.',                    layman:'Secrets, intuition, and listening to your inner voice.' },
  { name:'3. The Empress',        technical:'The Mother of Earth. Seasonal fertility. The Triple Goddess in bloom.',            layman:'Nurturing, abundance, and creative expression.' },
  { name:'4. The Emperor',        technical:'The Green Man as King. Sovereign structure. The Law of the Land.',                 layman:'Stability, authority, and protective leadership.' },
  { name:'5. The High Priest',    technical:'Keeper of Tradition. Coven structure. Sacred lineage and lore.',                   layman:'Mentorship, spiritual wisdom, and traditional values.' },
  { name:'6. The Lovers',         technical:'The Great Rite. Polarised attraction. Alignment of the God and Goddess.',          layman:'Relationships, harmony, and significant choices.' },
  { name:'7. The Chariot',        technical:'Astral Motion. Direction of the Will. The journey between worlds.',                layman:'Success through discipline and keeping momentum.' },
  { name:'8. Strength',           technical:'The Tamed Beast. Mastery of the lower self. Inner solar fire.',                   layman:'Gentle power, endurance, and quiet confidence.' },
  { name:'9. The Hermit',         technical:'The Old One. The Lantern of the Wise. Searching the inner woods.',                layman:'Reflection, seeking the truth, and taking a timeout.' },
  { name:'10. Wheel of the Year', technical:'Sabbats and Solstices. The cycle of the seasons. Karmic rotation.',              layman:'Changes in fortune, cycles, and destiny.' },
  { name:'11. Justice',           technical:'The Blade of Truth. Triple Return. Cosmic equilibrium.',                          layman:'Consequences, fairness, and clarifying the truth.' },
  { name:'12. The Hanged Man',    technical:'Sacred Suspension. Perspective shift. Initiation through sacrifice.',             layman:'Letting go, seeing things differently, and waiting.' },
  { name:'13. Death',             technical:'Transformation. The Samhain transition. Compost for new growth.',                 layman:'Clearance, transition, and major change.' },
  { name:'14. Temperance',        technical:'The Alchemist. Blending the Waters. The Art of Balance.',                         layman:'Patience, moderation, and finding middle ground.' },
  { name:'15. The Shadow Side',   technical:'The Horned God of the Underworld. Bondage to fear. Ego-traps.',                   layman:'Temptation, shadow-work, and feeling trapped.' },
  { name:'16. The Tower',         technical:'The Lightning Bolt. Collapse of the Ego. Sudden clearing of paths.',              layman:'Unexpected shock, revelation, and chaos.' },
  { name:'17. The Star',          technical:'Celestial Hope. Guidance from the Sidhe. Spiritual refreshment.',                 layman:'Healing, inspiration, and renewed hope.' },
  { name:'18. The Moon',          technical:'The Path of Hecate. Psychic shadows. Navigating the darkness.',                   layman:'Confusion, vivid dreams, and hidden anxieties.' },
  { name:'19. The Sun',           technical:'Solar Clarity. Litha energy. The joy of the manifest world.',                     layman:'Vitality, success, and positive energy.' },
  { name:'20. Karma',             technical:'The Call to Rise. Evaluation of the Soul. Reaping what was sown.',                layman:'Awakening, self-evaluation, and new purpose.' },
  { name:'21. The World',         technical:'The Cosmic Dance. The Circle is Unbroken. Total integration.',                    layman:'Completion, wholeness, and achieving your goals.' },
  // ── WANDS (Fire) ──────────────────────────────────────────────────────────
  { name:'Ace of Wands',        technical:'Seed of elemental Fire. Creative force igniting. Primal will awakening.',           layman:'A new creative venture, inspiration, or opportunity.' },
  { name:'Two of Wands',        technical:'Will projected into the future. The witch surveys her domain.',                     layman:'Planning ahead and taking ownership of your vision.' },
  { name:'Three of Wands',      technical:'Expansion beyond the first circle. Ships crossing the astral sea.',                 layman:'Growth, foresight, and early success.' },
  { name:'Four of Wands',       technical:'The ritual circle complete. Sabbat celebration. Hearth and harvest.',               layman:'Celebration, stability, and community joy.' },
  { name:'Five of Wands',       technical:'Fire meeting fire. Sparring of wills. Creative conflict.',                          layman:'Competition, disagreements, and scattered energy.' },
  { name:'Six of Wands',        technical:'Victory after working. The coven acclaims the High Priestess.',                    layman:'Public recognition, triumph, and confidence.' },
  { name:'Seven of Wands',      technical:"Holding the hilltop. Defending one's sacred ground.",                              layman:'Standing your ground against opposition.' },
  { name:'Eight of Wands',      technical:'Wands in flight — swift magical dispatch. Messages on the wind.',                  layman:'Rapid movement, news arriving, things speeding up.' },
  { name:'Nine of Wands',       technical:'The battered guardian. Resilience through trials. Still standing.',                layman:'Persistence, near the finish line, cautious endurance.' },
  { name:'Ten of Wands',        technical:'The burden of manifested fire. Over-extension of the will.',                       layman:'Too much responsibility, feeling overburdened.' },
  { name:'Page of Wands',       technical:'The neophyte flame-keeper. Eager apprentice of fire mysteries.',                   layman:'Enthusiasm, a new creative message or person.' },
  { name:'Knight of Wands',     technical:'The charging fire-rider. Passionate crusade. Restless energy.',                    layman:'Action, adventure, and moving fast without thinking.' },
  { name:'Queen of Wands',      technical:'The solar queen. Commanding presence. Magnetic creative authority.',               layman:'Confidence, warmth, determination, and natural leadership.' },
  { name:'King of Wands',       technical:'The elder fire-master. Visionary chieftain. Directed creative power.',             layman:'Bold leadership, entrepreneurial spirit, big vision.' },
  // ── CUPS (Water) ──────────────────────────────────────────────────────────
  { name:'Ace of Cups',         technical:'Seed of elemental Water. The Cauldron overflows. Divine love poured.',             layman:'New love, emotional awakening, or spiritual gifts.' },
  { name:'Two of Cups',         technical:'The sacred union. Two streams joining. Mirrored souls recognise.',                 layman:'Partnership, mutual attraction, and heartfelt connection.' },
  { name:'Three of Cups',       technical:'The triple goddess rejoices. Coven of hearts. Communal celebration.',              layman:'Friendship, celebration, and creative collaboration.' },
  { name:'Four of Cups',        technical:'Withdrawal into the inner cauldron. Apathy of the blessed.',                      layman:'Boredom, introspection, missing opportunities.' },
  { name:'Five of Cups',        technical:'Grief at spilled libations. The two cups behind — still full.',                   layman:'Loss and regret, but hope remains.' },
  { name:'Six of Cups',         technical:'Sweet nostalgia. The ancestors visit. Past joy rekindled.',                        layman:'Memories, innocence, and reconnecting with the past.' },
  { name:'Seven of Cups',       technical:'The veil of illusion. The astral plane shows many doors.',                        layman:'Choices, fantasies, and wishful thinking.' },
  { name:'Eight of Cups',       technical:'The moon-lit departure. Leaving full cups for deeper calling.',                    layman:'Walking away, seeking something more meaningful.' },
  { name:'Nine of Cups',        technical:'The wish cup. Emotional fulfilment. The Goddess smiles.',                         layman:'Contentment, wishes granted, satisfaction.' },
  { name:'Ten of Cups',         technical:'The rainbow covenant. Full emotional harvest. The blessed home.',                  layman:'Joy, family harmony, and lasting happiness.' },
  { name:'Page of Cups',        technical:'The sensitive dreamer. Psychic child of the water mysteries.',                    layman:'Creative messages, intuitive impressions, gentle news.' },
  { name:'Knight of Cups',      technical:'The romantic quester. Grail-seeker riding the astral tides.',                    layman:'Following your heart, romantic pursuit, idealism.' },
  { name:'Queen of Cups',       technical:'The empathic high priestess. Seer of the emotional depths.',                     layman:'Compassion, intuition, emotional wisdom.' },
  { name:'King of Cups',        technical:'The lord of tides. Emotional mastery with quiet depth.',                         layman:'Emotional balance, calm authority, and diplomacy.' },
  // ── SWORDS (Air) ──────────────────────────────────────────────────────────
  { name:'Ace of Swords',       technical:'Seed of elemental Air. The Athame cuts through illusion. Pure truth.',            layman:'Mental clarity, breakthrough, a cutting truth.' },
  { name:'Two of Swords',       technical:'Crossed blades of the stalemate. Blindfolded between choices.',                   layman:'Indecision, avoiding truth, blocked emotions.' },
  { name:'Three of Swords',     technical:'The heart pierced by the triple blade. Grief as initiation.',                    layman:'Heartbreak, sorrow, and painful truth.' },
  { name:'Four of Swords',      technical:'The sleeping knight. Sacred truce. Rest before the next working.',               layman:'Rest, recovery, and mental recuperation.' },
  { name:'Five of Swords',      technical:'Hollow victory. The battle won with honour lost.',                               layman:'Conflict, defeat, or winning at too high a cost.' },
  { name:'Six of Swords',       technical:'Crossing the dark water. Moving from turbulence to calmer shores.',              layman:'Transition, moving on, leaving trouble behind.' },
  { name:'Seven of Swords',     technical:"The stealth of the trickster god. Taking only what's needed.",                  layman:'Strategy, deception, or acting alone.' },
  { name:'Eight of Swords',     technical:'The self-bound witch. Restriction is largely mental.',                           layman:'Feeling trapped, self-imposed limitations.' },
  { name:'Nine of Swords',      technical:'The nightmare hour. Dark night of the soul. Anxiety before dawn.',               layman:'Worry, fear, and anxiety — often worse in the mind.' },
  { name:'Ten of Swords',       technical:'The final blow. Rock bottom as a turning point. Dawn follows.',                  layman:'An ending, crisis point, but also the start of recovery.' },
  { name:'Page of Swords',      technical:'The watchful air apprentice. Quick mind, sharp tongue.',                         layman:'Curiosity, new ideas, and vigilant observation.' },
  { name:'Knight of Swords',    technical:'The storm rider. Rushing into battle without pause.',                            layman:'Ambition, speed, and acting before thinking.' },
  { name:'Queen of Swords',     technical:'The clear-eyed crone. Cutting through pretence with precision.',                 layman:'Sharp intellect, independence, clear boundaries.' },
  { name:'King of Swords',      technical:'The high judge. Intellectual authority. Law of the mind.',                       layman:'Truth, authority, clear thinking, and fair judgment.' },
  // ── PENTACLES (Earth) ─────────────────────────────────────────────────────
  { name:'Ace of Pentacles',    technical:'Seed of elemental Earth. The coin of the Green Man. Material blessing.',         layman:'A new financial opportunity or material beginning.' },
  { name:'Two of Pentacles',    technical:'The juggler of tides. Dancing between two harvests.',                            layman:'Balance, multitasking, and financial flexibility.' },
  { name:'Three of Pentacles',  technical:'The sacred craftspeople. Mastery honoured within the coven.',                   layman:'Teamwork, skill being recognised, quality work.' },
  { name:'Four of Pentacles',   technical:'Clutching the earth coins. Fear of the fallow.',                                layman:'Holding too tightly to money or control.' },
  { name:'Five of Pentacles',   technical:'The winter wanderers. Abundance exists — the door is open.',                    layman:'Financial hardship, insecurity, or feeling left out.' },
  { name:'Six of Pentacles',    technical:'The harvest sharing. The wheel turns — giver and receiver.',                    layman:'Generosity, charity, and balanced giving.' },
  { name:'Seven of Pentacles',  technical:'The patient gardener. Long-term tending of the magical garden.',                layman:'Patience, long-term investment, reviewing progress.' },
  { name:'Eight of Pentacles',  technical:"The dedicated craftworker. Honing skill with earth's slow wisdom.",             layman:'Diligence, skill-building, and craftsmanship.' },
  { name:'Nine of Pentacles',   technical:'The abundant solitary. Self-sufficiency in the sacred garden.',                 layman:'Independence, luxury, and enjoying your achievements.' },
  { name:'Ten of Pentacles',    technical:'The ancestral legacy. Wealth woven through generations.',                       layman:'Lasting wealth, family stability, and inheritance.' },
  { name:'Page of Pentacles',   technical:'The earth apprentice. Diligent student of the material mysteries.',             layman:'Study, practicality, and ambition for tangible goals.' },
  { name:'Knight of Pentacles', technical:'The slow and steady earth rider. Methodical keeper of the land.',               layman:'Reliability, hard work, and slow but steady progress.' },
  { name:'Queen of Pentacles',  technical:'The hearth mother. Practical earth goddess. Abundant nurturer.',                layman:'Practicality, nurturing abundance, and down-to-earth wisdom.' },
  { name:'King of Pentacles',   technical:'The master of earth. Abundant king of the manifest realm.',                    layman:'Financial mastery, stability, and secure leadership.' }
];

/* ══════════════════════════════
   TAROT SPREADS
══════════════════════════════ */
const SPREADS = {
  single: { title:'Single Card',          count:1,  positions:['The Message'],
    pos:[{x:50,y:50}] },
  two:    { title:'The Dual Path',         count:2,  positions:['Left Path','Right Path'],
    pos:[{x:38,y:50},{x:62,y:50}] },
  three:  { title:'Maiden, Mother, Crone', count:3,  positions:['Past (Maiden)','Present (Mother)','Future (Crone)'],
    pos:[{x:25,y:50},{x:50,y:50},{x:75,y:50}] },
  four:   { title:'The Four Quarters',     count:4,  positions:['East (Air)','South (Fire)','West (Water)','North (Earth)'],
    pos:[{x:50,y:22},{x:78,y:50},{x:22,y:50},{x:50,y:78}] },
  five:   { title:'The Pentagram',         count:5,  positions:['Spirit','Air','Fire','Water','Earth'],
    pos:[{x:50,y:18},{x:80,y:42},{x:68,y:80},{x:32,y:80},{x:20,y:42}] },
  seven:  { title:'Planetary Septenary',   count:7,  positions:['Moon','Mercury','Venus','Sun','Mars','Jupiter','Saturn'],
    pos:[{x:18,y:62},{x:30,y:36},{x:45,y:24},{x:60,y:24},{x:75,y:36},{x:85,y:62},{x:50,y:75}] },
  nine:   { title:"Moon's Phases",         count:9,  positions:['Dark Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent','New Moon'],
    pos:[{x:22,y:25},{x:50,y:22},{x:78,y:25},{x:20,y:50},{x:50,y:50},{x:80,y:50},{x:22,y:75},{x:50,y:78},{x:78,y:75}] },
  celtic: { title:"Witches' Cross",        count:10, positions:['The Situation','The Challenge','Highest Potential','Foundation','Recent Past','Near Future','Inner Power','External Forces','Hopes & Fears','Final Outcome'],
    pos:[{x:38,y:47},{x:38,y:47},{x:38,y:22},{x:38,y:72},{x:20,y:47},{x:56,y:47},{x:82,y:78},{x:82,y:57},{x:82,y:36},{x:82,y:15}] }
};

/* ══════════════════════════════
   TYPE EMOJI MAP
   Single source of truth — referenced by renderRecentPanel,
   renderSuggestions, selectCalDate, and buildReaderEntry.
══════════════════════════════ */
const TYPE_EMOJI = { journal:'📓', spell:'🔮', ritual:'🕯', rede:'📜', tarot:'🃏' };

/* ══════════════════════════════
   MOON PHASE
══════════════════════════════ */
function getMoonPhase(date) {
  const known = new Date('2000-01-06');
  const cycle = (((date - known) / 86400000) % 29.53 + 29.53) % 29.53;
  if (cycle < 1.85)  return '🌑';
  if (cycle < 7.38)  return '🌒';
  if (cycle < 9.22)  return '🌓';
  if (cycle < 14.77) return '🌔';
  if (cycle < 16.61) return '🌕';
  if (cycle < 22.15) return '🌖';
  if (cycle < 23.99) return '🌗';
  return '🌘';
}

/* ══════════════════════════════
   DOM REFERENCES
══════════════════════════════ */
const btnReader        = document.getElementById('btn-reader');
const btnCalendar      = document.getElementById('btn-calendar');
const storageStatus    = document.getElementById('storage-status');
const clockTime        = document.getElementById('clock-time');
const clockDate        = document.getElementById('clock-date');
const stampDay         = document.getElementById('stamp-day');
const stampDate        = document.getElementById('stamp-date');
const stampTime        = document.getElementById('stamp-time');
const moodGrid         = document.getElementById('mood-grid');
const emojiStrip       = document.getElementById('emoji-strip');
const btnSave          = document.getElementById('btn-save');
const btnClear         = document.getElementById('btn-clear');
const saveStatus       = document.getElementById('save-status');
const recentList       = document.getElementById('recent-list');
const recentCount      = document.getElementById('recent-count');
const footerCount      = document.getElementById('footer-count');
const recentFilters    = document.getElementById('recent-filters');
const grimoireSearch   = document.getElementById('grimoire-search');
const grimoireSearchClear = document.getElementById('grimoire-search-clear');
const grimoireSuggest  = document.getElementById('grimoire-suggest');
const spreadSelector   = document.getElementById('spread-selector');
const btnInvoke        = document.getElementById('btn-invoke');
const tarotLayout      = document.getElementById('tarot-layout');
const tarotViewBar     = document.getElementById('tarot-view-bar');
const tarotNarrative   = document.getElementById('tarot-narrative');
const tarotCardsGrid   = document.getElementById('tarot-cards-grid');
const tarotNotesRow    = document.getElementById('tarot-notes-row');
const tarotTagsRow     = document.getElementById('tarot-tags-row');
const spreadNameLabel  = document.getElementById('spread-name-label');
const spreadCountLabel = document.getElementById('spread-count-label');
const overlayReader    = document.getElementById('overlay-reader');
const readerBody       = document.getElementById('reader-body');
const readerSearch     = document.getElementById('reader-search');
const readerFilterType = document.getElementById('reader-filter-type');
const readerFilterCat  = document.getElementById('reader-filter-cat');
const readerSort       = document.getElementById('reader-sort');
const readerSubtitle   = document.getElementById('reader-subtitle');
const readerClose      = document.getElementById('reader-close');
const overlayCalendar  = document.getElementById('overlay-calendar');
const calMonthLabel    = document.getElementById('cal-month-label');
const calGrid          = document.getElementById('cal-grid');
const calPrev          = document.getElementById('cal-prev');
const calNext          = document.getElementById('cal-next');
const calClose         = document.getElementById('calendar-close');
const wheelStrip       = document.getElementById('wheel-strip');
const upcomingSabbats  = document.getElementById('upcoming-sabbats');
const calEntriesLabel  = document.getElementById('cal-entries-label');
const calEntriesList   = document.getElementById('cal-entries-list');
const overlayDelete    = document.getElementById('overlay-delete');
const deleteConfirm    = document.getElementById('delete-confirm');
const deleteCancel     = document.getElementById('delete-cancel');
const imgFileInput     = document.getElementById('img-file-input');

/* ══════════════════════════════
   LIVE CLOCK
══════════════════════════════ */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let _lastStampMinute = -1;

function tickClock() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  const ss  = String(now.getSeconds()).padStart(2,'0');
  clockTime.textContent = `${hh}:${mm}:${ss}`;
  clockDate.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur !== _lastStampMinute) {
    _lastStampMinute = cur;
    stampDay.textContent  = DAYS[now.getDay()];
    stampDate.textContent = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    stampTime.textContent = `${hh}:${mm}`;
  }
}
setInterval(tickClock, 1000);
tickClock();

/* ══════════════════════════════
   STORAGE STATUS
══════════════════════════════ */
function updateStorageStatus() {
  const n  = state.entries.length;
  const kb = (new Blob([localStorage.getItem(LS_KEY)||'']).size / 1024).toFixed(1);
  storageStatus.textContent = `${n} entr${n !== 1 ? 'ies' : 'y'} · ${kb} KB`;
  storageStatus.classList.add('loaded');
}

/* ══════════════════════════════
   COMPOSER TYPE SWITCHING
══════════════════════════════ */
function switchType(type) {
  state.activeType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  document.querySelectorAll('.entry-form').forEach(f => f.classList.add('hidden'));
  document.getElementById(`form-${type}`).classList.remove('hidden');
  checkSaveEnabled();
}

/* ══════════════════════════════
   PILL GRID HELPERS
══════════════════════════════ */
function activatePill(gridId, stateKey, val) {
  document.querySelectorAll(`#${gridId} .pill-btn, #${gridId} .mood-btn`).forEach(b => {
    b.classList.toggle('active', b.dataset.val === val || b.dataset.mood === val);
  });
  state[stateKey] = val;
}

/* ══════════════════════════════
   IMAGE UPLOAD
   compressImage: reads File → canvas → dataURI (max 800px, JPEG 0.75)
   addImageUrl:   validates and adds a URL string directly (no compression)
   renderImagePreview: re-renders the thumbnail strip for the active form
══════════════════════════════ */
const IMG_MAX_PX  = 800;
const IMG_QUALITY = 0.75;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.onload  = evt => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.onload  = () => {
        let { width, height } = img;
        if (width > IMG_MAX_PX || height > IMG_MAX_PX) {
          if (width >= height) { height = Math.round((height / width) * IMG_MAX_PX); width = IMG_MAX_PX; }
          else                 { width  = Math.round((width / height) * IMG_MAX_PX); height = IMG_MAX_PX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function addImageUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return;
  if (!/^(https?:|data:)/.test(trimmed)) {
    alert('Please enter a valid image URL starting with http:// or https://');
    return;
  }
  state.imageDataUrls.push(trimmed);
  renderImagePreview();
}

function renderImagePreview() {
  const strip = document.getElementById(`img-preview-strip-${state.activeType}`);
  if (!strip) return;
  strip.innerHTML = '';
  state.imageDataUrls.forEach((src, i) => {
    const wrap      = document.createElement('div');
    wrap.className  = 'img-thumb-wrap';
    const img       = document.createElement('img');
    img.className   = 'img-thumb';
    img.src         = src;
    img.alt         = `Attached image ${i + 1}`;
    img.loading     = 'lazy';
    const removeBtn = document.createElement('button');
    removeBtn.className   = 'img-thumb-remove';
    removeBtn.type        = 'button';
    removeBtn.textContent = '×';
    removeBtn.title       = 'Remove image';
    removeBtn.addEventListener('click', () => { state.imageDataUrls.splice(i, 1); renderImagePreview(); });
    wrap.appendChild(img);
    wrap.appendChild(removeBtn);
    strip.appendChild(wrap);
  });
}

/* ══════════════════════════════
   TAROT SPREAD SELECTOR
══════════════════════════════ */
function buildSpreadSelector() {
  spreadSelector.innerHTML = '';
  Object.entries(SPREADS).forEach(([key, sp]) => {
    const btn = document.createElement('button');
    btn.className = `spread-btn${key === state.spreadKey ? ' active' : ''}`;
    btn.textContent = `${sp.title} (${sp.count})`;
    btn.addEventListener('click', () => {
      state.spreadKey = key;
      document.querySelectorAll('.spread-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      spreadNameLabel.textContent  = sp.title;
      spreadCountLabel.textContent = `${sp.count} card${sp.count !== 1 ? 's' : ''}`;
      resetTarotDraw();
    });
    spreadSelector.appendChild(btn);
  });
  const sp = SPREADS[state.spreadKey];
  spreadNameLabel.textContent  = sp.title;
  spreadCountLabel.textContent = `${sp.count} card${sp.count !== 1 ? 's' : ''}`;
}

function resetTarotDraw() {
  state.drawnCards = [];
  tarotLayout.innerHTML = '<div class="tarot-layout-empty">Select a spread and cast the circle to draw cards.</div>';
  tarotLayout.style.height = '';
  tarotViewBar.style.display   = 'none';
  tarotNarrative.style.display = 'none';
  tarotCardsGrid.style.display = 'none';
  tarotNotesRow.style.display  = 'none';
  tarotTagsRow.style.display   = 'none';
  checkSaveEnabled();
}

/* ══════════════════════════════
   TAROT INVOKE — draw cards
══════════════════════════════ */
function invokeDraw() {
  const sp = SPREADS[state.spreadKey];
  state.drawnCards = [...DECK].sort(() => Math.random() - 0.5).slice(0, sp.count).map(c => ({ ...c, reversed: Math.random() > 0.7 }));
  renderTarotLayout();
  renderTarotReading();
  tarotViewBar.style.display  = 'flex';
  tarotNotesRow.style.display = 'block';
  tarotTagsRow.style.display  = 'block';
  showTarotView('narrative');
  checkSaveEnabled();
}

function renderTarotLayout() {
  const sp = SPREADS[state.spreadKey];
  tarotLayout.innerHTML = '';
  const maxY = Math.max(...sp.pos.map(p => p.y));
  tarotLayout.style.height = `${Math.max(280, Math.ceil((maxY / 100) * 320) + 60)}px`;
  state.drawnCards.forEach((card, i) => {
    const pos  = sp.pos[i] || { x:50, y:50 };
    const chip = document.createElement('div');
    const isCrossing = (state.spreadKey === 'celtic' && i === 1);
    chip.className = `tarot-card-chip${isCrossing ? ' crossing' : ''}${card.reversed ? ' reversed' : ''}`;
    chip.style.left = `${pos.x}%`;
    chip.style.top  = `${pos.y}%`;
    chip.innerHTML  = `
      <span class="chip-pos">${sp.positions[i]}</span>
      <span class="chip-name">${escapeHtml(card.name.replace(/^\d+\.\s*/, ''))}</span>
      ${card.reversed ? '<span class="chip-rev">Rev.</span>' : ''}
    `;
    tarotLayout.appendChild(chip);
  });
}

function renderTarotReading() {
  const sp = SPREADS[state.spreadKey];
  tarotNarrative.textContent = state.drawnCards.map((c, i) =>
    `In the position of ${sp.positions[i]}, ${c.name}${c.reversed ? ' (Reversed)' : ''} speaks: ${c.technical}`
  ).join(' ');
  tarotCardsGrid.innerHTML = '';
  state.drawnCards.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'tarot-card-detail';
    div.innerHTML = `
      <div class="tarot-card-detail-pos">${escapeHtml(sp.positions[i])}</div>
      <div class="tarot-card-detail-name${c.reversed ? ' reversed' : ''}">${escapeHtml(c.name)}${c.reversed ? ' ↓' : ''}</div>
      <div class="tarot-card-detail-text">${c.reversed ? '[Rev] ' : ''}${escapeHtml(c.layman)}</div>
    `;
    tarotCardsGrid.appendChild(div);
  });
}

function showTarotView(view) {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  tarotNarrative.style.display = view === 'narrative' ? 'block' : 'none';
  tarotCardsGrid.style.display = view === 'cards'     ? 'grid'  : 'none';
}

/* ══════════════════════════════
   BUILD ENTRY OBJECT
   images: always included — empty array if none attached.
══════════════════════════════ */
function buildEntry() {
  const now     = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const base    = { id: String(now.getTime()), date: dateStr, time: timeStr, timestamp: now.getTime(), type: state.activeType };
  const tags    = el => el.value.trim() ? el.value.split(',').map(t => t.trim()).filter(Boolean) : [];
  const images  = [...state.imageDataUrls];

  switch (state.activeType) {
    case 'journal': return { ...base,
      title:  document.getElementById('journal-title').value.trim(),
      body:   document.getElementById('journal-body').value.trim(),
      mood:   state.selectedMood,
      tags:   tags(document.getElementById('journal-tags')),
      pinned: document.getElementById('journal-pinned').checked,
      images
    };
    case 'spell': return { ...base,
      title:       document.getElementById('spell-title').value.trim(),
      category:    state.spellCategory,
      moon:        state.spellMoon,
      ingredients: document.getElementById('spell-ingredients').value.trim(),
      intention:   document.getElementById('spell-intention').value.trim(),
      notes:       document.getElementById('spell-notes').value.trim(),
      tags:        tags(document.getElementById('spell-tags')),
      images
    };
    case 'ritual': return { ...base,
      title:    document.getElementById('ritual-title').value.trim(),
      occasion: state.ritualOccasion,
      altar:    document.getElementById('ritual-altar').value.trim(),
      deities:  document.getElementById('ritual-deities').value.trim(),
      notes:    document.getElementById('ritual-notes').value.trim(),
      tags:     tags(document.getElementById('ritual-tags')),
      images
    };
    case 'rede': return { ...base,
      title:   document.getElementById('rede-title').value.trim(),
      subtype: state.redeType,
      body:    document.getElementById('rede-body').value.trim(),
      source:  document.getElementById('rede-source').value.trim(),
      tags:    tags(document.getElementById('rede-tags')),
      images
    };
    case 'tarot': return { ...base,
      spreadKey:  state.spreadKey,
      spreadName: SPREADS[state.spreadKey].title,
      cards:      state.drawnCards,
      positions:  SPREADS[state.spreadKey].positions,
      narrative:  tarotNarrative.textContent,
      notes:      document.getElementById('tarot-notes').value.trim(),
      tags:       tags(document.getElementById('tarot-tags')),
      images
    };
  }
}

/* ══════════════════════════════
   SAVE ENTRY
   When state.editingId is set the existing entry is updated in-place,
   preserving its original id, date, time, and timestamp.
   When null a new entry is created as normal.
══════════════════════════════ */
function saveEntry() {
  const entry = buildEntry();
  if (!entry) return;

  if (state.editingId) {
    // ── UPDATE existing entry — preserve original identity fields ──
    const original = state.entries.find(e => e.id === state.editingId);
    const updated  = {
      ...entry,
      id:        original ? original.id        : entry.id,
      date:      original ? original.date      : entry.date,
      time:      original ? original.time      : entry.time,
      timestamp: original ? original.timestamp : entry.timestamp
    };
    state.entries  = state.entries.map(e => e.id === state.editingId ? updated : e);
    state.editingId = null;
    btnSave.innerHTML = '&#x1F4BE; Save to Grimoire';
    updateEditBanner(false);
  } else {
    // ── CREATE new entry ──
    state.entries.push(entry);
  }

  lsSave(state.entries);
  saveStatus.textContent = '✓ Saved to Grimoire';
  saveStatus.classList.add('visible');
  setTimeout(() => saveStatus.classList.remove('visible'), 2200);

  clearComposer();
  renderRecentPanel();
  updateFooter();
  updateStorageStatus();
  populateCategoryFilter();
}

/* ══════════════════════════════
   CLEAR COMPOSER
   Clears all fields and image state across all entry types.
   Also cancels any active edit session.
══════════════════════════════ */
function clearComposer() {
  ['journal-title','journal-body','journal-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  const jp = document.getElementById('journal-pinned'); if(jp) jp.checked = false;
  state.selectedMood = '✨ inspired';
  document.querySelectorAll('#mood-grid .mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === state.selectedMood));

  ['spell-title','spell-ingredients','spell-intention','spell-notes','spell-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  activatePill('spell-category-grid','spellCategory','protection');
  activatePill('spell-moon-grid','spellMoon','any');

  ['ritual-title','ritual-altar','ritual-deities','ritual-notes','ritual-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  activatePill('ritual-occasion-grid','ritualOccasion','esbat');

  ['rede-title','rede-body','rede-source','rede-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  activatePill('rede-type-grid','redeType','rede');

  ['tarot-notes','tarot-tags'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  resetTarotDraw();

  document.querySelectorAll('.img-url-input').forEach(el => { el.value = ''; });

  state.imageDataUrls = [];
  ['journal','spell','ritual','rede','tarot'].forEach(type => {
    const strip = document.getElementById(`img-preview-strip-${type}`);
    if (strip) strip.innerHTML = '';
  });

  // Cancel edit state if active
  if (state.editingId) {
    state.editingId = null;
    btnSave.innerHTML = '&#x1F4BE; Save to Grimoire';
    updateEditBanner(false);
  }

  checkSaveEnabled();
}

/* ══════════════════════════════
   EDIT BANNER
   Amber contextual strip above the composer action bar.
   Shown when the composer is in edit mode; hidden when idle.
   The Cancel button inside calls cancelEdit().
══════════════════════════════ */
function updateEditBanner(visible, title) {
  let banner = document.getElementById('composer-edit-banner');

  if (!visible) {
    if (banner) banner.style.display = 'none';
    return;
  }

  // Inject banner above .composer-actions on first use
  if (!banner) {
    banner = document.createElement('div');
    banner.id        = 'composer-edit-banner';
    banner.className = 'composer-edit-banner';
    const actionsBar = document.querySelector('.composer-actions');
    actionsBar.parentNode.insertBefore(banner, actionsBar);
  }

  banner.style.display = 'flex';
  banner.innerHTML = `
    <span class="edit-banner-label">&#x270F;&#xFE0F; Editing: <em>${escapeHtml(title || 'Entry')}</em></span>
    <button class="edit-banner-cancel" id="edit-banner-cancel-btn" type="button">&#x2715; Cancel Edit</button>
  `;
  document.getElementById('edit-banner-cancel-btn').addEventListener('click', cancelEdit);
}

/* ══════════════════════════════
   CANCEL EDIT
   Discards all pending changes and returns the composer to new-entry mode.
══════════════════════════════ */
function cancelEdit() {
  // clearComposer handles the editingId reset, button label, and banner hide
  clearComposer();
}

/* ══════════════════════════════
   EDIT ENTRY
   Loads an existing entry into the composer and activates edit mode.
   All fields across all types are fully populated from the stored entry.
   The reader modal is closed so the composer is visible.
══════════════════════════════ */
function editEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;

  // Close the reader modal and reset scroll target
  overlayReader.style.display = 'none';
  state.readerScrollTo = null;

  // Switch the composer to the correct type form
  switchType(entry.type);

  // Clear first — this resets editingId; we reassign it below after population
  clearComposer();

  // ── Populate fields by entry type ──────────────────────────────────────────

  switch (entry.type) {

    case 'journal': {
      const titleEl = document.getElementById('journal-title');
      const bodyEl  = document.getElementById('journal-body');
      const tagsEl  = document.getElementById('journal-tags');
      const pinEl   = document.getElementById('journal-pinned');
      if (titleEl) titleEl.value = entry.title  || '';
      if (bodyEl)  bodyEl.value  = entry.body   || '';
      if (tagsEl)  tagsEl.value  = (entry.tags  || []).join(', ');
      if (pinEl)   pinEl.checked = !!entry.pinned;
      if (entry.mood) {
        state.selectedMood = entry.mood;
        document.querySelectorAll('#mood-grid .mood-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.mood === entry.mood));
      }
      break;
    }

    case 'spell': {
      const t = document.getElementById('spell-title');
      const g = document.getElementById('spell-ingredients');
      const n = document.getElementById('spell-intention');
      const o = document.getElementById('spell-notes');
      const a = document.getElementById('spell-tags');
      if (t) t.value = entry.title       || '';
      if (g) g.value = entry.ingredients || '';
      if (n) n.value = entry.intention   || '';
      if (o) o.value = entry.notes       || '';
      if (a) a.value = (entry.tags       || []).join(', ');
      if (entry.category) activatePill('spell-category-grid', 'spellCategory', entry.category);
      if (entry.moon)     activatePill('spell-moon-grid',      'spellMoon',     entry.moon);
      break;
    }

    case 'ritual': {
      const t = document.getElementById('ritual-title');
      const l = document.getElementById('ritual-altar');
      const d = document.getElementById('ritual-deities');
      const n = document.getElementById('ritual-notes');
      const a = document.getElementById('ritual-tags');
      if (t) t.value = entry.title   || '';
      if (l) l.value = entry.altar   || '';
      if (d) d.value = entry.deities || '';
      if (n) n.value = entry.notes   || '';
      if (a) a.value = (entry.tags   || []).join(', ');
      if (entry.occasion) activatePill('ritual-occasion-grid', 'ritualOccasion', entry.occasion);
      break;
    }

    case 'rede': {
      const t = document.getElementById('rede-title');
      const b = document.getElementById('rede-body');
      const s = document.getElementById('rede-source');
      const a = document.getElementById('rede-tags');
      if (t) t.value = entry.title  || '';
      if (b) b.value = entry.body   || '';
      if (s) s.value = entry.source || '';
      if (a) a.value = (entry.tags  || []).join(', ');
      if (entry.subtype) activatePill('rede-type-grid', 'redeType', entry.subtype);
      break;
    }

    case 'tarot': {
      // Restore spread selection if the key still exists in SPREADS
      if (entry.spreadKey && SPREADS[entry.spreadKey]) {
        state.spreadKey = entry.spreadKey;
        const sp = SPREADS[entry.spreadKey];
        document.querySelectorAll('.spread-btn').forEach(b =>
          b.classList.toggle('active', b.textContent.startsWith(sp.title)));
        spreadNameLabel.textContent  = sp.title;
        spreadCountLabel.textContent = `${sp.count} card${sp.count !== 1 ? 's' : ''}`;
      }
      // Restore drawn cards and re-render layout + reading
      if (entry.cards && entry.cards.length) {
        state.drawnCards = entry.cards;
        renderTarotLayout();
        renderTarotReading();
        tarotViewBar.style.display  = 'flex';
        tarotNotesRow.style.display = 'block';
        tarotTagsRow.style.display  = 'block';
        showTarotView('narrative');
        // Override auto-generated narrative with the one saved on the entry
        if (entry.narrative) tarotNarrative.textContent = entry.narrative;
      }
      const n = document.getElementById('tarot-notes');
      const a = document.getElementById('tarot-tags');
      if (n) n.value = entry.notes || '';
      if (a) a.value = (entry.tags || []).join(', ');
      break;
    }
  }

  // ── Restore attached images ──────────────────────────────────────────────
  if (entry.images && entry.images.length) {
    state.imageDataUrls = [...entry.images];
    renderImagePreview();
  }

  // ── Activate edit mode ───────────────────────────────────────────────────
  state.editingId = id;
  const entryTitle = entry.title || getDefaultTitle(entry);
  btnSave.innerHTML = '&#x270F;&#xFE0F; Update Entry';
  updateEditBanner(true, entryTitle);
  checkSaveEnabled();

  // Scroll composer to top so populated fields are immediately visible
  const composer = document.getElementById('composer');
  if (composer) composer.scrollTop = 0;
}

/* ══════════════════════════════
   SAVE BUTTON GATE
══════════════════════════════ */
function checkSaveEnabled() {
  let ok = false;
  switch (state.activeType) {
    case 'journal': ok = !!(document.getElementById('journal-title')?.value.trim() || document.getElementById('journal-body')?.value.trim()); break;
    case 'spell':   ok = !!(document.getElementById('spell-title')?.value.trim() || document.getElementById('spell-notes')?.value.trim()); break;
    case 'ritual':  ok = !!(document.getElementById('ritual-title')?.value.trim() || document.getElementById('ritual-notes')?.value.trim()); break;
    case 'rede':    ok = !!document.getElementById('rede-body')?.value.trim(); break;
    case 'tarot':   ok = state.drawnCards.length > 0; break;
  }
  btnSave.disabled = !ok;
}

/* ══════════════════════════════
   EMOJI INSERT (journal body)
══════════════════════════════ */
function insertEmoji(emoji) {
  const ta = document.getElementById('journal-body');
  if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.value = ta.value.slice(0,s) + emoji + ta.value.slice(e);
  ta.selectionStart = ta.selectionEnd = s + emoji.length;
  ta.focus();
}

/* ══════════════════════════════
   RECENT PANEL
══════════════════════════════ */
function renderRecentPanel() {
  recentList.innerHTML = '';
  let entries = [...state.entries];
  if (state.recentFilter !== 'all') entries = entries.filter(e => e.type === state.recentFilter);
  if (state.grimoireQuery) {
    const q = state.grimoireQuery.toLowerCase();
    entries = entries.filter(e => getSearchHay(e).includes(q));
  }

  if (!entries.length) {
    const emptyMsg = state.grimoireQuery
      ? 'No entries match your search.'
      : 'Nothing here yet.<br/>Begin your first entry above.';
    recentList.innerHTML = `<div class="recent-empty">${emptyMsg}</div>`;
    recentCount.textContent = state.grimoireQuery ? '0 results' : '0 entries';
    return;
  }

  const sorted = entries
    .sort((a,b) => { if(a.pinned&&!b.pinned) return -1; if(!a.pinned&&b.pinned) return 1; return b.timestamp-a.timestamp; })
    .slice(0, 30);

  recentCount.textContent = `${entries.length} entr${entries.length!==1?'ies':'y'}`;

  sorted.forEach(entry => {
    const card = document.createElement('div');
    card.className    = `recent-card${entry.pinned?' pinned':''}`;
    card.dataset.id   = entry.id;
    card.dataset.type = entry.type;
    const typeEmoji = TYPE_EMOJI[entry.type] || '📝';
    const badge     = getBadge(entry);
    const blurb     = getBlurb(entry);
    const tagsHtml  = (entry.tags||[]).map(t=>`<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
    card.innerHTML = `
      <div class="recent-card-meta">
        <span class="recent-card-type">${typeEmoji}</span>
        <span class="recent-card-date">${entry.date}</span>
        <span class="recent-card-time">${entry.time}</span>
        ${badge?`<span class="recent-card-badge">${escapeHtml(badge)}</span>`:''}
      </div>
      <div class="recent-card-title">${escapeHtml(entry.title||getDefaultTitle(entry))}</div>
      <div class="recent-card-blurb">${escapeHtml(blurb)}</div>
      ${tagsHtml?`<div class="recent-card-tags">${tagsHtml}</div>`:''}
    `;
    card.addEventListener('click', () => openReader(entry.id));
    recentList.appendChild(card);
  });
}

function getBadge(e) {
  if (e.type==='journal') return e.mood||'';
  if (e.type==='spell')   return e.category||'';
  if (e.type==='ritual')  return e.occasion||'';
  if (e.type==='rede')    return e.subtype||'';
  if (e.type==='tarot')   return e.spreadName||'';
  return '';
}

function getBlurb(e) {
  if (e.type==='journal') return e.body||'';
  if (e.type==='spell')   return e.intention||e.notes||'';
  if (e.type==='ritual')  return e.notes||e.altar||'';
  if (e.type==='rede')    return e.body||'';
  if (e.type==='tarot')   return e.narrative ? e.narrative.slice(0,120)+'…' : '';
  return '';
}

function getDefaultTitle(e) {
  if (e.type==='tarot')  return `${e.spreadName} Reading`;
  if (e.type==='spell')  return `${e.category} Spell`;
  if (e.type==='ritual') return `${e.occasion} Ritual`;
  if (e.type==='rede')   return e.subtype||'Untitled';
  return 'Untitled';
}

function updateFooter() {
  const n = state.entries.length;
  footerCount.textContent = `${n} entr${n!==1?'ies':'y'}`;
}

/* ══════════════════════════════
   GRIMOIRE SEARCH + AUTOSUGGEST
   Searches: title, tags, body, notes, intention,
   ingredients, altar, deities, narrative, badge.
   Dropdown shows up to 8 best matches with
   highlighted matched text. Keyboard navigable.
══════════════════════════════ */
function getSearchHay(e) {
  return [
    e.title, e.body, e.notes, e.intention, e.ingredients,
    e.altar, e.deities, e.narrative, e.spreadName,
    e.mood, e.category, e.subtype, e.occasion,
    ...(e.tags||[])
  ].filter(Boolean).join(' ').toLowerCase();
}

function highlightMatch(text, query) {
  if (!query || !text) return escapeHtml(text||'');
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return escapeHtml(text.slice(0, idx))
    + '<mark>' + escapeHtml(text.slice(idx, idx + query.length)) + '</mark>'
    + escapeHtml(text.slice(idx + query.length));
}

function matchingTags(entry, query) {
  if (!query) return [];
  return (entry.tags||[]).filter(t => t.toLowerCase().includes(query.toLowerCase()));
}

let _suggestIndex = -1;

function openGrimoireSearch(query) {
  state.grimoireQuery = query;
  grimoireSearchClear.style.display = query ? 'block' : 'none';
  grimoireSearch.classList.toggle('has-value', !!query);
  renderRecentPanel();
  renderSuggestions(query);
}

function clearGrimoireSearch() {
  state.grimoireQuery = '';
  grimoireSearch.value = '';
  grimoireSearchClear.style.display = 'none';
  grimoireSearch.classList.remove('has-value');
  grimoireSuggest.style.display = 'none';
  _suggestIndex = -1;
  renderRecentPanel();
}

function renderSuggestions(query) {
  grimoireSuggest.innerHTML = '';
  _suggestIndex = -1;

  if (!query || query.length < 1) { grimoireSuggest.style.display = 'none'; return; }

  const q = query.toLowerCase();
  const matches = state.entries
    .filter(e => getSearchHay(e).includes(q))
    .sort((a, b) => {
      const aTitle = (a.title||getDefaultTitle(a)).toLowerCase().includes(q);
      const bTitle = (b.title||getDefaultTitle(b)).toLowerCase().includes(q);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return  1;
      return b.timestamp - a.timestamp;
    })
    .slice(0, 8);

  if (!matches.length) {
    grimoireSuggest.innerHTML = '<div class="suggest-empty">Nothing found in the Grimoire.</div>';
    grimoireSuggest.style.display = 'block';
    return;
  }

  matches.forEach(entry => {
    const item    = document.createElement('div');
    item.className = 'suggest-item';
    const title   = entry.title || getDefaultTitle(entry);
    const mTags   = matchingTags(entry, query);
    item.innerHTML = `
      <span class="suggest-icon">${TYPE_EMOJI[entry.type] || '📝'}</span>
      <span class="suggest-text">
        <span class="suggest-title">${highlightMatch(title, query)}</span>
        <span class="suggest-meta">${entry.date} ${entry.time}${getBadge(entry) ? ' · ' + escapeHtml(getBadge(entry)) : ''}</span>
        ${mTags.length ? `<span class="suggest-tags">${mTags.map(t=>`<span class="suggest-tag">${highlightMatch(t,query)}</span>`).join('')}</span>` : ''}
      </span>
    `;
    item.addEventListener('mousedown', e => {
      e.preventDefault();
      closeSuggestions();
      openReader(entry.id);
    });
    grimoireSuggest.appendChild(item);
  });

  grimoireSuggest.style.display = 'block';
}

function closeSuggestions() {
  grimoireSuggest.style.display = 'none';
  _suggestIndex = -1;
}

function moveSuggestCursor(dir) {
  const items = grimoireSuggest.querySelectorAll('.suggest-item');
  if (!items.length) return;
  items[_suggestIndex]?.classList.remove('active');
  _suggestIndex = (_suggestIndex + dir + items.length) % items.length;
  const active = items[_suggestIndex];
  active.classList.add('active');
  active.scrollIntoView({ block: 'nearest' });
}

function selectSuggestCursor() {
  const active = grimoireSuggest.querySelector('.suggest-item.active');
  if (active) active.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

/* ══════════════════════════════
   READER
   Category filter chains with type filter.
   Search haystack includes e.deities for ritual searches.
   Images rendered as a gallery strip above the entry body.
══════════════════════════════ */
function openReader(scrollToId = null) {
  state.readerScrollTo = scrollToId;
  overlayReader.style.display = 'flex';
  renderReader();
}

function renderReader() {
  const search     = readerSearch.value.toLowerCase().trim();
  const typeFilter = readerFilterType.value;
  const catFilter  = readerFilterCat.value;

  let entries = [...state.entries];
  if (typeFilter) entries = entries.filter(e => e.type === typeFilter);
  if (catFilter)  entries = entries.filter(e => (e.category||e.subtype||e.occasion||e.spreadName||'') === catFilter);
  if (search) entries = entries.filter(e => getSearchHay(e).includes(search));

  entries.sort((a,b) => state.readerSort==='desc' ? b.timestamp-a.timestamp : a.timestamp-b.timestamp);

  readerSubtitle.textContent = (search||typeFilter||catFilter)
    ? `${entries.length} result${entries.length!==1?'s':''}`
    : `${state.entries.length} entr${state.entries.length!==1?'ies':'y'}`;

  readerBody.innerHTML = '';
  if (!entries.length) { readerBody.innerHTML = '<div class="reader-empty">Nothing found in the Book.</div>'; return; }

  const groupMap = new Map();
  entries.forEach(e => { if(!groupMap.has(e.date)) groupMap.set(e.date,[]); groupMap.get(e.date).push(e); });

  [...groupMap.keys()]
    .sort((a,b) => state.readerSort==='desc' ? b.localeCompare(a) : a.localeCompare(b))
    .forEach(date => {
      const d   = new Date(date+'T00:00:00');
      const grp = document.createElement('div');
      grp.className = 'reader-date-group';
      grp.innerHTML = `<span class="reader-date-group-label">${getMoonPhase(d)} ${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}</span><div class="reader-date-group-line"></div>`;
      readerBody.appendChild(grp);
      groupMap.get(date).forEach(entry => readerBody.appendChild(buildReaderEntry(entry)));
    });

  if (state.readerScrollTo) {
    const target = readerBody.querySelector(`[data-entry-id="${state.readerScrollTo}"]`);
    if (target) setTimeout(() => target.scrollIntoView({behavior:'smooth',block:'start'}), 80);
  }
}

/* ══════════════════════════════
   BUILD READER ENTRY
   Each entry card in the reader modal.
   Actions row contains Edit and Delete buttons.
   Edit triggers editEntry(); Delete triggers the confirm modal.
══════════════════════════════ */
function buildReaderEntry(entry) {
  const el = document.createElement('div');
  el.className       = `reader-entry${entry.pinned?' pinned':''}`;
  el.dataset.entryId = entry.id;
  el.dataset.type    = entry.type;

  const typeLabel = {journal:'📓 Journal',spell:'🔮 Spell',ritual:'🕯 Ritual',rede:'📜 Rede',tarot:'🃏 Tarot'}[entry.type]||entry.type;
  const badge     = getBadge(entry);
  const tagsHtml  = (entry.tags||[]).map(t=>`<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
  const title     = entry.title||getDefaultTitle(entry);

  const imagesHtml = (entry.images && entry.images.length)
    ? `<div class="reader-entry-images">${entry.images.map((src,i) =>
        `<img class="reader-entry-img" src="${escapeHtml(src)}" alt="Attached image ${i+1}" loading="lazy"/>`
      ).join('')}</div>`
    : '';

  let bodyHtml = '';
  switch (entry.type) {
    case 'journal': {
      bodyHtml = entry.body ? `<div class="reader-entry-body">${escapeHtml(entry.body)}</div>` : '';
      break;
    }
    case 'spell': {
      bodyHtml = `<div class="reader-fields">
        ${entry.ingredients ? `<div class="reader-field-block"><div class="reader-field-label">Ingredients</div><div class="reader-field-value">${escapeHtml(entry.ingredients)}</div></div>` : ''}
        ${entry.intention   ? `<div class="reader-field-block"><div class="reader-field-label">Intention</div><div class="reader-field-value">${escapeHtml(entry.intention)}</div></div>` : ''}
        ${entry.notes       ? `<div class="reader-field-block"><div class="reader-field-label">Working & Notes</div><div class="reader-field-value">${escapeHtml(entry.notes)}</div></div>` : ''}
      </div>`;
      break;
    }
    case 'ritual': {
      bodyHtml = `<div class="reader-fields">
        ${entry.altar   ? `<div class="reader-field-block"><div class="reader-field-label">Altar Layout</div><div class="reader-field-value">${escapeHtml(entry.altar)}</div></div>` : ''}
        ${entry.deities ? `<div class="reader-field-block"><div class="reader-field-label">Deities</div><div class="reader-field-value">${escapeHtml(entry.deities)}</div></div>` : ''}
        ${entry.notes   ? `<div class="reader-field-block"><div class="reader-field-label">Notes</div><div class="reader-field-value">${escapeHtml(entry.notes)}</div></div>` : ''}
      </div>`;
      break;
    }
    case 'rede': {
      bodyHtml = `
        ${entry.body   ? `<div class="reader-entry-body">${escapeHtml(entry.body)}</div>` : ''}
        ${entry.source ? `<div class="reader-field-block" style="margin-top:8px"><div class="reader-field-label">Source</div><div class="reader-field-value">${escapeHtml(entry.source)}</div></div>` : ''}
      `;
      break;
    }
    case 'tarot': {
      const cardRows = (entry.cards||[]).map((c,i) => `
        <div class="reader-tarot-card">
          <div class="reader-tarot-pos">${escapeHtml((entry.positions||[])[i]||'')}</div>
          <div class="reader-tarot-name${c.reversed?' reversed':''}">${escapeHtml(c.name)}${c.reversed?' ↓':''}</div>
          <div class="reader-tarot-meanings">${c.reversed?'[Rev] ':''}${escapeHtml(c.layman)}</div>
        </div>`).join('');
      bodyHtml = `
        ${entry.narrative ? `<div class="reader-tarot-narrative">${escapeHtml(entry.narrative)}</div>` : ''}
        <div class="reader-tarot-cards">${cardRows}</div>
        ${entry.notes ? `<div class="reader-field-block"><div class="reader-field-label">Your Interpretation</div><div class="reader-field-value">${escapeHtml(entry.notes)}</div></div>` : ''}
      `;
      break;
    }
  }

  el.innerHTML = `
    <div class="reader-entry-meta">
      <span class="reader-entry-type-badge">${typeLabel}</span>
      <span class="reader-entry-time">${entry.time}</span>
      ${badge?`<span class="reader-entry-badge">${escapeHtml(badge)}</span>`:''}
      <div class="reader-entry-tags">${tagsHtml}</div>
      <div class="reader-entry-actions">
        <button class="entry-action-btn entry-action-btn--edit"   data-action="edit"   data-id="${entry.id}">&#x270F;&#xFE0F; Edit</button>
        <button class="entry-action-btn entry-action-btn--delete" data-action="delete" data-id="${entry.id}">&#x1F5D1; Delete</button>
      </div>
    </div>
    <div class="reader-entry-title">${escapeHtml(title)}</div>
    ${imagesHtml}
    ${bodyHtml}
  `;

  // ── Edit button ──
  el.querySelector('[data-action="edit"]').addEventListener('click', ev => {
    ev.stopPropagation();
    editEntry(entry.id);
  });

  // ── Delete button ──
  el.querySelector('[data-action="delete"]').addEventListener('click', ev => {
    ev.stopPropagation();
    state.pendingDelete = entry.id;
    overlayDelete.style.display = 'flex';
  });

  return el;
}

/* ══════════════════════════════
   CATEGORY FILTER
   Scoped to the current type selection.
   Called whenever type filter changes.
══════════════════════════════ */
function populateCategoryFilter() {
  const typeFilter = readerFilterType.value;
  const cats = [...new Set(
    state.entries
      .filter(e => !typeFilter || e.type === typeFilter)
      .map(e => e.category||e.subtype||e.occasion||e.spreadName)
      .filter(Boolean)
  )].sort();
  readerFilterCat.innerHTML = '<option value="">All categories</option>';
  cats.forEach(c => { const o=document.createElement('option'); o.value=c; o.textContent=c; readerFilterCat.appendChild(o); });
}

/* ══════════════════════════════
   CALENDAR
══════════════════════════════ */
function openCalendar() {
  overlayCalendar.style.display = 'flex';
  renderCalendar(); renderWheelStrip(); renderUpcomingSabbats();
}

function renderCalendar() {
  const year=state.calYear, month=state.calMonth, today=new Date();
  calMonthLabel.textContent = `${MONTHS[month]} ${year}`;
  const firstDay    = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const daysInPrev  = new Date(year,month,0).getDate();
  const entryDates  = new Set(state.entries.map(e=>e.date));
  const sabbatDays  = new Set(SABBATS.filter(s=>s.month===month).map(s=>s.day));
  calGrid.innerHTML = '';
  for(let i=firstDay-1;i>=0;i--){const c=document.createElement('div');c.className='cal-day other-month';c.textContent=daysInPrev-i;calGrid.appendChild(c);}
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell=document.createElement('div'); cell.className='cal-day'; cell.dataset.date=dateStr;
    if(d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()) cell.classList.add('today');
    if(entryDates.has(dateStr))       cell.classList.add('has-entry');
    if(sabbatDays.has(d))             cell.classList.add('sabbat-day');
    if(state.calSelected===dateStr)   cell.classList.add('selected');
    cell.innerHTML=`<span>${d}</span><span class="cal-day-moon">${getMoonPhase(new Date(year,month,d))}</span>`;
    cell.addEventListener('click',()=>selectCalDate(dateStr));
    calGrid.appendChild(cell);
  }
  const rem=(firstDay+daysInMonth)%7===0?0:7-((firstDay+daysInMonth)%7);
  for(let d=1;d<=rem;d++){const c=document.createElement('div');c.className='cal-day other-month';c.textContent=d;calGrid.appendChild(c);}
}

function selectCalDate(dateStr) {
  state.calSelected=dateStr; renderCalendar();
  const dayEntries=state.entries.filter(e=>e.date===dateStr).sort((a,b)=>a.timestamp-b.timestamp);
  const d=new Date(dateStr+'T00:00:00');
  calEntriesLabel.textContent=dayEntries.length
    ?`${dayEntries.length} entr${dayEntries.length!==1?'ies':'y'} on ${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
    :`No entries on ${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  calEntriesList.innerHTML='';
  dayEntries.forEach(entry=>{
    const div=document.createElement('div'); div.className='cal-entry-mini';
    const typeEmoji = TYPE_EMOJI[entry.type] || '📝';
    div.innerHTML=`<div class="cal-entry-mini-title">${typeEmoji} ${escapeHtml(entry.title||getDefaultTitle(entry))}</div><div class="cal-entry-mini-time">${entry.time} — ${escapeHtml(getBadge(entry))}</div>`;
    div.addEventListener('click',()=>{overlayCalendar.style.display='none';state.calSelected=null;openReader(entry.id);});
    calEntriesList.appendChild(div);
  });
}

function renderWheelStrip() {
  const today=new Date(); wheelStrip.innerHTML='';
  SABBATS.forEach(s=>{
    const badge=document.createElement('div'); badge.className='sabbat-badge';
    const diff=Math.ceil((new Date(today.getFullYear(),s.month,s.day)-today)/86400000);
    if(s.month===state.calMonth) badge.classList.add('current-month');
    if(diff>=0&&diff<=30)        badge.classList.add('upcoming');
    badge.innerHTML=`${s.emoji} ${s.name}`; badge.title=`${s.name} — ${MONTHS[s.month]} ${s.day}`;
    wheelStrip.appendChild(badge);
  });
}

function renderUpcomingSabbats() {
  const today=new Date();
  upcomingSabbats.innerHTML=`<div class="upcoming-sabbats-title">Upcoming Sabbats</div>`;
  SABBATS.map(s=>{
    const ty=new Date(today.getFullYear(),s.month,s.day);
    const t=ty>=today?ty:new Date(today.getFullYear()+1,s.month,s.day);
    return {...s,diffDays:Math.ceil((t-today)/86400000)};
  }).sort((a,b)=>a.diffDays-b.diffDays).slice(0,4).forEach(s=>{
    const row=document.createElement('div'); row.className='upcoming-row';
    const dl=s.diffDays===0?'Today':s.diffDays===1?'Tomorrow':`in ${s.diffDays} days`;
    row.innerHTML=`<span>${s.emoji}</span><span class="upcoming-sabbat-name">${s.name}</span><span class="upcoming-sabbat-date">${MONTHS[s.month]} ${s.day}</span><span class="upcoming-sabbat-days">${dl}</span>`;
    upcomingSabbats.appendChild(row);
  });
}

/* ══════════════════════════════
   DELETE
   If the entry being deleted is currently in edit mode,
   the edit session is cancelled before deletion.
══════════════════════════════ */
function deleteEntry(id) {
  if (state.editingId === id) {
    state.editingId = null;
    btnSave.innerHTML = '&#x1F4BE; Save to Grimoire';
    updateEditBanner(false);
    clearComposer();
  }
  state.entries = state.entries.filter(e=>e.id!==id);
  lsSave(state.entries);
  renderRecentPanel(); updateFooter(); updateStorageStatus(); populateCategoryFilter();
  if (overlayReader.style.display!=='none') renderReader();
}

/* ══════════════════════════════
   UTILITIES
══════════════════════════════ */
function escapeHtml(text) {
  const d=document.createElement('div'); d.textContent=String(text||''); return d.innerHTML;
}

/* ══════════════════════════════
   EVENT LISTENERS
══════════════════════════════ */

/* ── Type buttons ── */
document.querySelectorAll('.type-btn').forEach(btn =>
  btn.addEventListener('click', () => switchType(btn.dataset.type)));

/* ── Header buttons ── */
btnReader.addEventListener('click', () => openReader());
btnCalendar.addEventListener('click', openCalendar);

/* ── Save / Clear ── */
btnSave.addEventListener('click', saveEntry);

btnClear.addEventListener('click', () => {
  const hasContent =
    document.getElementById('journal-body')?.value.trim() ||
    document.getElementById('journal-title')?.value.trim() ||
    document.getElementById('spell-title')?.value.trim() ||
    document.getElementById('spell-notes')?.value.trim() ||
    document.getElementById('ritual-title')?.value.trim() ||
    document.getElementById('ritual-notes')?.value.trim() ||
    document.getElementById('rede-body')?.value.trim() ||
    state.drawnCards.length > 0 ||
    state.imageDataUrls.length > 0;
  // In edit mode the confirmation wording acknowledges the cancel action
  const msg = state.editingId
    ? 'Cancel this edit and discard all changes?'
    : 'Clear the current entry?';
  if ((hasContent || state.editingId) && !confirm(msg)) return;
  clearComposer();
});

/* ── Text field input → save gate ── */
['journal-title','journal-body'].forEach(id => {
  const el=document.getElementById(id); if(el) el.addEventListener('input',checkSaveEnabled);
});
['spell-title','spell-notes'].forEach(id => {
  const el=document.getElementById(id); if(el) el.addEventListener('input',checkSaveEnabled);
});
['ritual-title','ritual-notes'].forEach(id => {
  const el=document.getElementById(id); if(el) el.addEventListener('input',checkSaveEnabled);
});
const redeBodyEl = document.getElementById('rede-body');
if (redeBodyEl) redeBodyEl.addEventListener('input', checkSaveEnabled);

/* ── Mood / Pill grids ── */
moodGrid.addEventListener('click', e => {
  const btn=e.target.closest('.mood-btn'); if(!btn) return;
  state.selectedMood=btn.dataset.mood;
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
});

document.getElementById('spell-category-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('spell-category-grid','spellCategory',btn.dataset.val);
});
document.getElementById('spell-moon-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('spell-moon-grid','spellMoon',btn.dataset.val);
});
document.getElementById('ritual-occasion-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('ritual-occasion-grid','ritualOccasion',btn.dataset.val);
});
document.getElementById('rede-type-grid').addEventListener('click', e => {
  const btn=e.target.closest('.pill-btn'); if(!btn) return;
  activatePill('rede-type-grid','redeType',btn.dataset.val);
});

/* ── Emoji strip ── */
emojiStrip.addEventListener('click', e => {
  const btn=e.target.closest('.emoji-btn'); if(btn) insertEmoji(btn.dataset.emoji);
});

/* ── Tarot ── */
btnInvoke.addEventListener('click', invokeDraw);
document.getElementById('tarot-view-bar').addEventListener('click', e => {
  const tab=e.target.closest('.view-tab'); if(tab) showTarotView(tab.dataset.view);
});

/* ── IMAGE UPLOAD WIRING ──────────────────────────────────────────────────
   Each form has a .img-pick-btn and a .img-url-btn identified by data-form.
   The shared hidden file input #img-file-input is clicked programmatically.
   On file change all selected files are compressed and added to state.
   URL button validates and adds the adjacent input's value directly.
────────────────────────────────────────────────────────────────────────── */
document.querySelectorAll('.img-pick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    _activePickForm = btn.dataset.form;
    imgFileInput.value = '';
    imgFileInput.click();
  });
});

imgFileInput.addEventListener('change', async () => {
  const files = Array.from(imgFileInput.files);
  if (!files.length) return;
  for (const file of files) {
    try {
      const dataUri = await compressImage(file);
      state.imageDataUrls.push(dataUri);
    } catch (err) {
      console.warn('Image compress failed:', err);
      alert(`Could not process image "${file.name}". Please try another file.`);
    }
  }
  renderImagePreview();
});

document.querySelectorAll('.img-url-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.img-url-row')?.querySelector('.img-url-input');
    if (!input) return;
    addImageUrl(input.value);
    input.value = '';
  });
});

document.querySelectorAll('.img-url-input').forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addImageUrl(input.value); input.value = ''; }
  });
});

/* ── Grimoire search ── */
grimoireSearch.addEventListener('input', e => { openGrimoireSearch(e.target.value); });
grimoireSearch.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown')  { e.preventDefault(); moveSuggestCursor(1); }
  if (e.key === 'ArrowUp')    { e.preventDefault(); moveSuggestCursor(-1); }
  if (e.key === 'Enter')      { e.preventDefault(); selectSuggestCursor(); }
  if (e.key === 'Escape')     { closeSuggestions(); grimoireSearch.blur(); }
});
grimoireSearch.addEventListener('focus', () => { if (state.grimoireQuery) renderSuggestions(state.grimoireQuery); });
grimoireSearch.addEventListener('blur',  () => { setTimeout(closeSuggestions, 150); });
grimoireSearchClear.addEventListener('click', clearGrimoireSearch);

/* ── Recent panel filters ── */
recentFilters.addEventListener('click', e => {
  const btn=e.target.closest('.filter-btn'); if(!btn) return;
  state.recentFilter=btn.dataset.filter;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.recentFilter));
  renderRecentPanel();
});

/* ── Reader ── */
readerClose.addEventListener('click', () => { overlayReader.style.display='none'; state.readerScrollTo=null; });
readerSearch.addEventListener('input', () => renderReader());
readerFilterType.addEventListener('change', () => { populateCategoryFilter(); renderReader(); });
readerFilterCat.addEventListener('change', () => renderReader());
readerSort.addEventListener('click', () => {
  state.readerSort=state.readerSort==='desc'?'asc':'desc';
  readerSort.textContent=state.readerSort==='desc'?'↓ Newest':'↑ Oldest';
  renderReader();
});

/* ── Calendar ── */
calClose.addEventListener('click', () => { overlayCalendar.style.display='none'; state.calSelected=null; });
calPrev.addEventListener('click', () => {
  state.calMonth--; if(state.calMonth<0){state.calMonth=11;state.calYear--;}
  renderCalendar(); renderWheelStrip(); renderUpcomingSabbats();
});
calNext.addEventListener('click', () => {
  state.calMonth++; if(state.calMonth>11){state.calMonth=0;state.calYear++;}
  renderCalendar(); renderWheelStrip(); renderUpcomingSabbats();
});

/* ── Delete ── */
deleteConfirm.addEventListener('click', () => {
  if(state.pendingDelete) deleteEntry(state.pendingDelete);
  state.pendingDelete=null; overlayDelete.style.display='none';
});
deleteCancel.addEventListener('click', () => { state.pendingDelete=null; overlayDelete.style.display='none'; });

/* ── Keyboard global ── */
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){
    overlayReader.style.display='none'; overlayCalendar.style.display='none'; overlayDelete.style.display='none';
    state.readerScrollTo=null; state.calSelected=null;
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();if(!btnSave.disabled)saveEntry();}
});

/* ── Overlay backdrop click to close ── */
[overlayReader,overlayCalendar,overlayDelete].forEach(o=>{
  o.addEventListener('click',e=>{
    if(e.target!==o) return;
    o.style.display='none';
    if(o===overlayReader)   state.readerScrollTo=null;
    if(o===overlayCalendar) state.calSelected=null;
    if(o===overlayDelete)   state.pendingDelete=null;
  });
});

/* ══════════════════════════════
   INITIALISATION
   Auto-loads from localStorage. No user action required.
══════════════════════════════ */
function init() {
  buildSpreadSelector();
  updateStorageStatus();
  checkSaveEnabled();
  renderRecentPanel();
  updateFooter();
  populateCategoryFilter();
}

init();
