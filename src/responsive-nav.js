/* ==========================================================================
   Nav class definition
   ========================================================================== */
import $ from 'jquery';

/* Private
   ========================================================================== */
var defaults = {
    hiddenClassname: 'is-hidden',
    SMTransProperty: 'opacity', // Submenu transition property to look at
    NavTransProperty: 'opacity' // Navigation transition property to look at
};

var namespace = 'nav-multi';
var $W = $(window);
var $D = $(document);

/* getTransDuration --------------------------------------------------------- */
// Return the CSS transition duration of a property on an element or null
function getTransDuration(element, property) {
    if ($(element).css('transition-property') === undefined) { return null }
    var props = $(element).css('transition-property').split(',');
    var durations = $(element).css('transition-duration').split(',');
    var index = $.inArray(property, props);
    return index < 0 ? null : parseFloat(durations[index]) * 1000;
}

/* namespace ---------------------------------------------------------------- */
function ns(events) {
    return events.split(' ').join('.' + namespace + ' ') + '.' + namespace;
}

/* Public
   ========================================================================== */
export class Nav {

/* constructor -------------------------------------------------------------- */
constructor(element, options) {

    this.options = $.extend({}, defaults, options);

    this.el = element;
    this.$el = $(this.el);
    this.$menu = this.$el.children('ul:first');
    this.$submenus = this.$menu.find('ul').addClass(this.options.hiddenClassname);
    this.$submenuLinks = this.$submenus.prev('a').attr('aria-haspopup', true);
    this.$button = $('a[href=#' + this.el.id + ']')
        .attr({
            'role': 'button',
            'aria-controls': this.el.id,
            'aria-expanded': false
        });

    this.init();
}

/* init --------------------------------------------------------------------- */
init() {
    var TO;

    // Manage to show/hide the nav when user click on the control button and
    // hide the nav when user click outside of the navigation (offscreen mode only)
    $D.on(ns('click'), function(e) {
        if ($(e.target).closest(this.$button).length) {
            e.preventDefault();
            this.toggleMenu();
        } else if (!$(e.target).closest(this.$el).length && this.offscreen) {
            (this.$el.attr('aria-hidden') === 'false') && this.toggleMenu();
        }
    }.bind(this));

    // Debounce the onResize handler
    $W.on(ns('resize'), function() {
        TO && clearTimeout(TO);
        TO = setTimeout(this.onResize.bind(this), 50);
    }.bind(this));

    this.onResize();

}

/* toggleMenu --------------------------------------------------------------- */
toggleMenu() {
    var TO = this.$el.data('TO');
    var hide = this.$el.attr('aria-hidden') === 'false';

    TO && clearTimeout(TO);

    if (hide) {
        this.$el.addClass(this.options.hiddenClassname);
        this.$el.data('TO', setTimeout(function() {
            this.$el.attr('aria-hidden', true);
        }.bind(this), this.options.NavTransDuration));
    } else {
        this.$el.attr('aria-hidden', false);
        // Trigger a reflow, flushing the CSS changes
        this.$el[0].offsetHeight;
        this.$el.removeClass(this.options.hiddenClassname);
    }

    this.$button.attr('aria-expanded', !hide);
}

/* toggleSubmenu ------------------------------------------------------------ */
toggleSubmenu(el, hide) {
    var $el = $(el);
    var TO = $el.data('TO');
    TO && clearTimeout(TO);
    if (hide) {
        $el.addClass(this.options.hiddenClassname);
        $el.data('TO', setTimeout(function() {
            $el.attr('aria-hidden', true);
        }, this.options.SMTransDuration));
    } else {
        $el.removeClass(this.options.hiddenClassname).attr('aria-hidden', false);
    }
}

/* onResize ----------------------------------------------------------------- */
onResize() {
    var self = this;

    // Get the CSS transition duration of nav and submenu elements
    this.options.SMTransDuration = getTransDuration(
        this.$submenus[0],
        this.options.SMTransProperty) || 0;

    this.options.NavTransDuration = getTransDuration(
        this.$el[0],
        this.options.NavTransProperty) || 0;

    // Check the display state of the button to know the offscreen status
    this.offscreen = !!this.$button.filter(':visible').length;

    if (this.offscreen) {

        // Display the menu control button and hide the nav
        this.$button.attr('aria-hidden', false);
        this.$el.attr('aria-hidden', true).addClass(this.options.hiddenClassname);

        // Clean potential attached handlers to prevent conflict
        this.$submenus.off('.' + namespace);
        this.$submenuLinks.off('.' + namespace);

        // Manage to show/hide submenus
        this.$submenuLinks.on(ns('click'), function(e) {
            e.preventDefault();
            var $submenu = $(this).next('ul');
            self.toggleSubmenu($submenu, $submenu.attr('aria-hidden') === 'false');
        });

    } else {

        // Update nav element and control button hidden status
        this.$el.attr('aria-hidden', false).removeClass(this.options.hiddenClassname);
        this.$button.attr('aria-hidden', true);

        // Add handlers for both mouse and keyboard events to manage submenus
        this.$submenuLinks.on(ns('mouseenter mouseleave'), function(e) {
            self.toggleSubmenu($(this).next(), e.type === 'mouseleave');
        });

        this.$submenus.on(ns('mouseenter mouseleave'), function(e) {
            self.toggleSubmenu($(this), e.type === 'mouseleave');
        });

        this.$submenuLinks.on(ns('focusin focusout'), function(e) {
            self.toggleSubmenu($(this).next(), e.type === 'focusout');
        });

        this.$submenus.find('a').on(ns('focusin focusout'), function(e) {
            $(this).parents('[aria-label="submenu"]').each(function() {
                self.toggleSubmenu(this, e.type === 'focusout');
            });
        });
    }
}

}
