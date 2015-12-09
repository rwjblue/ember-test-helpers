import Ember from 'ember';
import { setResolver } from 'ember-test-helpers';

let Resolver = Ember.DefaultResolver.extend({
  registry: null,

  resolve: function(fullName) {
    return this.registry[fullName] || this._super.apply(this, arguments);
  },

  normalize: function(fullName) {
    return Ember.String.dasherize(fullName);
  }
});

let resolver = Resolver.create({registry: {}, namespace: {}});
setResolver(resolver);

export function setResolverRegistry(registry) {
  resolver.set('registry', registry);
}
