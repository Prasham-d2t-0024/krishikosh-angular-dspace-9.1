import { ResourceType } from './resource-type';

/**
 * The resource type for BrowseDefinition
 *
 * Needs to be in a separate file to prevent circular
 * dependencies in webpack.
 */
export const BOOKMARK = new ResourceType('bookmark');
