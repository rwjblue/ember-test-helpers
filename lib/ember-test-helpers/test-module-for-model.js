/* global DS */ // added here to prevent an import from erroring when ED is not present

import TestModule from './test-module';
import Ember from 'ember';

export default TestModule.extend({
  init: function(modelName, description, callbacks) {
    this.modelName = modelName;

    this._super.call(this, 'model:' + modelName, description, callbacks);

    this.setupSteps.push(this.setupModel);
  },

  setupModel: function() {
    let container = this.container;
    let defaultSubject = this.defaultSubject;
    let callbacks = this.callbacks;
    let modelName = this.modelName;

    let adapterFactory = container.lookupFactory('adapter:application');
    if (!adapterFactory) {
      adapterFactory = DS.JSONAPIAdapter || DS.FixtureAdapter;

      let thingToRegisterWith = this.registry || this.container;
      thingToRegisterWith.register('adapter:application', adapterFactory);
    }

    callbacks.store = function(){
      let container = this.container;
      let store = container.lookup('service:store') || container.lookup('store:main');
      return store;
    };

    if (callbacks.subject === defaultSubject) {
      callbacks.subject = function(options) {
        let container = this.container;

        return Ember.run(function() {
          let store = container.lookup('service:store') || container.lookup('store:main');
          return store.createRecord(modelName, options);
        });
      };
    }
  }
});
