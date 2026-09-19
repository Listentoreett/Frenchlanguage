# Free Audio Sources And Licensing

This repo avoids Google Translate audio URLs because they are not stable course assets and are not a clear reusable audio source.

Use local files in `assets/audio/` when you can verify the license. Track every file in `assets/audio/manifest.example.csv` or a copied `manifest.csv`.

## Recommended Sources

| Source | Best for | License notes |
| --- | --- | --- |
| [Wikimedia Commons](https://commons.wikimedia.org/) | individual words and some phrases | check each file page; many are public domain, CC BY, or CC BY-SA |
| [Lingua Libre](https://lingualibre.org/) | human pronunciation recordings | commonly CC BY-SA 4.0 through Wikimedia Commons |
| [Mozilla Common Voice](https://commonvoice.mozilla.org/en/datasets) | open speech corpus | dataset material is intended for public-domain speech data; verify the specific release terms |
| Your own recordings | exact phrases from this course | safest if the speaker gives permission and you document it |

## Audio Workflow

1. Search for the French word or phrase on Wikimedia Commons or Lingua Libre.
2. Download only files with a free license you can comply with.
3. Rename files predictably, for example `bonjour-fr-paris.ogg`.
4. Put them in `assets/audio/`.
5. Add a row to `assets/audio/manifest.csv`.
6. Add `audioFile` to the matching phrase in `data/phrases.js`.

Example:

```js
{
  id: "bonjour",
  french: "Bonjour",
  audioFile: "bonjour-fr-paris.ogg"
}
```

## Attribution Checklist

For every downloaded file, record:

- phrase or word.
- local filename.
- source URL.
- author or speaker name if provided.
- license.
- date downloaded.
- any required attribution text.

If the license is unclear, do not use the file.
