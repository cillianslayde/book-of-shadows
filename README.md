# Book of Shadows

A private, browser-based grimoire for journaling, spellwork, rituals, redes/chants, and tarot readings. Everything is built from three plain files — no build step, no server, no account — and all entries are saved locally in your browser.

```
~/>  Book of Shadows  ·  0x75  ·  v1q
```

---

## 1. What's in this folder

| File               | Purpose                                                |
|---------------------|---------------------------------------------------------|
| `wiccan.html`       | The app itself — structure and layout                  |
| `wiccan-main.css`   | All styling (dark, candlelit theme)                     |
| `wiccan-main.js`    | All behavior — saving, searching, the calendar, tarot draws, etc. |

All three files must stay in the **same folder** — the HTML links to the CSS and JS by relative filename (`wiccan-main.css`, `wiccan-main.js`), so if you rename or move one, update the reference in `wiccan.html` (lines 14 and 577) to match.

---

## 2. Running it locally

No installation needed.

1. Double-click `wiccan.html`, or right-click → **Open with** → your browser.
2. That's it — the app loads and is immediately usable.

**Note on fonts:** the app pulls its display fonts (Cinzel, Syne, Outfit, Courier Prime) from Google Fonts over the internet. With no internet connection the app still works perfectly — it just falls back to your browser's default fonts instead of the custom ones.

---

## 3. Using the app

### Composer (left side)
- Pick an entry type along the top: **Journal, Spell, Ritual, Rede, Tarot**.
- Fill in the fields for that type. A title is optional for most types — the Save button unlocks as soon as there's *some* content (a title, a body, notes, or drawn tarot cards, depending on type).
- **Images:** every entry type has an "Add Images" section — upload files from your device (auto-compressed so they don't bloat storage) or paste an image URL directly.
- **Tarot:** choose a spread, click "Cast the Circle" to draw cards, then switch between the Narrative and Cards views. Notes and tags appear once cards are drawn.
- Press **Ctrl+S / ⌘+S** or click **Save to Grimoire** to save. **Clear** wipes the current form (it asks for confirmation if there's unsaved content).

### Grimoire (right sidebar)
- Shows your most recent entries, filterable by type.
- The search bar autosuggests matching entries as you type (searches titles, tags, and body text). Arrow keys + Enter navigate the suggestions.
- Click any entry to open it in the full **Reader**.

### Reader (📖 Read)
- Browse everything, filter by type/category, search, and sort newest/oldest.
- Each entry has **Edit** (loads it back into the composer) and **Delete** (asks for confirmation) buttons.

### Wheel of the Year (🗓 Calendar)
- A monthly calendar showing moon phases and Sabbats, with a running list of what's coming up next.
- Click any date to see what you wrote that day.

---

## 4. Where your data lives

Every entry is saved to your browser's **local storage** (`localStorage`), scoped to whatever file path or domain you open the app from. In practice that means:

- **It stays on this device, in this browser.** Nothing is uploaded anywhere.
- Opening `wiccan.html` from a different folder path, different browser, or in a private/incognito window will **not** show your existing entries — local storage is tied to the exact origin the file is served from.
- Clearing your browser's site data/history for this page will **delete your entries**. There's currently no built-in export/backup feature, so if that matters to you, be mindful of browser cleanup tools.
- Images are compressed and stored inline with each entry (max 800px, JPEG quality 0.75) to keep things reasonably light, but local storage does have a size ceiling (typically 5–10MB depending on browser). The header shows a live entry count and storage size (in KB) so you can keep an eye on it.

---

## 5. Putting it on GitHub

### Option A — Just host the code (no live site)
1. Create a new repository on GitHub.
2. Add all three files (`wiccan.html`, `wiccan-main.css`, `wiccan-main.js`) to the repo root, plus this `README.md`.
3. Commit and push.

That's enough if you just want version control / backup — anyone who clones it can open `wiccan.html` locally exactly as described in Section 2.

### Option B — Make it a live website (GitHub Pages)
GitHub Pages serves whatever file is named `index.html` at the root by default.

1. Either:
   - Rename `wiccan.html` to `index.html`, **or**
   - Keep the name as `wiccan.html` and just link to `https://<username>.github.io/<repo>/wiccan.html` directly.
2. Push the repo to GitHub.
3. Go to the repo's **Settings → Pages**, set the source branch (usually `main`) and folder (`/root`), and save.
4. GitHub will give you a live URL within a minute or two.

**Important:** if you go this route, remember that local storage on the live GitHub Pages URL is a *different* storage bucket than local storage on your own computer's copy of the file. Entries you made testing locally won't appear on the live site, and vice versa.

---

## 6. Audit notes (as of this review)

A full pass was made over all three files before packaging this build:

- ✅ HTML tag structure validated — no unclosed or mismatched tags.
- ✅ JavaScript syntax validated — no errors.
- ✅ CSS braces balanced — no malformed rules.
- ✅ Every DOM element ID referenced in the JavaScript exists in the HTML, and vice versa (the two IDs that appeared "JS-only" — `composer-edit-banner` and its cancel button — are intentionally created by the JS itself when you start editing an entry, not missing markup).
- ✅ Every CSS class referenced by the HTML or generated dynamically by the JavaScript has a matching style rule.
- ✅ No leftover dead code, duplicate rules, or cross-contamination found — the CSS already carries inline comments (`FIX #9`, `#11`, `#12`, `#14`, `#15`) documenting earlier cleanup passes, and those fixes are consistent with the current code.

**One cosmetic (non-breaking) inconsistency worth knowing about:** in the Reader's category filter dropdown, category names appear in plain lowercase text (e.g. "protection") rather than the emoji + capitalized style used on the pill buttons in the composer (e.g. "🛡 Protection"). This doesn't affect functionality — filtering works correctly either way — it's just a minor visual mismatch. No changes were made to fix this since it wasn't part of the request; flagging it here in case you'd like it addressed in a future pass.

No functional bugs were found. The app is ready to publish as-is.
