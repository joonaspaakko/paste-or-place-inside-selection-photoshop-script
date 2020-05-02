// Paste or Place Inside Selection.jsx
// Version: 0.5.
// https://github.com/joonaspaakko/paste-or-place-inside-selection-photoshop-script

// Changelog:

// ********* V.0.5. *********
// - Tested in PS CC 2020 (21.0.2)
// - Fixed and issue that would cause the layer name suffix percentage to be a little off when placing images. Forgot to initiate some code in the last release.
// - Made a small change where the layer name suffix percentage doesn't get the tilde: ~ character if the image size doesn't change.

// ********* V.0.4. *********
// - Tested in PS CC 2020 (21.0.2)
// - I fixed an issue where the script would sometimes fail to resize properly
// - Added a new feature that shows the current layer size in percentages by appending it to the layer name.
//    - The variable that controls this is called "changeLayerName"
//    - Default value: "always"
//    - Optional values: 'upsize prevented', 'never'

// ********* V.0.3. *********
// - Tested in PS CC 2019 (20.0.4)
// - Added a new option: "Don't upsize past original size"
// - Now works in all of the _possible_ color modes. I realized that
//   this script could only be used in RGB color mode due to the way I
//   deselected temp channel by activating red + green + blue channels.
// - Fixed a thing where you got a "Paste failed" alert when canceling the open dialog.
// - Change: Only fill will add extra 2px in to the target
//   size. It's to account for anti-aliasing / bleedthrough.
//   I think it doesn't matter as much when fitting.
// - Change: You no longer need to make a selection before pasting or placing
//   image on top of it. It's automatically changed into a normal layer.

// ********* V.0.2. *********
// - Tested in PS CC 2019
// - Renewed dialog. Numbers from 1 to 4 can be used as shortcuts.
// - Spacebar used to trigger paste and enter used to trigger place, but now it's reversed.
// - Name changed from "Place Inside Selection.jsx" to "Paste or Place Inside Selection.jsx"

// ********* V.0.1. *********
// - First version
// - Written for PS CC 2018
// - Images are placed as Smart Objects and resized to the size of your selection.
// - Does not respect the original size of your image in the sense
//   that if you place your image into a selection that is bigger than
//   the image, it will ruthlessly upsize it the size of the selection.

// OPTION!
var changeLayerName = 'always' // values: 'always', 'upsize prevented', 'never'

var method = null;
var fit_or_fill = null;
var noUpsize = false;
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
    
    var imageSrc;
      
    // If PLACE was the chosen method, open up "browse" dialog to find a file to place.
    if ( method === 'place' ) {
      imageSrc = File.openDialog( 'Open input image...' );
    }
    // If PASTE was the chosen method, test clipboard...
    else {
      imageSrc = "clipboard";
      clipboardEmpty = testClipboard();
    }
    
    // Don't continue if user cancels the "browse" dialog or if the clipboard is empty
    if (
      (imageSrc == "clipboard" && !clipboardEmpty) ||
      (imageSrc != undefined && imageSrc != null && imageSrc != "clipboard")
    ) {
      main( imageSrc );
    }

    if ( clipboardEmpty ) {
      alert( 'Paste failed \nMake sure you have an image in your clipboard and try again...' );
    }
    
  }
  
} // init();

function main( imageSrc ) {
  
  var doc = app.activeDocument,
			activeLayer = doc.activeLayer,
      rulerUnits = app.preferences.rulerUnits;
  
  app.preferences.rulerUnits = Units.PIXELS;
  
  if ( !hasSelection ) {
    // Turn background layer into a normal layer
    if ( doc.activeLayer.isBackgroundLayer ) { doc.activeLayer.isBackgroundLayer = false; }
  }
  
  // Could be a layer or a selection
  var target = getTargetBounds( doc, activeLayer );
  
  if ( hasSelection ) {
    saveSelection( doc );
  }
  
  if ( imageSrc === "clipboard" ) {
    pasteIMG( doc, activeLayer, imageSrc, target.width, target.height );
  }
  else {
    placeIMG( doc, activeLayer, imageSrc, target.width, target.height );
  }
  
  resizeIMG( doc.activeLayer, target.width, target.height, imageSrc );
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

  // Select default channels
  var prevActive = doc.activeLayer;
  var tempLayer = doc.artLayers.add(); tempLayer.remove();
  doc.activeLayer = prevActive;
  
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
  // Select default channels
  var prevActive = doc.activeLayer;
  var tempLayer = doc.artLayers.add(); tempLayer.remove();
  doc.activeLayer = prevActive;
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

function pasteIMG( doc, activeLayer, imageSrc ) {
  
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

function placeIMG( doc, activeLayer, imageSrc ) {
  
  // Makes sure the placed image size is not constrained by the document.
  var resizeImageOnPlaceSetting = getOptionResizeImageDuringPlace();
  resizeImageDuringPlace(false);
  
  // =======================================================
  var idPlc = charIDToTypeID( "Plc " );
      var desc637 = new ActionDescriptor();
      var idIdnt = charIDToTypeID( "Idnt" );
      desc637.putInteger( idIdnt, 62 );
      var idnull = charIDToTypeID( "null" );
      desc637.putPath( idnull, new File( imageSrc ) );
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
  
  resizeImageDuringPlace( resizeImageOnPlaceSetting );
  
}

// Preferences > General (Cmd+K) > [ ] Resize Image During Plage
function resizeImageDuringPlace( optParam ) {
  var descPreferences = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putProperty( charIDToTypeID('Prpr'), charIDToTypeID('GnrP') );
  ref.putEnumerated( charIDToTypeID('capp'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
  descPreferences.putReference( charIDToTypeID('null'), ref );
  var descSetting = new ActionDescriptor();
  descSetting.putBoolean( stringIDToTypeID('resizePastePlace'), optParam );
  descPreferences.putObject( charIDToTypeID('T   '), charIDToTypeID('GnrP'), descSetting );
  executeAction( charIDToTypeID('setd'), descPreferences, DialogModes.NO );
}

// Preferences > General (Cmd+K) > [ ] Resize Image During Plage
function getOptionResizeImageDuringPlace() {
  var ref = new ActionReference();
  ref.putEnumerated( charIDToTypeID("capp"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") );
  var desc = executeActionGet(ref).getObjectValue( stringIDToTypeID('generalPreferences') );
  return desc.getBoolean( stringIDToTypeID('resizePastePlace') ) == 0 ? false : true;
}

function resizeIMG( imageLayer, target_width, target_height, imageSrc ) {
  
  // Small padding to help with anti-aliasing
  target_width  = target_width + ( fit_or_fill === 'fill' ? 2 : 0 );
  target_height = target_height + ( fit_or_fill === 'fill' ? 2 : 0 );
  var targetSize = [ target_width, target_height ];
  
  var bounds       = imageLayer.boundsNoEffects;
  var image_width  = bounds[2].value - bounds[0].value;
  var image_height = bounds[3].value - bounds[1].value;
  
  // This section normalizes placed images with a different resolution
  if ( imageSrc !== "clipboard" ) {
    
    var dispDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;
    
    var documentIdBefore = app.activeDocument.id;
    var documentsLengthBefore = app.documents.length;
    // =======================================================
    var idOpn = charIDToTypeID( "Opn " );
    var desc379 = new ActionDescriptor();
    var iddontRecord = stringIDToTypeID( "dontRecord" );
    desc379.putBoolean( iddontRecord, false );
    var idforceNotify = stringIDToTypeID( "forceNotify" );
    desc379.putBoolean( idforceNotify, false );
    var idnull = charIDToTypeID( "null" );
    desc379.putPath( idnull, new File( imageSrc ) );
    var idDocI = charIDToTypeID( "DocI" );
    desc379.putInteger( idDocI, 430 );
    executeAction( idOpn, desc379, DialogModes.NO );
    // Ended up using the code above that opens the file since that suppresses dialogs...
    // executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO );
    var tempDoc = app.activeDocument;
    var tempDocSize = [ tempDoc.width.as('px'), tempDoc.height.as('px')];
    
    
    var documentIdAfter = app.activeDocument.id;
    var documentsLengthAfter = app.documents.length;
    var fileAlreadyOpen = documentsLengthBefore === documentsLengthAfter;
    if ( fileAlreadyOpen ) {
      activateDocumentByID( documentIdBefore );
    }
    else  {
      app.activeDocument.close( SaveOptions.DONOTSAVECHANGES );
    }
    
    app.displayDialogs = dispDialogs;
    
    var bounds       = app.activeDocument.activeLayer.boundsNoEffects;
    var placedWidth  = bounds[2].value - bounds[0].value;
    var placedHeight = bounds[3].value - bounds[1].value;
    
    var eqSize = calculateNewSize( [placedWidth, placedHeight], tempDocSize).percentage[ fit_or_fill ];
    var placedPercentage = calculateNewSize( [image_width, image_height], targetSize).percentage[ fit_or_fill ];
    imageLayer.resize( eqSize, eqSize, AnchorPosition.MIDDLECENTER );
    image_width = tempDocSize[0];
    image_height = tempDocSize[1];
    
  }
  
  var imageSize = [ image_width, image_height ];
  var newSize   = calculateNewSize(imageSize, targetSize).percentage[ fit_or_fill ];
  var imageOverflowsTarget = newSize <= 100;
  
  var percentageString = '';
  if ( placedPercentage ) {
    percentageString = placedPercentage === 100 ? 100 : '~'+Math.round( placedPercentage );
  }
  else {
    percentageString = newSize === 100 ? 100 : '~'+Math.round( newSize );
  }
  
  if ( noUpsize && imageOverflowsTarget || !noUpsize ) {
    imageLayer.resize( newSize, newSize, AnchorPosition.MIDDLECENTER );
    if ( changeLayerName === 'always' ) {
      renameActiveLayer(' (Size: '+ percentageString +'%)');
    }
  }
  else {
    if ( changeLayerName && changeLayerName !== 'never' ) {
      renameActiveLayer( ' (Upsize prevented: '+ percentageString +'%)' );
    }
  }
  
}

function activateDocumentByID( docId ) {
  var ref = new ActionReference();
  var desc = new ActionDescriptor();
  ref.putIdentifier(charIDToTypeID('Dcmn'), docId);
  desc.putReference(charIDToTypeID('null'), ref);
  try { executeAction( charIDToTypeID( "slct" ), desc, DialogModes.NO ); } catch(e) {}
}

function renameActiveLayer( newName ) {
  
    var activeLayer = app.activeDocument.activeLayer;
    activeLayer.name = activeLayer.name + newName;
}

function calculateNewSize( inputSize, targetSize ) {
  function mathMax( array ) { return array[0] > array[1] ? array[0] : array[1]; }
  function mathMin( array ) { return array[0] < array[1] ? array[0] : array[1]; }
  var sizeArray = [ targetSize[0] / inputSize[0], targetSize[1] / inputSize[1] ];
  var ratioFit  = mathMin( sizeArray );
  var ratioFill = mathMax( sizeArray );
  return {
    pixels: {
      fit:  { width: inputSize[0]*ratioFit,  height: inputSize[1]*ratioFit  },
      fill: { width: inputSize[0]*ratioFill, height: inputSize[1]*ratioFill }
    },
    percentage: {
      fit:  (100 / inputSize[0]) * (inputSize[0]*ratioFit),
      fill: (100 / inputSize[0]) * (inputSize[0]*ratioFill)
    }
  };
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
  {"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Paste or place inside selection.jsx","preferredSize":[0,0],"margins":30,"orientation":"column","spacing":15,"alignChildren":["fill","top"],"varName":null}},"item-2":{"id":2,"type":"Button","parentId":6,"style":{"text":"1. Fill","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"pasteFill","helpTip":null}},"item-6":{"id":6,"type":"Panel","parentId":17,"style":{"varName":null,"text":"Paste","preferredSize":[0,0],"margins":25,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null}},"item-12":{"id":12,"type":"Button","parentId":6,"style":{"text":"2. Fit","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"pasteFit","helpTip":null}},"item-13":{"id":13,"type":"Panel","parentId":17,"style":{"varName":null,"text":"Place","preferredSize":[0,0],"margins":25,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null}},"item-14":{"id":14,"type":"Button","parentId":13,"style":{"text":"3. Fill","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"placeFill","helpTip":null}},"item-15":{"id":15,"type":"Button","parentId":13,"style":{"text":"4. Fit","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"placeFit","helpTip":null}},"item-16":{"id":16,"type":"Panel","parentId":0,"style":{"varName":null,"text":"Info","preferredSize":[0,0],"margins":25,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null}},"item-17":{"id":17,"type":"Group","parentId":0,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":20,"alignChildren":["left","fill"],"alignment":null}},"item-18":{"id":18,"type":"StaticText","parentId":16,"style":{"varName":null,"text":"Use number keys as shortcuts \nfor each function. Space toggles\nthe upsizing option.","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-19":{"id":19,"type":"Panel","parentId":0,"style":{"varName":null,"text":"Options","preferredSize":[0,0],"margins":25,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null}},"item-20":{"id":20,"type":"Checkbox","parentId":19,"style":{"varName":"noUpsizing","text":"Don't upsize past original size","preferredSize":[0,0],"alignment":null,"helpTip":null}}},"order":[0,17,6,2,12,13,14,15,19,20,16,18],"activeId":18}
  */

  // DIALOG
  // ======
  var dialog = new Window("dialog");
      dialog.text = "Paste or place inside selection.jsx";
      dialog.orientation = "column";
      dialog.alignChildren = ["fill","top"];
      dialog.spacing = 15;
      dialog.margins = 30;

  // GROUP1
  // ======
  var group1 = dialog.add("group");
      group1.orientation = "row";
      group1.alignChildren = ["left","fill"];
      group1.spacing = 20;
      group1.margins = 0;

  // PANEL1
  // ======
  var panel1 = group1.add("panel");
      panel1.text = "Paste";
      panel1.orientation = "column";
      panel1.alignChildren = ["fill","top"];
      panel1.spacing = 10;
      panel1.margins = 25;

  var pasteFill = panel1.add("button");
      pasteFill.text = "1. Fill";
      pasteFill.justify = "center";

  var pasteFit = panel1.add("button");
      pasteFit.text = "2. Fit";
      pasteFit.justify = "center";

  // PANEL2
  // ======
  var panel2 = group1.add("panel");
      panel2.text = "Place";
      panel2.orientation = "column";
      panel2.alignChildren = ["fill","top"];
      panel2.spacing = 10;
      panel2.margins = 25;

  var placeFill = panel2.add("button");
      placeFill.text = "3. Fill";
      placeFill.justify = "center";

  var placeFit = panel2.add("button");
      placeFit.text = "4. Fit";
      placeFit.justify = "center";

  // PANEL3
  // ======
  var panel3 = dialog.add("panel");
      panel3.text = "Options";
      panel3.orientation = "column";
      panel3.alignChildren = ["left","top"];
      panel3.spacing = 10;
      panel3.margins = 25;

  var noUpsizing = panel3.add("checkbox");
      noUpsizing.text = "Don't upsize past original size";

  // PANEL4
  // ======
  var panel4 = dialog.add("panel");
      panel4.text = "Info";
      panel4.orientation = "column";
      panel4.alignChildren = ["left","top"];
      panel4.spacing = 10;
      panel4.margins = 25;

  var statictext1 = panel4.add("group");
      statictext1.orientation = "column";
      statictext1.alignChildren = ["left","center"];
      statictext1.spacing = 0;

      statictext1.add("statictext", undefined, "Use number keys as shortcuts ");
      statictext1.add("statictext", undefined, "for each function. Space toggles");
      statictext1.add("statictext", undefined, "the upsizing option.");
  
  // CUSTOM EVENTS
  
  noUpsizing.active = true;
  noUpsizing.value = 1;
  panel4.enabled = false; // So that it's there, but doesn't steal the thunder of anything else
  
  // PASTE FILL
  pasteFill.onClick = function() {
    method = 'paste';
    fit_or_fill = 'fill';
    noUpsize = noUpsizing.value;
    dialog.close();
  }
  // PASTE FIT
  pasteFit.onClick = function() {
    method = 'paste';
    fit_or_fill = 'fit';
    noUpsize = noUpsizing.value;
    dialog.close();
  }
  // PLACE FILL
  placeFill.onClick = function( keyName ) {
    method = 'place';
    fit_or_fill = 'fill';
    noUpsize = noUpsizing.value;
    dialog.close();
  }
  // PLACE FILL
  placeFit.onClick = function() {
    method = 'place';
    fit_or_fill = 'fit';
    noUpsize = noUpsizing.value;
    dialog.close();
  }
  
  dialog.addEventListener("keyup", function( key ) {
    
    if ( key.keyName == 1 ) {
      pasteFill.onClick();
    }
    else if ( key.keyName == 2 ) {
      pasteFit.onClick();
    }
    else if ( key.keyName == 3 ) {
      placeFill.onClick( key.keyName );
    }
    else if ( key.keyName == 4 ) {
      placeFit.onClick();
    }
    else if ( key.keyName == 'Space' ) {
      noUpsizing.value = noUpsizing.value ? 0 : 1;
    }
    
  });
  
  dialog.show();
  
}
