# Photoshop Script: Paste or Place Inside Selection.jsx

The scripts helps you paste or place images using fit and fill methods.

# Usage

You got 2 starting points...

1. **[Selection method (gif)](readme-images/active-layer-method.gif):** If you have an active marquee selection in the document, the image is placed inside the selection on a new layer.
2. **[Active layer method (gif)](readme-images/selection-method.gif):** ...otherwise the image is placed in a new layer and placed in a clipping mask with the active layer.
    - If you want to place inside an existing clipping mask, you can select any layer that is part of that clipping mask. The new image will be placed on top of that stack.

Both of these gifs have an outdated dialog, but otherwise it works just the same. I should make new gifs...

## "Known issues"

- The script doesn't care if your image is going to be upsized. So you have to be aware that if you place a 16x16px icon into a 900x900px area, you're going to have issues with image quality.
    - I have always wanted add a `Don't upsize` option, just haven't got around to adding it. Or I guess it could be called `Only shrink`... or `Don't enlarge`.
- Right now the `active layer method` doesn't work with the background layer if it's locked. There's no reason why it couldn't  be made to work, but since I can unlock the bg layer before running the script or make a selection covering the whole document `Cmd+A`... it hasn't really felt like an important addition.
- You can paste vector graphics from Illustrator, but it's rasterized on import.
- Not really an issue, but the fit option is set to clip off a little bit on all sides in order to avoid bleedthrough due to anti-aliasing. So if you're placing icons with fit, you likely want to disable the layer mask (`Shift` click the thumbnail).

## Good to know...
- Tested in PS CC 2019
- You should definitely set a shortcut to launch this script or otherwise it'll be too difficult to use frequently.
- Numbers from 1 to 4 can be used as shortcuts in the dialog. I should probably renew the dialog once more. I still sometimes get confused which buttons are for fill and which are for fit. The old dialog was a bit better in that sense...
- Also `Spacebar` triggers place and `Enter` triggers paste.
- The old name was "Place Inside Selection.jsx".
