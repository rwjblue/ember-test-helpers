/* globals jQuery, self */

import Ember from 'ember';

let requests;
function incrementAjaxPendingRequests(_, xhr) {
  requests.push(xhr);
}

function decrementAjaxPendingRequests(_, xhr) {
  for (let i = 0;i < requests.length;i++) {
    if (xhr === requests[i]) {
      requests.splice(i, 1);
    }
  }
}

export function _teardownAJAXHooks() {
  jQuery(document).off('ajaxSend', incrementAjaxPendingRequests);
  jQuery(document).off('ajaxComplete', decrementAjaxPendingRequests);
}

export function _setupAJAXHooks() {
  requests = [];

  jQuery(document).on('ajaxSend', incrementAjaxPendingRequests);
  jQuery(document).on('ajaxComplete', decrementAjaxPendingRequests);
}

export default function wait(_options) {
  let options = _options || {};
  let waitForTimers = options.hasOwnProperty('waitForTimers') ? options.waitForTimers : true;
  let waitForAJAX = options.hasOwnProperty('waitForAJAX') ? options.waitForAJAX : true;

  return new Ember.RSVP.Promise(function(resolve) {
    let watcher = self.setInterval(function() {
      if (waitForTimers && (Ember.run.hasScheduledTimers() || Ember.run.currentRunLoop)) {
        return;
      }

      if (waitForAJAX && requests && requests.length > 0) {
        return;
      }

      // Stop polling
      self.clearInterval(watcher);

      // Synchronously resolve the promise
      Ember.run(null, resolve);
    }, 10);
  });
}
