import Ember from 'ember';
import { TestModule, getContext } from 'ember-test-helpers';
import hasEmberVersion from 'ember-test-helpers/has-ember-version';
import test from 'tests/test-support/qunit-test';
import qunitModuleFor from 'tests/test-support/qunit-module-for';
import { setResolverRegistry } from 'tests/test-support/resolver';

function moduleFor(fullName, description, callbacks) {
  let module = new TestModule(fullName, description, callbacks);
  qunitModuleFor(module);
}

function setupRegistry() {
  setResolverRegistry({
    'component:x-foo':           Ember.Component.extend(),
    'component:not-the-subject': Ember.Component.extend(),
    'foo:thing': Ember.Object.extend({
      fromDefaultRegistry: true
    }),
    'service:other-thing': Ember.Object.extend({
      fromDefaultRegistry: true
    })

  });
}

let callbackOrder, setupContext, teardownContext, beforeSetupContext, afterTeardownContext;

moduleFor('component:x-foo', 'TestModule callbacks', {
  beforeSetup: function() {
    beforeSetupContext = this;
    callbackOrder = [ 'beforeSetup' ];

    setupRegistry();
  },

  setup: function() {
    setupContext = this;
    callbackOrder.push('setup');

    ok(setupContext !== beforeSetupContext);
  },

  teardown: function() {
    teardownContext = this;
    callbackOrder.push('teardown');

    deepEqual(callbackOrder, [ 'beforeSetup', 'setup', 'teardown']);
    equal(setupContext, teardownContext);
  },

  afterTeardown: function() {
    afterTeardownContext = this;
    callbackOrder.push('afterTeardown');
    equal(this.context, undefined, "don't leak the this.context");
    equal(getContext(), undefined, "don't leak the internal context");
    deepEqual(callbackOrder, [ 'beforeSetup', 'setup', 'teardown', 'afterTeardown']);
    equal(afterTeardownContext, beforeSetupContext);
    ok(afterTeardownContext !== teardownContext);
  }
});

test("setup callbacks called in the correct order", function() {
  deepEqual(callbackOrder, [ 'beforeSetup', 'setup' ]);
});

moduleFor('component:x-foo', 'component:x-foo -- setup context', {
  beforeSetup: function() {
    setupRegistry();
  },

  setup: function() {
    this.subject({
      name: 'Max'
    });

    this.register('service:blah', Ember.Object.extend({
      purpose: 'blabering'
    }));
  }
});

test("subject can be initialized in setup", function() {
  equal(this.subject().name, 'Max');
});

test("can lookup factory registered in setup", function() {
  this.inject.service('blah');
  equal(Ember.get(this, 'blah.purpose'), 'blabering');
});

moduleFor('component:x-foo', 'component:x-foo -- callback context', {
  beforeSetup: function() {
    setupRegistry();
  },

  getSubjectName: function() {
    return this.subjectName;
  }
});

test("callbacks are called in the context of the module", function() {
  equal(this.getSubjectName(), 'component:x-foo');
});

moduleFor('component:x-foo', 'component:x-foo -- created subjects are cleaned up', {
  beforeSetup: function() {
    setupRegistry();
  },

  afterTeardown: function() {
    let subject = this.cache.subject;

    ok(subject.isDestroyed);
  }
});

test("subject's created in a test are destroyed", function() {
  this.subject();
});

moduleFor('component:x-foo', 'component:x-foo -- uncreated subjects do not error', {
  beforeSetup: function() {
    setupRegistry();
  }
});

test("subject's created in a test are destroyed", function() {
  expect(0);
});

moduleFor('component:x-foo', 'component:x-foo -- without needs or `integration: true`', {
  beforeSetup: setupRegistry()
});

test("knows nothing about our non-subject component", function() {
  let otherComponent = this.container.lookup('component:not-the-subject');
  equal(null, otherComponent, "We shouldn't know about a non-subject component");
});

moduleFor('component:x-foo', 'component:x-foo -- when needing another component', {
  beforeSetup: setupRegistry(),
  needs: ['component:not-the-subject']
});

test("needs gets us the component we need", function() {
  let otherComponent = this.container.lookup('component:not-the-subject');
  ok(otherComponent, "another component can be resolved when it's in our needs array");
});

moduleFor('component:x-foo', 'component:x-foo -- `integration`', {
  beforeSetup: function() {
    setupRegistry();
    ok(!this.callbacks.integration, "integration property should be removed from callbacks");
    ok(this.isIntegration, "isIntegration should be set when we set `integration: true` in callbacks");
  },
  integration: true
});

test("needs is not needed (pun intended) when integration is true", function() {
  let otherComponent = this.container.lookup('component:not-the-subject');
  ok(otherComponent, 'another component can be resolved when integration is true');
});

test("throws an error when declaring integration: true and needs in the same module", function() {
  expect(3);

  let result = false;

  try {
    moduleFor('component:x-foo', {
      integration: true,
      needs: ['component:x-bar']
    });
  } catch(err) {
    result = true;
  }

  ok(result, "should throw an Error when integration: true and needs are provided");
});

test("throws an error when declaring integration: 'legacy' in `moduleFor` test", function() {
  expect(3);

  let result = false;

  try {
    moduleFor('component:x-foo', {
      integration: 'legacy'
    });
  } catch(err) {
    result = true;
  }

  ok(result, "should throw an Error when integration: 'legacy' outside of a component integration test");
});

if (hasEmberVersion(1,11)) {
  moduleFor('component:x-foo', 'should be able to override factories in integration mode', {
    beforeSetup: function() {
      setupRegistry();
    },

    integration: true
  });

  test('gets the default by default', function() {
    let thing = this.container.lookup('foo:thing');

    ok(thing.fromDefaultRegistry, 'found from the default registry');
  });

  test('can override the default', function() {
    this.register('foo:thing', Ember.Object.extend({
      notTheDefault: true
    }));
    let thing = this.container.lookup('foo:thing');

    ok(!thing.fromDefaultRegistry, 'should not be found from the default registry');
    ok(thing.notTheDefault, 'found from the overridden factory');
  });

  test('gets the default with fullName normalization by default', function() {
    this.register('foo:needs-service', Ember.Object.extend({
      otherThing: Ember.inject.service()
    }));

    let foo = this.container.lookup('foo:needs-service');
    let thing = foo.get('otherThing');

    ok(thing.fromDefaultRegistry, 'found from the default registry');
  });

  test('can override the default with fullName normalization', function() {
    this.register('service:other-thing', Ember.Object.extend({
      notTheDefault: true
    }));

    this.register('foo:needs-service', Ember.Object.extend({
      otherThing: Ember.inject.service()
    }));

    let foo = this.container.lookup('foo:needs-service');
    let thing = foo.get('otherThing');

    ok(!thing.fromDefaultRegistry, 'should not be found from the default registry');
    ok(thing.notTheDefault, 'found from the overridden factory');
  });
}

if (hasEmberVersion(2, 3)) {
  moduleFor('foo:thing', 'should be able to use `getOwner` on instances', {
    beforeSetup: function() {
      setupRegistry();
    },

    integration: true
  });

  test('instances get an owner', function() {
    let subject = this.subject();
    let owner = Ember.getOwner(subject);

    let otherThing = owner.lookup('service:other-thing');
    ok(otherThing.fromDefaultRegistry, 'was able to use `getOwner` on an instance and lookup an instance');
  });

  test('test context gets an owner', function() {
    let owner = Ember.getOwner(this);

    let otherThing = owner.lookup('service:other-thing');
    ok(otherThing.fromDefaultRegistry, 'was able to use `getOwner` on test context and lookup an instance');
  });
}
