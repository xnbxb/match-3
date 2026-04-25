/**
 * mock-scenes.js
 * --------------
 * Hardcoded scene definitions used during development.
 * When real folder/JSON loading is implemented, replace this module's
 * export with data loaded from the user's chosen parent directory.
 *
 * Shape mirrors the real JSON spec:
 * {
 *   id, name, location, bio, nationality,
 *   stages: [ { label, color } ],   // placeholder: real stages will be image paths
 *   dialoguefold, dialoguewinhand, dialoguewinfinal,
 *   handdialogue: { "1": [], "2": [], "3": [] }
 * }
 */

export const MOCK_SCENES = [
  {
    id: 'jane-bedroom',
    name: 'Jane',
    location: 'Bedroom',
    bio: 'A bookish homebody who hides a mischievous streak behind horn-rimmed glasses.',
    nationality: 'US',
    // Placeholder stage colors standing in for real image paths.
    // Replace `color` with `imagePath` when hooking up real folders.
    stages: [
      { label: 'Stage 1', color: '#4a4e69' },
      { label: 'Stage 2', color: '#6b4f7a' },
      { label: 'Stage 3', color: '#9b5e82' },
      { label: 'Stage 4', color: '#c96f84' },
    ],
    dialoguefold: [
      "Oh, you actually want to play? Interesting.",
      "Don't get too comfortable over there."
    ],
    dialoguewinhand: [
      "Hmm. Not bad.",
      "Lucky move."
    ],
    dialoguewinfinal: [
      "I... didn't expect that. Well played."
    ],
    handdialogue: {
      "1": ["Just getting warmed up.", "Eyes on the board."],
      "2": ["You're better than you look.", "Starting to sweat a little."],
      "3": ["Okay, okay. You're good.", "Fine. I'm impressed."]
    }
  },
  {
    id: 'jane-beach',
    name: 'Jane',
    location: 'Beach',
    bio: 'Sun, sand, and a very different side of Jane.',
    nationality: 'US',
    stages: [
      { label: 'Stage 1', color: '#1d6a8a' },
      { label: 'Stage 2', color: '#1a8fa0' },
      { label: 'Stage 3', color: '#17a8b0' },
      { label: 'Stage 4', color: '#14c4c0' },
    ],
    dialoguefold: [
      "The ocean breeze makes me generous. Don't push it.",
      "Salt air, sunshine, and a match-3 rematch. Perfect day."
    ],
    dialoguewinhand: [
      "The waves must be cheering for you.",
      "I'll blame the sun in my eyes."
    ],
    dialoguewinfinal: [
      "Okay, the beach version of me admits defeat. Happy?"
    ],
    handdialogue: {
      "1": ["Nice start.", "Watch the tide turn."],
      "2": ["You're on a roll.", "The board's heating up."],
      "3": ["Alright, you've earned this.", "Unbelievable."]
    }
  }
];

/** Returns the first mock scene by default. Swap with real loader later. */
export function getDefaultScene() {
  return MOCK_SCENES[0];
}
