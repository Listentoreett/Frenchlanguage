# Audio Assets

Put optional free-licensed French recordings in this folder.

The pronunciation coach works without local audio by using browser speech synthesis. Human recordings are better for accuracy when you can legally reuse them.

Steps:

1. Run `npm run fetch-audio` for the vetted starter files in `data/audio-sources.json`, or download a free-licensed file from Wikimedia Commons, Lingua Libre, Common Voice, or your own recordings.
2. Save it here with a clear filename.
3. Copy `manifest.example.csv` to `manifest.csv`.
4. Add attribution and license details to `manifest.csv`.
5. Add the filename to the matching phrase in `data/phrases.js` as `audioFile`.

Do not add audio files with unclear licensing.
