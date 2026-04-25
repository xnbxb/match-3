/**
 * GalleryLoader.js
 * ----------------
 * Reads a user-selected parent folder (via Chrome's File System Access API)
 * and normalises its sub-folders into scene objects that the rest of the game
 * already understands.
 *
 * EXPECTED FOLDER STRUCTURE:
 *   <parent>/
 *     Jane - Bedroom/
 *       scene.json          ← metadata & dialogue  (optional but recommended)
 *       01/                 ← stage folders, sorted by name
 *         image.jpg
 *       02/
 *         image.jpg
 *     Jane - Beach/
 *       …
 *
 * JSON shape (all fields optional except the folder name itself):
 *   {
 *     "bio": "…",
 *     "nationality": "FR",
 *     "dialoguefold": ["…"],
 *     "dialoguewinhand": ["…"],
 *     "dialoguewinfinal": ["…"],
 *     "handdialogue": { "1": ["…"], "2": ["…"], "3": ["…"] }
 *   }
 *
 * OUTPUT — array of scene objects matching the existing mock-scenes shape:
 *   {
 *     id, name, location, bio, nationality,
 *     stages: [ { label, objectURL } ],   ← objectURL replaces mock `color`
 *     dialoguefold, dialoguewinhand, dialoguewinfinal, handdialogue
 *   }
 *
 * Object URLs are created with URL.createObjectURL() and should be revoked
 * when the scene is no longer needed (call GalleryLoader.revokeAll()).
 */

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
const JSON_NAMES = new Set(['scene.json', 'meta.json', 'info.json']);

/**
 * Open a directory picker and return normalised scene data.
 * Resolves to an array of scene objects, or [] if the user cancels.
 *
 * @returns {Promise<Array>}
 */
export async function pickAndLoadGallery() {
  let dirHandle;
  try {
    dirHandle = await window.showDirectoryPicker({ mode: 'read' });
  } catch (e) {
    // User cancelled or permission denied
    return [];
  }
  return _loadFromDirectoryHandle(dirHandle);
}

// Keep track of all created object URLs so we can revoke them later.
const _activeURLs = [];

/** Revoke all object URLs created by this loader to free memory. */
export function revokeAll() {
  _activeURLs.forEach(url => URL.revokeObjectURL(url));
  _activeURLs.length = 0;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function _loadFromDirectoryHandle(parentHandle) {
  const scenes = [];

  for await (const [name, handle] of parentHandle.entries()) {
    if (handle.kind !== 'directory') continue;
    // Skip hidden folders (e.g. .DS_Store dirs)
    if (name.startsWith('.')) continue;

    const scene = await _loadSceneFolder(name, handle);
    if (scene) scenes.push(scene);
  }

  // Sort scenes alphabetically by folder name so order is predictable.
  scenes.sort((a, b) => a.id.localeCompare(b.id));
  return scenes;
}

async function _loadSceneFolder(folderName, dirHandle) {
  // Parse "Jane - Bedroom" → name: "Jane", location: "Bedroom"
  const dashIndex = folderName.indexOf(' - ');
  const name     = dashIndex >= 0 ? folderName.slice(0, dashIndex).trim()  : folderName;
  const location = dashIndex >= 0 ? folderName.slice(dashIndex + 3).trim() : '';

  let meta = {};
  const stageFolders = [];

  for await (const [entryName, entryHandle] of dirHandle.entries()) {
    if (entryHandle.kind === 'file') {
      if (JSON_NAMES.has(entryName.toLowerCase())) {
        meta = await _readJson(entryHandle);
      }
    } else if (entryHandle.kind === 'directory' && !entryName.startsWith('.')) {
      stageFolders.push({ name: entryName, handle: entryHandle });
    }
  }

  if (stageFolders.length === 0) return null; // skip empty folders

  // Sort stage folders by name (numeric-aware sort handles 01, 02 … 10+)
  stageFolders.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  const stages = [];
  for (const { name: stageName, handle: stageHandle } of stageFolders) {
    const imgFile = await _findFirstImage(stageHandle);
    if (!imgFile) continue;
    const blob = await imgFile.getFile();
    const url  = URL.createObjectURL(blob);
    _activeURLs.push(url);
    stages.push({ label: stageName, objectURL: url });
  }

  if (stages.length === 0) return null;

  return {
    id:         folderName.toLowerCase().replace(/\s+/g, '-'),
    name,
    location,
    bio:        meta.bio        || '',
    nationality:meta.nationality|| '',
    stages,
    // Dialogue arrays — fall back to empty arrays so DialogueManager stays safe.
    dialoguefold:     meta.dialoguefold     || [],
    dialoguewinhand:  meta.dialoguewinhand  || [],
    dialoguewinfinal: meta.dialoguewinfinal || [],
    handdialogue:     meta.handdialogue     || {}
  };
}

/** Return the FileSystemFileHandle for the first image in a folder, or null. */
async function _findFirstImage(dirHandle) {
  const entries = [];
  for await (const [ename, ehandle] of dirHandle.entries()) {
    if (ehandle.kind === 'file') {
      const ext = ename.split('.').pop().toLowerCase();
      if (IMAGE_EXTS.has(ext)) entries.push({ name: ename, handle: ehandle });
    }
  }
  if (entries.length === 0) return null;
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return entries[0].handle;
}

async function _readJson(fileHandle) {
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}
