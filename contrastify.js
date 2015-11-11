
/*

*/

//	http://www.w3.org/TR/WCAG/#visual-audio-contrast
/*

	1.4.3 Contrast (Minimum): The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for the following: (Level AA)
		.Large Text: Large-scale text and images of large-scale text have a contrast ratio of at least 3:1;
		.Incidental: Text or images of text that are part of an inactive user interface component, that are pure decoration, that are not visible to anyone, or that are part of a picture that contains significant other visual content, have no contrast requirement.
		.Logotypes: Text that is part of a logo or brand name has no minimum contrast requirement.

*/

(function(win){
	win.contrastify = win.contrastify || {};


    //http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    var hexToRgb = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
        } : null;
    },

    //	Ref: http://stackoverflow.com/a/3627747
	rgb2hex = function(rgb) {
	    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;

	    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	    function hex(x) {
	        return ("0" + parseInt(x).toString(16)).slice(-2);
	    }
	    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
	},

    //	Adds hash if required and ensures we have a 6 digit hex
    cleanHex = function(hex){
    	if(hex && hex.toLowerCase().indexOf("rgb") !== -1) {
    		hex = rgb2hex(hex);
    	}

    	var testHex = "" + hex;
    	if(testHex) {
    		if(testHex.indexOf("#") === 0) {
    			testHex = testHex.substr(1);
    		}
	    	if(testHex && testHex.length < 4) {
	    		testHex = testHex + testHex;
	    	}
    	}
    	return "#" + testHex;
    };


	//http://www.msfw.com/accessibility/tools/contrastratiocalculator.aspx
	function getLuminance(color) {
		// Get hex values
		var Rhex, Ghex, Bhex;
		if (color.match(/^\s*#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})\s*$/i)) {
			Rhex = RegExp.$1;
			Ghex = RegExp.$2;
			Bhex = RegExp.$3;
		}
		else if (color.match(/^\s*#?([0-9a-f])([0-9a-f])([0-9a-f])\s*$/i)) {
			Rhex = RegExp.$1 + RegExp.$1;
			Ghex = RegExp.$2 + RegExp.$2;
			Bhex = RegExp.$3 + RegExp.$3;
		}
		else {
			return(NaN);
		}
		// Get decimal values
		var R8bit = parseInt(Rhex, 16);
		var G8bit = parseInt(Ghex, 16);
		var B8bit = parseInt(Bhex, 16);
		// Get sRGB values
		var RsRGB = R8bit/255;
		var GsRGB = G8bit/255;
		var BsRGB = B8bit/255;
		// Calculate luminance
		var R = (RsRGB <= 0.03928) ? RsRGB/12.92 : Math.pow(((RsRGB + 0.055)/1.055), 2.4);
		var G = (GsRGB <= 0.03928) ? GsRGB/12.92 : Math.pow(((GsRGB + 0.055)/1.055), 2.4);
		var B = (BsRGB <= 0.03928) ? BsRGB/12.92 : Math.pow(((BsRGB + 0.055)/1.055), 2.4);
		return (0.2126 * R + 0.7152 * G + 0.0722 * B);
	};

	var getContrastRatio = function(color1, color2) {
		var L1 = getLuminance(color1);
		var L2 = getLuminance(color2);
		return Math.round((Math.max(L1, L2) + 0.05)/(Math.min(L1, L2) + 0.05)*10)/10;
	};


	// http://stackoverflow.com/questions/801406/c-create-a-lighter-darker-color-based-on-a-system-color/801463#801463
	// Modified to allow for 0 shifting up
	function shiftColour( hexColor, factor ){
        if ( factor < 0 ) {
        	factor = 0;
        }

        var c = hexColor;
        if ( c.substr(0,1) == "#" ){
            c = c.substring(1);
        }

        if ( c.length == 3 || c.length == 6 )
        {
            var i = c.length / 3;

            var f;  // the relative distance from white

            var r = parseInt( c.substr(0, i ), 16 );
            //	Allow shift up from 0
            if(factor > 1 && r == 0) {
            	r = 11;
            }
            f = ( factor * r / (256-r) );
            r = Math.floor((256 * f) / (f+1));
            r = r.toString(16);
            if ( r.length == 1 ) r = "0" + r;

            var g = parseInt( c.substr(i, i), 16);
            //	Allow shift up from 0
            if(factor > 1 && g == 0) {
            	g = 11;
            }
            f = ( factor * g / (256-g) );
            g = Math.floor((256 * f) / (f+1));
            g = g.toString(16);
            if ( g.length == 1 ) g = "0" + g;

            var b = parseInt( c.substr( 2*i, i),16 );
            //	Allow shift up from 0
            if(factor > 1 && b == 0) {
            	b = 11;
            }
            f = ( factor * b / (256-b) );
            b = Math.floor((256 * f) / (f+1));
            b = b.toString(16);
            if ( b.length == 1 ) b = "0" + b;

            c =  r+g+b;
		}   
		return "#" + c;
    };

	var fixColour = function(background, testColor, requiredRatio) {
		background = cleanHex(background);
		testColor = cleanHex(testColor);
		var ratioLight = getContrastRatio(background, testColor),
			ratioDark = getContrastRatio(background, testColor),
			ratio = ratioDark,
			newC = testColor,
			newCLight = testColor,
			newCDark = testColor,
			maxLoop = 50,
			loopCount = 0;

		//	Sort colour ratio, should really be 4.5 for smaller text
		requiredRatio = requiredRatio || 2.2;

		//	Calculate both dark and light variations
		while(ratioDark < requiredRatio && ratioLight < requiredRatio && loopCount < maxLoop) {
			newCDark = shiftColour(newCDark, 0.9);
			newCLight = shiftColour(newCLight, 1.1);
			ratioDark = getContrastRatio(background, newCDark);
			ratioLight = getContrastRatio(background, newCLight);
			loopCount += 1;
		}

		newC = (ratioLight > ratioDark)?
			newCLight:
			newCDark;

		return newC;
	};	

	win.contrastify.rgb2hex = rgb2hex;
	win.contrastify.getRatio = getContrastRatio;
	win.contrastify.fixRatio = fixColour;

}(window));

