/**
 * GalleryLoader.js
 * ----------------
 * Reads a user-selected parent folder (via Chrome's File System Access API)
 * and normalises its sub-folders into scene objects the rest of the game
 * already understands.
 *
 * EXPECTED FOLDER STRUCTURE:
 *   <parent>/
 *     Jane - Bedroom/
 *       scene.json          <- metadata & dialogue (optional)
 *       01/                 <- stage folders, sorted by name
 *         image.jpg
 *       02/
 *         image.jpg
 *     Jane - Beach/
 *       ...
 *
 * OUTPUT - array of scene objects matching the existing mock-scenes shape:
 *   {
 *     id, name, location, bio, nationality,
 *     stages: [ { label, objectURL } ],   <- objectURL replaces mock `color`
 *     dialoguefold, dialoguewinhand, dialoguewinfinal, handdialogue
 *   }
 *
 * Call GalleryLoader.revokeAll() when scenes are no longer needed.
 */

var IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
var JSON_NAMES = ['scene.json', 'meta.json', 'info.json'];

/**
 * Open a directory picker and return normalised scene data.
 * Resolves to an array of scene objects, or [] if the user cancels.
 *
 * @returns {Promise<Array>}
 */
export async function pickAndLoadGallery() {
  var dirHandle;
  try {
    dirHandle = await window.showDirectoryPicker({ mode: 'read' });
  } catch (e) {
    // User cancelled or permission denied
    return [];
  }
  return _loadFromDirectoryHandle(dirHandle);
}

// Track created object URLs so we can revoke them to free memory.
var _activeURLs = [];

/** Revoke all object URLs created by this loader. */
export function revokeAll() {
  _activeURLs.forEach(function(url) { URL.revokeObjectURL(url); });
  _activeURLs.length = 0;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function _loadFromDirectoryHandle(parentHandle) {
  var scenes = [];
  var entries = await _collectEntries(parentHandle);

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.handle.kind !== 'directory') continue;
    if (entry.name.startsWith('.')) continue;

    var scene = await _loadSceneFolder(entry.name, entry.handle);
    if (scene) scenes.push(scene);
  }

  scenes.sort(function(a, b) { return a.id.localeCompare(b.id); });
  return scenes;
}

async function _loadSceneFolder(folderName, dirHandle) {
  var dashIndex = folderName.indexOf(' - ');
  var name      = dashIndex >= 0 ? folderName.slice(0, dashIndex).trim()  : folderName;
  var location  = dashIndex >= 0 ? folderName.slice(dashIndex + 3).trim() : '';

  var meta         = {};
  var stageFolders = [];
  var entries      = await _collectEntries(dirHandle);

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.handle.kind === 'file') {
      if (JSON_NAMES.indexOf(entry.name.toLowerCase()) !== -1) {
        meta = await _readJson(entry.handle);
      }
    } else if (entry.handle.kind === 'directory' && !entry.name.startsWith('.')) {
      stageFolders.push({ name: entry.name, handle: entry.handle });
    }
  }

  if (stageFolders.length === 0) return null;

  stageFolders.sort(function(a, b) {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  var stages = [];
  for (var j = 0; j < stageFolders.length; j++) {
    var sf     = stageFolders[j];
    var imgFile = await _findFirstImage(sf.handle);
    if (!imgFile) continue;
    var blob = await imgFile.getFile();
    var url  = URL.createObjectURL(blob);
    _activeURLs.push(url);
    stages.push({ label: sf.name, objectURL: url });
  }

  if (stages.length === 0) return null;

  return {
    id:           folderName.toLowerCase().replace(/\s+/g, '-'),
    name:         name,
    location:     location,
    bio:          meta.bio         || '',
    nationality:  meta.nationality || '',
    stages:       stages,
    dialoguefold:     meta.dialoguefold     || [],
    dialoguewinhand:  meta.dialoguewinhand  || [],
    dialoguewinfinal: meta.dialoguewinfinal || [],
    handdialogue:     meta.handdialogue     || {}
  };
}

/** Collect all entries in a directory handle as a plain array. */
async function _collectEntries(dirHandle) {
  var result = [];
  for await (var pair of dirHandle.entries()) {
    result.push({ name: pair[0], handle: pair[1] });
  }
  return result;
}

/** Return the FileSystemFileHandle for the first image in a folder, or null. */
async function _findFirstImage(dirHandle) {
  var entries = await _collectEntries(dirHandle);
  var images  = entries.filter(function(e) {
    if (e.handle.kind !== 'file') return false;
    var ext = e.name.split('.').pop().toLowerCase();
    return IMAGE_EXTS.indexOf(ext) !== -1;
  });
  if (images.length === 0) return null;
  images.sort(function(a, b) {
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
  return images[0].handle;
}

async function _readJson(fileHandle) {
  try {
    var file = await fileHandle.getFile();
    var text = await file.text();
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
}
