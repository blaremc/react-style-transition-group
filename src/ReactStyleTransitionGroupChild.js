/**
 *
 * This source code has been adapted from the original ReactCSSTransitionGroupChild
 * available at https://github.com/facebook/react/blob/master/src/addons/transitions/ReactCSSTransitionGroupChild.js
 *
 * It's intentention is to provide similar functionality, however instead of updating classes,
 * to use "style" objects to update a component's style.
 *
 * @typechecks
 * @providesModule ReactStyleTransitionGroupChild
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom')

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');
var ReactTransitionEvents = require('react/lib/ReactTransitionEvents');

var onlyChild = require('react/lib/onlyChild');

// We don't remove the element from the DOM until we receive an animationend or
// transitionend event. If the user screws up and forgets to add an animation
// their node will be stuck in the DOM forever, so we detect if an animation
// does not start and if it doesn't, we just call the end listener immediately.
var TICK = 17;
var NO_EVENT_TIMEOUT = 5000;

var noEventListener = null;


var ReactStyleTransitionGroupChild = React.createClass({
  displayName: 'ReactStyleTransitionGroupChild',

  propTypes: {
    transitionStyles: React.PropTypes.shape({
      enter: React.PropTypes.object,
      enterActive: React.PropTypes.object,
      leave: React.PropTypes.object,
      leaveActive: React.PropTypes.object
    }).isRequired
  },

  transition: function(animationType, finishCallback) {
    var node = ReactDOM.findDOMNode(this);
    var noEventTimeout = null;

    var transitionStyles = this.props.transitionStyles[animationType];
    var transitionActiveStyles = this.props.transitionStyles[animationType + 'Active'];

    var endListener = function(e) {
      if (e && e.target !== node) {
        return;
      }

      ReactTransitionEvents.removeEndEventListener(node, endListener);

      // Usually this optional callback is used for informing an owner of
      // a leave animation and telling it to remove the child.
      if (finishCallback) {
        finishCallback();
      }
    };

    ReactTransitionEvents.addEndEventListener(node, endListener);

    CSSPropertyOperations.setValueForStyles(node, transitionStyles);

    // Need to do this to actually trigger a transition.
    this.queueStyles(transitionActiveStyles);
  },

  queueStyles: function(styles) {
    this.stylesQueue.push(styles);

    if (!this.timeout) {
      this.timeout = setTimeout(this.flushStylesQueue, TICK);
    }
  },

  flushStylesQueue: function() {
    if (this.isMounted()) {
      this.stylesQueue.forEach(
        function (styles) {
          CSSPropertyOperations.setValueForStyles(this.getDOMNode(), styles);
        }.bind(this)
      );
    }
    this.stylesQueue.length = 0;
    this.timeout = null;
  },

  componentWillMount: function() {
    this.stylesQueue = [];
  },

  componentWillUnmount: function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },

  componentWillAppear: function(done) {
    if (this.props.appear) {
      this.transition('appear', done);
    } else {
      done();
    }
  },

  componentWillEnter: function(done) {
    if (this.props.enter) {
      this.transition('enter', done);
    } else {
      done();
    }
  },

  componentWillLeave: function(done) {
    if (this.props.leave) {
      this.transition('leave', done);
    } else {
      done();
    }
  },

  render: function() {
    return onlyChild(this.props.children);
  }
});

module.exports = ReactStyleTransitionGroupChild;
