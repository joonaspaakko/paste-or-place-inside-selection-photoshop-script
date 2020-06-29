# Photoshop Script: Paste or Place Inside Selection.jsx

The scripts helps you paste or place images using fit and fill methods. Example gifs below [usage](#usage).

![](readme-images/paste-or-place-inside-selection-dialog.png)

## Usage

The script has two starting points for different situations:

1. **[Selection method (gif)](readme-images/selection-method.gif):** If you have an active marquee selection in the document, the image is placed inside the selection on a new layer.
2. **[Active layer method (gif)](readme-images/active-layer-method.gif):** If you don't have an active marquee selection, the image is placed in a new layer and placed in a clipping mask with the active layer.
  - If you want to place inside an existing clipping mask, you can select any layer that is part of that clipping mask. The new image will be placed on top of that stack.

Both of these gifs have an outdated dialog, but otherwise it works just the same. I should make new gifs...

## Known issues
- If the base layer of a clipping mask is hidden, the script will fail. It's related to detecting the "bounds" of the clipping mask. This could be improved, but I don't think that is much of an issue, so I have no plans to fix it. The active layer can be hidden as long as it's not already in a clipping mask though.

## Good to know...
- Only tested in PS CC
- There is a feature where the current layer size (in percentages) is appended to the layer name.
  - The variable that controls this is called "changeLayerName". Default value: "always".
  - Optional values: 'upsize prevented', 'never'
- You should definitely set a shortcut to launch this script or otherwise it'll be too difficult to use frequently.
- The old name was "Place Inside Selection.jsx".
