import Ember from 'ember';

export default function hasEmberVersion(major, minor) {
  let numbers = Ember.VERSION.split('-')[0].split('.');
  let actualMajor = parseInt(numbers[0], 10);
  let actualMinor = parseInt(numbers[1], 10);
  return actualMajor > major || (actualMajor === major && actualMinor >= minor);
}
