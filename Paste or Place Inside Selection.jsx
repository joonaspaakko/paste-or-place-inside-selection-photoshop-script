// Paste or Place Inside Selection.jsx
// https://gist.github.com/joonaspaakko/e1b67f3762e60200601b6c18dbe4223e
// Version: 0.2.

// Place or paste image inside a selection. If a selection exists, a new layer is created automatically. If there is no selection, the new image forms a clipping mask with the currently active layer. Or if the active layer is part of a clipping mask, the new image is just added at the top of the stack. 
// Usage examples: https://gist.github.com/joonaspaakko/e1b67f3762e60200601b6c18dbe4223e#gistcomment-2678485

// Changelog:

// ********* V.0.2. *********
// - Tested in PS CC 2019
// - Renewed dialog. Numbers from 1 to 4 can be used as shortcuts.
// - Space used to trigger paste and enter used to trigger place, but not it's reversed.
// - Name changed from "Place Inside Selection.jsx" to "Paste or Place Inside Selection.jsx"

// ********* V.0.1. *********
// - First version
// - Written for PS CC 2018
// - Images are placed as Smart Objects and resized to the size of your selection.
// - Does not respect the original size of your image in the sense that if you place your image into a selection that is bigger than the image, it will ruthlessly upsize it the size of the selection.

var method = null;
var fit_or_fill = null;
var clipboardEmpty = false;
var hasSelection = selectionExists();
var tempChannelName = 'Temp Channel - 0123456789';

// Writes one history state....
app.activeDocument.suspendHistory("Place Inside Selection.jsx", "init()");

function init() {
  
  // Place options
  dialog();
  
  
  // Don't continue if user cancelled using ESC
  if ( method != null ) {
    
    var image;
    
    // If PLACE was the chosen method, open up "browse" dialog to find a file to place.
    if ( method === 'place' ) {
      image = File.openDialog( 'Open input image...' );
    }
    // If PASTE was the chosen method, test clipboard...
    else {
      image = "clipboard";
      clipboardEmpty = testClipboard();
    }
    
    // Don't continue if user cancels the "browse" dialog or if the clipboard is empty
    if ( image != null && !clipboardEmpty ) {
      main( image );
    }
    else {
      alert( 'Paste failed \nMake sure you have an image in your clipboard and try again...' );
    }
    
  }
  
} // init();

function main( image ) {

  var doc = app.activeDocument,
			activeLayer = doc.activeLayer,
      rulerUnits = app.preferences.rulerUnits;
  
  app.preferences.rulerUnits = Units.PIXELS;
  
  // Could be a layer or a selection
  var target = getTargetBounds( doc, activeLayer );
  
  if ( hasSelection ) {
    saveSelection( doc );
  }
  
  if ( image === "clipboard" ) {
    pasteIMG( doc, activeLayer, image, target.width, target.height );
  }
  else {
    placeIMG( doc, activeLayer, image, target.width, target.height );
  }
  
  resizeIMG( doc.activeLayer, target.width, target.height );
  // align( [layerToAlign], [targetBounds] );
  align( doc.activeLayer, target.bounds );
  
  // Wrap it up....
  // When there is a selection, we add a Layer Mask to the image.
  if ( hasSelection ) {
    
    loadSelection( doc );
    
    // Add Layers Mask
    // =======================================================
    var idMk = charIDToTypeID( "Mk  " );
        var desc437 = new ActionDescriptor();
        var idNw = charIDToTypeID( "Nw  " );
        var idChnl = charIDToTypeID( "Chnl" );
        desc437.putClass( idNw, idChnl );
        var idAt = charIDToTypeID( "At  " );
            var ref249 = new ActionReference();
            var idChnl = charIDToTypeID( "Chnl" );
            var idChnl = charIDToTypeID( "Chnl" );
            var idMsk = charIDToTypeID( "Msk " );
            ref249.putEnumerated( idChnl, idChnl, idMsk );
        desc437.putReference( idAt, ref249 );
        var idUsng = charIDToTypeID( "Usng" );
        var idUsrM = charIDToTypeID( "UsrM" );
        var idRvlS = charIDToTypeID( "RvlS" );
        desc437.putEnumerated( idUsng, idUsrM, idRvlS );
    executeAction( idMk, desc437, DialogModes.NO );
    
  }
  // When there is no selection, a clipping mask is used and both layers are selected.
  else {
    // When there aren't any existing layers in a clipping mask:
    if ( !doc.activeLayer.grouped ) doc.activeLayer.grouped = true;
  }

  // Reset ruler units
  app.preferences.rulerUnits = rulerUnits;
  
} // main();

function loadSelection( doc ) {
	doc.selection.load( doc.channels[ tempChannelName ], SelectionType.REPLACE );
  doc.channels[ tempChannelName ].remove();
}

function saveSelection( doc ) {
	var channels = doc.channels;
  var tempChannel = channels.add();
	tempChannel.kind = ChannelType.SELECTEDAREA;
	tempChannel.name = tempChannelName;
	doc.selection.store( channels[ tempChannelName ], SelectionType.REPLACE );
  // Reselects RGB channels
  doc.activeChannels = [ channels["Red"], channels["Green"], channels["Blue"] ];
  doc.selection.deselect();
}

function testClipboard() {
  
  var cEmpty = false,
      tempDoc = app.documents.add();
      
  try {
    
    // Paste
    // =======================================================
    var idpast = charIDToTypeID( "past" );
        var desc1408 = new ActionDescriptor();
        var idAntA = charIDToTypeID( "AntA" );
        var idAnnt = charIDToTypeID( "Annt" );
        var idAnno = charIDToTypeID( "Anno" );
        desc1408.putEnumerated( idAntA, idAnnt, idAnno );
        var idAs = charIDToTypeID( "As  " );
        var idPxel = charIDToTypeID( "Pxel" );
        desc1408.putClass( idAs, idPxel );
    executeAction( idpast, desc1408, DialogModes.NO );
    
  } catch(e) { cEmpty = true; }
  
  tempDoc.close( SaveOptions.DONOTSAVECHANGES );
  
  return cEmpty;
  
}

function pasteIMG( doc, activeLayer, image ) {
  
  // Paste
  // =======================================================
  var idpast = charIDToTypeID( "past" );
      var desc1408 = new ActionDescriptor();
      var idAntA = charIDToTypeID( "AntA" );
      var idAnnt = charIDToTypeID( "Annt" );
      var idAnno = charIDToTypeID( "Anno" );
      desc1408.putEnumerated( idAntA, idAnnt, idAnno );
      var idAs = charIDToTypeID( "As  " );
      var idPxel = charIDToTypeID( "Pxel" );
      desc1408.putClass( idAs, idPxel );
  executeAction( idpast, desc1408, DialogModes.NO );
  
  // Convert pasted image into a Smart Object
  var idnewPlacedLayer = stringIDToTypeID( "newPlacedLayer" );
  executeAction( idnewPlacedLayer, undefined, DialogModes.NO );
  doc.activeLayer.name = "[Pasted Image]";
  
}

function placeIMG( doc, activeLayer, image ) {

  // =======================================================
  var idPlc = charIDToTypeID( "Plc " );
      var desc637 = new ActionDescriptor();
      var idIdnt = charIDToTypeID( "Idnt" );
      desc637.putInteger( idIdnt, 62 );
      var idnull = charIDToTypeID( "null" );
      desc637.putPath( idnull, new File( image ) );
      var idFTcs = charIDToTypeID( "FTcs" );
      var idQCSt = charIDToTypeID( "QCSt" );
      var idQcsa = charIDToTypeID( "Qcsa" );
      desc637.putEnumerated( idFTcs, idQCSt, idQcsa );
      var idOfst = charIDToTypeID( "Ofst" );
          var desc638 = new ActionDescriptor();
          var idHrzn = charIDToTypeID( "Hrzn" );
          var idPxl = charIDToTypeID( "#Pxl" );
          desc638.putUnitDouble( idHrzn, idPxl, 0.000000 );
          var idVrtc = charIDToTypeID( "Vrtc" );
          var idPxl = charIDToTypeID( "#Pxl" );
          desc638.putUnitDouble( idVrtc, idPxl, -0.000000 );
      var idOfst = charIDToTypeID( "Ofst" );
      desc637.putObject( idOfst, idOfst, desc638 );
  executeAction( idPlc, desc637, DialogModes.NO );
  
}

function resizeIMG( imageLayer, target_width, target_height ) {
  
  // Small padding to help with anti-aliasing
  target_width = target_width + 2;
  target_height = target_height + 2;
  
  // Round 1#
  var bounds = imageLayer.boundsNoEffects;
  var image_width = bounds[2].value - bounds[0].value;
  var image_height = bounds[3].value - bounds[1].value;
  var newSize = (100 / image_width) * target_width;
  imageLayer.resize( newSize, newSize, AnchorPosition.MIDDLECENTER );
  
  // Round 2# ...if it is needed
  var bounds = imageLayer.boundsNoEffects;
  var image_width = bounds[2].value - bounds[0].value;
  var image_height = bounds[3].value - bounds[1].value;
  
  if (
    (fit_or_fill === 'fill' && image_height < target_height) ||
    (fit_or_fill === 'fit' && image_height > target_height)
  ) {
    var newSize = (target_height / image_height) * 100;
    imageLayer.resize( newSize, newSize, AnchorPosition.MIDDLECENTER );
  }
  
}

function getTargetBounds( doc, activeLayer ) {
	
	// Set selection as false, if bounds are not found.
	var bounds;
	if ( hasSelection ) {
		bounds = doc.selection.bounds;
	}
	else {
    var clippingMaskBase = findClippingMask( doc, activeLayer );
    // var clippingMaskBase = addToClippingMask( doc, activeLayer );
    if ( clippingMaskBase !== false ) {
      bounds = clippingMaskBase.boundsNoEffects;
    }
    else {
      bounds = activeLayer.boundsNoEffects;
    }
	}
  
	var width = bounds[2].value - bounds[0].value;
	var height = bounds[3].value - bounds[1].value;
  
	return {
    bounds: bounds,
    width: bounds[2].value - bounds[0].value,
    height: bounds[3].value - bounds[1].value,
  };
  
}

function align( imageLayer, targetBounds ) {

  var imageBounds = imageLayer.boundsNoEffects;
  
  var image = {
    offset: {
      top: imageBounds[1].value,
      right: imageBounds[2].value,
      bottom: imageBounds[3].value,
      left: imageBounds[0].value,
    },
  };
  var target = {
    offset: {
      top: targetBounds[1].value,
      right: targetBounds[2].value,
      bottom: targetBounds[3].value,
      left: targetBounds[0].value,
    },
  };
  
  var image_width = image.offset.right - image.offset.left;
  var image_height = image.offset.bottom - image.offset.top;
  
  var target_width = target.offset.right - target.offset.left;
  var target_height = target.offset.bottom - target.offset.top;
  
  var translateX = target.offset.left - image.offset.left - ( image_width/2 ) + ( target_width/2 );
  var translateY = target.offset.top - image.offset.top - ( image_height/2 ) + ( target_height/2 );
  imageLayer.translate( translateX, translateY );
  
}

function selectionExists() {
	
	var selection = false;
	try { selection = app.activeDocument.selection.bounds; } catch(e) {}
	
	return selection;
	
}

// Returns the base layer in a clipping mask
function findClippingMask( doc, layer ) {
	
  // Layer is in a clipping mask...
	if ( layer.grouped ) {
		
		while ( doc.activeLayer.grouped ) {
      selectLayer('below');
    }
		var clippingMaskBase = doc.activeLayer;
    
    app.runMenuItem( stringIDToTypeID('groupLayersEvent') );
    var tempGroup = doc.activeLayer;
    var newLayer = doc.artLayers.add();
    newLayer.move( tempGroup, ElementPlacement.INSIDE);
    newLayer.grouped = true;
    doc.activeLayer = tempGroup;
		app.runMenuItem( stringIDToTypeID('ungroupLayersEvent') );
    doc.activeLayer = newLayer;

    return clippingMaskBase;
		
	}
  // Layer is not in a clipping mask... but it could still be the base layer of a clipping mask
	else if ( !layer.grouped ) {
		
    app.runMenuItem( stringIDToTypeID('groupLayersEvent') );
		
		var tempGroup = doc.activeLayer,
				tempGroupLayers = tempGroup.layers,
				tempGroupLayersLength = tempGroupLayers.length;
		
    // When you group clipping mask base layer, it groups all the layers in that clipping mask.
    // So if the newly created group has more than one layer, the first active layer or the first layer of that group is the base layer.
		if ( tempGroupLayersLength > 1 ) {
			var clippingMaskBase = tempGroupLayers[ tempGroupLayersLength - 1 ];
			var newLayer = doc.artLayers.add();
			newLayer.move( tempGroup, ElementPlacement.INSIDE);
      newLayer.grouped = true;
      doc.activeLayer = tempGroup;
			app.runMenuItem( stringIDToTypeID('ungroupLayersEvent') );
			doc.activeLayer = newLayer;
			
			return clippingMaskBase;
			
		}
    // False alarm... No clipping masks here.
		else {
			app.runMenuItem( stringIDToTypeID('ungroupLayersEvent') );
			return false;
		}
		
	}

}

function selectLayer( direction ) {

  direction = charIDToTypeID( direction === 'above' ? "Frwr" : "Bckw" );

  try {
    // =======================================================
    var idslct = charIDToTypeID( "slct" );
    var desc4110 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var ref750 = new ActionReference();
    var idLyr = charIDToTypeID( "Lyr " );
    var idOrdn = charIDToTypeID( "Ordn" );
    ref750.putEnumerated( idLyr, idOrdn, direction );
    desc4110.putReference( idnull, ref750 );
    var idMkVs = charIDToTypeID( "MkVs" );
    desc4110.putBoolean( idMkVs, false );
    var idLyrI = charIDToTypeID( "LyrI" );
    var list325 = new ActionList();
    list325.putInteger( 22 );
    desc4110.putList( idLyrI, list325 );
    executeAction( idslct, desc4110, DialogModes.NO );
  } catch (e) {}

}

function dialog() {
  
	/*
	Code for Import https://scriptui.joonas.me — (Triple click to select):
	{"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Place into selection.jsx","preferredSize":[0,0],"margins":24,"orientation":"column","spacing":10,"alignChildren":["center","top"]}},"item-1":{"id":1,"type":"Button","parentId":0,"style":{"text":"2. Paste / Fit","justify":"center","preferredSize":[0,0],"alignment":null}},"item-2":{"id":2,"type":"Button","parentId":0,"style":{"text":"1. Paste / Fill","justify":"center","preferredSize":[0,0],"alignment":null}},"item-3":{"id":3,"type":"Divider","parentId":0,"style":false},"item-4":{"id":4,"type":"Button","parentId":0,"style":{"text":"3. Place / Fill","justify":"center","preferredSize":[0,0],"alignment":null}},"item-5":{"id":5,"type":"Button","parentId":0,"style":{"text":"4. Place / Fit","justify":"center","preferredSize":[0,0],"alignment":null}}},"order":[0,2,1,3,4,5],"activeId":1}
	*/

	// DIALOG
	// ======
	var dialog = new Window("dialog");
	    dialog.text = "Place into selection.jsx";
	    dialog.orientation = "column";
	    dialog.alignChildren = ["center","top"];
	    dialog.spacing = 10;
	    dialog.margins = 24;

	var button1 = dialog.add("button", undefined, 'pasteFill', {name: "ok"});
	    button1.text = "1. Paste / Fill";
	    button1.justify = "center";

	var button2 = dialog.add("button", undefined, 'pasteFit', {name: "ok1"});
	    button2.text = "2. Paste / Fit";
	    button2.justify = "center";

	var divider1 = dialog.add("panel");
	    divider1.alignment = "fill";

	var button3 = dialog.add("button", undefined, 'placeFill', {name: "ok3"});
	    button3.text = "3. Place / Fill";
	    button3.justify = "center";
      button3.active = true;

	var button4 = dialog.add("button", undefined, 'placeFit', {name: "ok4"});
	    button4.text = "4. Place / Fit";
	    button4.justify = "center";

	// CUSTOM EVENTS
  dialog.addEventListener ("keyup", function( key ) {
    if ( key.keyName == 1 ) {
      button1.onClick();
    }
    else if ( key.keyName == 2 ) {
      button2.onClick();
    }
    else if ( key.keyName == 3 ) {
      button3.onClick();
    }
    else if ( key.keyName == 4 ) {
      button4.onClick();
    }
  });
	
  // PASTE FILL
  button1.onClick = function () {
    method = 'paste';
    fit_or_fill = 'fill';
    dialog.close();
  }
  // PASTE FIT
  button2.onClick = function () {
    method = 'paste';
    fit_or_fill = 'fit';
    dialog.close();
  }
  // PLACE FILL
  button3.onClick = function () {
    method = 'place';
    fit_or_fill = 'fill';
    dialog.close();
  }
  // PLACE FILL
  button4.onClick = function () {
    method = 'place';
    fit_or_fill = 'fit';
    dialog.close();
  }
  
  dialog.show();
	
}
