var  first=true;
! function(t) {
    "use strict";
    t.fn.slider = function(i) {
	
        var n = t.extend(t.fn.slider.defaultOptions, i),
            e = function() {
			
                var i = t(this),
                    e = i.width();
                if (i.find(".image img").css("width", e + "px"), i.find(".left.image").css("width", Math.floor(e * n.initialPosition)), n.showInstruction) {
                  //  var s = null;
                  //  s = t("div.instruction"), 0 === s.length && (s = t("<div></div>").addClass("instruction").append("<p></p>"), i.append(s)), s.children("p").text(n.instructionText), s.css("left", 100 * (n.initialPosition - s.children("p").width() / (2 * e)) + "%")
                              
			   }
            },
            s = function(i) {
			    
			    
                i.preventDefault(), t(i.currentTarget).children(".instruction").hide();
                var n;
                n = i.type.startsWith("touch") ? i.originalEvent.touches[0].clientX - i.currentTarget.offsetLeft : void 0 === i.offsetX ? i.pageX - i.currentTarget.offsetLeft : i.offsetX, t(this).find(".left.image").css("width", n + "px")
            },
            o = function(i) {
			
                i.preventDefault(), t(this).css("cursor", "ew-resize").on("mousemove.sliderns", s).on("touchmove.sliderns", s)
            },
            r = function(i) {
                i.preventDefault(), t(this).css("cursor", "normal").off("mousemove.sliderns").off("touchmove.sliderns")
            },
            c = function() {
			
                return t(".slider.responsive").each(e)
            };
        return t(window).on("resize", c), this.each(e).on("click touchstart", s).on("mousedown touchstart", o).on("mouseup touchend", r)
    }, t.fn.slider.defaultOptions = {
        initialPosition: .5,
        showInstruction: !0,
        instructionText: "Click and Drag"
    }
}(jQuery);