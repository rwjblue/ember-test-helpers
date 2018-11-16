import settled from './settled';
import { _resetRouterTransitionPendingState } from './setup-application-context';

/**
  Used by test framework addons to tear down the provided context after testing is completed.

  @public
  @param {Object} context the context to setup
  @returns {Promise<void>} resolves when settled
*/
export default function(context: object): Promise<void> {
  _resetRouterTransitionPendingState();

  return settled();
}
