function exposeRegistryMethodsWithoutDeprecations(container) {
  var methods = [
    'register',
    'unregister',
    'resolve',
    'normalize',
    'typeInjection',
    'injection',
    'factoryInjection',
    'factoryTypeInjection',
    'has',
    'options',
    'optionsForType'
  ];

  function exposeRegistryMethod(container, method) {
    container[method] = function() {
      return container._registry[method].apply(container._registry, arguments);
    };
  }

  for (var i = 0, l = methods.length; i < l; i++) {
    exposeRegistryMethod(container, methods[i]);
  }
}

var registryMap = {};
function registryFromApplication(application) {
  var appGuid = Ember.guidFor(application);

  if (registryMap[appGuid]) {
    return registryMap[appGuid];
  }

  var app = application.create({ rootElement: document.createElement('div')});

  return registryMap[appGuid] = {
    container: app.__container__,
    registry: app.__container__._registry
  };
}

export default function(resolver, _namespace) {
  var registry, container;

  if (_namespace) {
    return registryFromApplication(_namespace);
  }

  var namespace = _namespace || Ember.Object.create({
    Resolver: { create: function() { return resolver; } }
  });

  function register(name, factory) {
    var thingToRegisterWith = registry || container;

    thingToRegisterWith.register(name, factory);
  }

  if (Ember.Application.buildRegistry) {
    registry = Ember.Application.buildRegistry(namespace);
    registry.register('component-lookup:main', Ember.ComponentLookup);

    registry = registry;
    container = registry.container();
    exposeRegistryMethodsWithoutDeprecations(container);
  } else {
    container = Ember.Application.buildContainer(namespace);
    container.register('component-lookup:main', Ember.ComponentLookup);
  }

  // Ember 1.10.0 did not properly add `view:toplevel` or `view:default`
  // to the registry in Ember.Application.buildRegistry :(
  register('view:toplevel', Ember.View.extend());
  register('view:default', Ember._MetamorphView);

  var globalContext = typeof global === 'object' && global || self;
  if (globalContext.DS) {
    var DS = globalContext.DS;
    if (DS._setupContainer) {
      DS._setupContainer(registry || container);
    } else {
      register('transform:boolean', DS.BooleanTransform);
      register('transform:date', DS.DateTransform);
      register('transform:number', DS.NumberTransform);
      register('transform:string', DS.StringTransform);
      register('serializer:-default', DS.JSONSerializer);
      register('serializer:-rest', DS.RESTSerializer);
      register('adapter:-rest', DS.RESTAdapter);
    }
  }

  return {
    registry: registry,
    container: container
  };
}
