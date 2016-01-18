/* global mixitup, h */

/**
 * @constructor
 * @namespace
 * @memberof    mixitup
 * @private
 * @since       3.0.0
 */

mixitup.Target = function() {
    var self = this;

    self._execAction('_constructor', 0, arguments);

    h.extend(self, {
        _sortString: '',
        _mixer: null,
        _callback: null,
        _isShown: false,
        _isBound: false,
        _isExcluded: false,
        _handler: null,
        _operation: null,

        _dom: {
            el: null
        }
    });

    self._execAction('_constructor', 1, arguments);

    h.seal(this);
    h.seal(this._dom);
};

mixitup.Target.prototype = Object.create(mixitup.basePrototype);

h.extend(mixitup.Target.prototype, {
    constructor: mixitup.Target,

    _actions: {},
    _filters: {},

    /**
     * Initialises a newly instantiated Target.
     *
     * @private
     * @instance
     * @since   3.0.0
     * @param   {Element}   el
     * @param   {object}    mixer
     * @return  {void}
     */

    _init: function(el, mixer) {
        var self = this;

        self._execAction('_init', 0, arguments);

        self._mixer = mixer;

        self._cacheDom(el);

        self._bindEvents();

        !!self._dom.el.style.display && (self._isShown = true);

        self._execAction('_init', 1, arguments);
    },

    /**
     * Caches references of DOM elements neccessary for the target's functionality.
     *
     * @private
     * @instance
     * @since   3.0.0
     * @param   {Element} el
     * @return  {void}
     */

    _cacheDom: function(el) {
        var self = this;

        self._execAction('_cacheDom', 0, arguments);

        self._dom.el = el;

        self._execAction('_cacheDom', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {string}    attributeName
     * @return  {void}
     */

    _getSortString: function(attributeName) {
        var self    = this,
            value   = self._dom.el.getAttribute('data-' + attributeName) || '';

        self._execAction('_getSortString', 0, arguments);

        value = isNaN(value * 1) ?
            value.toLowerCase() :
            value * 1;

        self._sortString = value;

        self._execAction('_getSortString', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {string}   display
     * @return  {void}
     */

    _show: function(display) {
        var self = this;

        self._execAction('_show', 0, arguments);

        if (!self._dom.el.style.display || self._dom.el.style.display !== display) {
            self._dom.el.style.display = display;
        }

        self._execAction('_show', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @return  {void}
     */

    _hide: function() {
        var self = this;

        self._execAction('hide', 0, arguments);

        self._dom.el.style.display = '';

        self._execAction('hide', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {object}    options
     * @return  {void}
     */

    _move: function(options) {
        var self = this;

        self._execAction('_move', 0, arguments);

        if (!self._isExcluded) {
            self._mixer._targetsMoved++;
        }

        self._applyStylesIn({
            posIn: options.posIn,
            hideOrShow: options.hideOrShow
        });

        requestAnimationFrame(function() {
            self._applyStylesOut(options);
        });

        self._execAction('_move', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {object}    posData
     * @param   {number}    multiplier
     * @return  {void}
     */

    _applyTween: function(posData, multiplier) {
        var self                    = this,
            propertyName            = '',
            tweenData               = null,
            posIn                   = posData.posIn,
            currentTransformValues  = [],
            currentValues           = new mixitup.StyleData(),
            i                       = -1;

        currentValues.display   = self._mixer.layout.display;
        currentValues.x         = posIn.x;
        currentValues.y         = posIn.y;

        if (multiplier === 0) {
            currentValues.display = 'none';

            posIn.display === currentValues.display && self.hide();
        } else if (!self._dom.el.style.display) {
            self._show(self._mixer.layout.display);
        }

        for (i = 0; propertyName = self._mixer._tweenable[i]; i++) {
            tweenData = posData.tweenData[propertyName];

            if (propertyName === 'x') {
                if (!tweenData) continue;

                currentValues.x = posIn.x + (tweenData * multiplier);
            } else if (propertyName === 'y') {
                if (!tweenData) continue;

                currentValues.y = posIn.y + (tweenData * multiplier);
            } else if (tweenData instanceof mixitup.TransformData) {
                if (!tweenData.value) continue;

                currentValues[propertyName].value =
                    posIn[propertyName].value + (tweenData.value * multiplier);

                currentValues[propertyName].unit  = tweenData.unit;

                currentTransformValues.push(
                    propertyName + '(' + currentValues[propertyName].value + tweenData.unit + ')'
                );
            } else if (propertyName !== 'display') {
                if (!tweenData) continue;

                currentValues[propertyName] = posIn[propertyName] + (tweenData * multiplier);

                self._dom.el.style[propertyName] = currentValues[propertyName];
            }
        }

        if (currentValues.x || currentValues.y) {
            currentTransformValues.unshift('translate(' + currentValues.x + 'px, ' + currentValues.y + 'px)');
        }

        if (currentTransformValues.length) {
            self._dom.el.style[mixitup.Mixer.prototype._transformProp] = currentTransformValues.join(' ');
        }
    },

    /**
     * Applies the initial styling to a target element before any transition
     * is applied.
     *
     * @private
     * @instance
     * @param   {object}    options
     * @return  {void}
     */

    _applyStylesIn: function(options) {
        var self            = this,
            posIn           = options.posIn,
            isFading        = self._mixer._effectsIn.opacity !== 1,
            transformValues = [];

        transformValues.push('translate(' + posIn.x + 'px, ' + posIn.y + 'px)');

        if (!options.hideOrShow && self._mixer.animation.animateResizeTargets) {
            self._dom.el.style.width        = posIn.width + 'px';
            self._dom.el.style.height       = posIn.height + 'px';
            self._dom.el.style.marginRight  = posIn.marginRight + 'px';
            self._dom.el.style.marginBottom = posIn.marginBottom + 'px';
        }

        isFading && (self._dom.el.style.opacity = posIn.opacity);

        if (options.hideOrShow === 'show') {
            transformValues = transformValues.concat(self._mixer._transformIn);
        }

        self._dom.el.style[mixitup.Mixer.prototype._transformProp] = transformValues.join(' ');
    },

    /**
     * Applies a transition followed by the final styles for the element to
     * transition towards.
     *
     * @private
     * @instance
     * @param   {object}    options
     * @return  {void}
     */

    _applyStylesOut: function(options) {
        var self            = this,
            transitionRules = [],
            transformValues = [],
            isResizing      = self._mixer.animation.animateResizeTargets,
            isFading        = typeof self._mixer._effectsIn.opacity !== 'undefined';

        // Build the transition rules

        transitionRules.push(self._writeTransitionRule(
            mixitup.Mixer.prototype._transformRule,
            options.staggerIndex
        ));

        if (options.hideOrShow) {
            transitionRules.push(self._writeTransitionRule(
                'opacity',
                options.staggerIndex,
                options.duration
            ));
        }

        if (
            self._mixer.animation.animateResizeTargets &&
            options.posOut.display
        ) {
            transitionRules.push(self._writeTransitionRule(
                'width',
                options.staggerIndex,
                options.duration
            ));

            transitionRules.push(self._writeTransitionRule(
                'height',
                options.staggerIndex,
                options.duration
            ));

            transitionRules.push(self._writeTransitionRule(
                'margin',
                options.staggerIndex,
                options.duration
            ));
        }

        // If no callback was provided, the element will
        // not transition in any way so tag it as "immovable"

        if (!options.callback) {
            self._mixer._targetsImmovable++;

            if (self._mixer._targetsMoved === self._mixer._targetsImmovable) {
                // If the total targets moved is equal to the
                // number of immovable targets, the operation
                // should be considered finished

                self._mixer._cleanUp(options.operation);
            }

            return;
        }

        // If the target will transition in some fasion,
        // assign a callback function

        self._operation = options.operation;
        self._callback = options.callback;

        // As long as the target is not excluded, increment
        // the total number of targets bound

        !self._isExcluded && self._mixer._targetsBound++;

        // Tag the target as bound to differentiate from transitionEnd
        // events that may come from stylesheet driven effects

        self._isBound = true;

        // Apply the transition

        self._applyTransition(transitionRules);

        // Apply width, height and margin negation

        if (
            isResizing &&
            options.posOut.display
        ) {
            self._dom.el.style.width        = options.posOut.width + 'px';
            self._dom.el.style.height       = options.posOut.height + 'px';
            self._dom.el.style.marginRight  = options.posOut.marginRight + 'px';
            self._dom.el.style.marginBottom = options.posOut.marginBottom + 'px';
        }

        if (!self._mixer.animation.nudgeOut && options.hideOrShow === 'hide') {
            // If we're not nudging, the translation should be
            // applied before any other transforms to prevent
            // lateral movement

            transformValues.push('translate(' + options.posOut.x + 'px, ' + options.posOut.y + 'px)');
        }

        // Apply fade

        switch (options.hideOrShow) {
            case 'hide':
                isFading && (self._dom.el.style.opacity = self._mixer._effectsOut.opacity);

                transformValues = transformValues.concat(self._mixer._transformOut);

                break;
            case 'show':
                isFading && (self._dom.el.style.opacity = 1);
        }

        if (
            self._mixer.animation.nudgeOut ||
            (!self._mixer.animation.nudgeOut && options.hideOrShow !== 'hide')
        ) {
            // Opposite of above - apply translate after
            // other transform

            transformValues.push('translate(' + options.posOut.x + 'px, ' + options.posOut.y + 'px)');
        }

        // Apply transforms

        self._dom.el.style[mixitup.Mixer.prototype._transformProp] = transformValues.join(' ');
    },

    /**
     * Combines the name of a CSS property with the appropriate duration and delay
     * values to created a valid transition rule.
     *
     * @private
     * @instance
     * @since   3.0.0
     * @param   {string}    rule
     * @param   {number}    staggerIndex
     * @param   {number}    [duration]
     * @return  {string}
     */

    _writeTransitionRule: function(rule, staggerIndex, duration) {
        var self    = this,
            delay   = self._getDelay(staggerIndex),
            output  = '';

        output = rule + ' ' +
            (duration || self._mixer.animation.duration) + 'ms ' +
            delay + 'ms ' +
            (rule === 'opacity' ? 'linear' : self._mixer.animation.easing);

        return output;
    },

    /**
     * Calculates the transition delay for each target element based on its index, if
     * staggering is applied. If defined, A custom `animation.staggerSeqeuence`
     * function can be used to manipulate the order of indices to produce custom
     * stagger effects (e.g. for use in a grid with irregular row lengths).
     *
     * @private
     * @instance
     * @since   2.0.0
     * @param   {number}    index
     * @return  {number}
     */

    _getDelay: function(index) {
        var self    = this,
            delay   = -1;

        if (typeof self._mixer.animation.staggerSequence === 'function') {
            index = self._mixer.animation.staggerSequence.call(self, index, self._state);
        }

        delay = !!self._mixer._staggerDuration ? index * self._mixer._staggerDuration : 0;

        return self._execFilter('_getDelay', delay, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {string[]}  rules
     * @return  {void}
     */

    _applyTransition: function(rules) {
        var self                = this,
            transitionString    = rules.join(', ');

        self._execAction('_transition', 0, arguments);

        self._dom.el.style[mixitup.Mixer.prototype._transitionProp] = transitionString;

        self._execAction('_transition', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {Event} e
     * @return  {void}
     */

    handleTransitionEnd: function(e) {
        var self        = this,
            propName    = e.propertyName,
            canResize   = self._mixer.animation.animateResizeTargets;

        self._execAction('handleTransitionEnd', 0, arguments);

        if (
            self._isBound &&
            e.target.matches(self._mixer.selectors.target) &&
            (
                propName.indexOf('transform') > -1 ||
                propName.indexOf('opacity') > -1 ||
                canResize && propName.indexOf('height') > -1 ||
                canResize && propName.indexOf('width') > -1 ||
                canResize && propName.indexOf('margin') > -1
            )
        ) {
            self._callback.call(self, self._operation);

            self._isBound = false;
            self._callback = null;
            self._operation = null;
        }

        self._execAction('handleTransitionEnd', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {Event}     e
     * @return  {void}
     */

    _eventBus: function(e) {
        var self = this;

        self._execAction('_eventBus', 0, arguments);

        switch (e.type) {
            case 'webkitTransitionEnd':
            case 'transitionend':
                self.handleTransitionEnd(e);
        }

        self._execAction('_eventBus', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @return  {void}
     */

    _unbindEvents: function() {
        var self = this;

        self._execAction('_unbindEvents', 0, arguments);

        h.off(self._dom.el, 'webkitTransitionEnd', self._handler);
        h.off(self._dom.el, 'transitionEnd', self._handler);

        self._execAction('_unbindEvents', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @return  {void}
     */

    _bindEvents: function() {
        var self = this,
            transitionEndEvent = self._mixer._transitionPrefix === 'webkit' ?
                'webkitTransitionEnd' :
                'transitionend';

        self._execAction('_bindEvents', 0, arguments);

        self._handler = function(e) {
            return self._eventBus(e);
        };

        h.on(self._dom.el, transitionEndEvent, self._handler);

        self._execAction('_bindEvents', 1, arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @return  {PosData}
     */

    _getPosData: function() {
        var self    = this,
            styles  = {},
            rect    = null,
            posData = new mixitup.StyleData();

        self._execAction('_getPosData', 0, arguments);

        posData.x               = self._dom.el.offsetLeft;
        posData.y               = self._dom.el.offsetTop;
        posData.display         = self._dom.el.style.display || 'none';

        if (self._mixer.animation.animateResizeTargets) {
            rect    = self._dom.el.getBoundingClientRect();
            styles  = window.getComputedStyle(self._dom.el);

            posData.width   = rect.width;
            posData.height  = rect.height;

            posData.marginBottom    = parseFloat(styles.marginBottom);
            posData.marginRight     = parseFloat(styles.marginRight);
        }

        return self._execFilter('_getPosData', posData, arguments);
    },

    /**
     * @private
     * @instance
     * @since       3.0.0
     * @return      {void}
     */

    _cleanUp: function() {
        var self = this;

        self._execAction('_cleanUp', 0, arguments);

        self._dom.el.style[mixitup.Mixer.prototype._transformProp]  = '';
        self._dom.el.style[mixitup.Mixer.prototype._transitionProp] = '';
        self._dom.el.style.opacity                                  = '';

        if (self._mixer.animation.animateResizeTargets) {
            self._dom.el.style.width        = '';
            self._dom.el.style.height       = '';
            self._dom.el.style.marginRight  = '';
            self._dom.el.style.marginBottom = '';
        }

        self._execAction('_cleanUp', 1, arguments);
    }
});