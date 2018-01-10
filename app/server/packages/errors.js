'use strict';

/**
 * @module packages
 */

/**
 * Defines the list of package publication errors.
 *
 * @class ERRORS
 * @static
 */

var ERRORS = {

  /**
   * No error.
   *
   * @property NO_ERROR
   * @type Number
   * @default -1
   * @final
   */
  NO_ERROR: -1,

  /**
   * Error involving a server error.
   *
   * @property UNKNOWN
   * @type Number
   * @default 0
   * @final
   */
  UNKNOWN: 0,

  /**
   * Package type is not supported.
   *
   * @property INVALID_PACKAGE_TYPE
   * @type Number
   * @default 1
   * @final
   */
  INVALID_PACKAGE_TYPE: 1,

  /**
   * Package copy failed.
   *
   * @property COPY
   * @type Number
   * @default 2
   * @final
   */
  COPY: 2,

  /**
   * Removing original package failed.
   *
   * @property UNLINK
   * @type Number
   * @default 3
   * @final
   */
  UNLINK: 3,

  /**
   * Extracting an archive package failed.
   *
   * @property EXTRACT
   * @type Number
   * @default 4
   * @final
   */
  EXTRACT: 4,

  /**
   * Package does not respect the expected format for its type.
   *
   * @property VALIDATION
   * @type Number
   * @default 5
   * @final
   */
  VALIDATION: 5,

  /**
   * Creating public directory to expose package's files failed.
   *
   * @property CREATE_VIDEO_PUBLIC_DIR
   * @type Number
   * @default 6
   * @final
   */
  CREATE_VIDEO_PUBLIC_DIR: 6,

  /**
   * Saving package data into database failed.
   *
   * @property SAVE_PACKAGE_DATA
   * @type Number
   * @default 7
   * @final
   */
  SAVE_PACKAGE_DATA: 7,

  /**
   * Creating synchro.json file failed.
   *
   * @property SAVE_TIMECODE
   * @type Number
   * @default 8
   * @final
   */
  SAVE_TIMECODE: 8,

  /**
   * Uploading media to media platform failed.
   *
   * @property MEDIA_UPLOAD
   * @type Number
   * @default 9
   * @final
   */
  MEDIA_UPLOAD: 9,

  /**
   * Configuring media in the media platform failed.
   *
   * @property MEDIA_CONFIGURE
   * @type Number
   * @default 10
   * @final
   */
  MEDIA_CONFIGURE: 10,

  /**
   * Scanning package temporary directory failed.
   *
   * @property SCAN_FOR_IMAGES
   * @type Number
   * @default 11
   * @final
   */
  SCAN_FOR_IMAGES: 11,

  /**
   * Cleaning package temporary directory failed.
   *
   * @property SCAN_FOR_IMAGES
   * @type Number
   * @default 13
   * @final
   */
  CLEAN_DIRECTORY: 13,

  /**
   * Retrying / uploading package failed.
   *
   * Package was not found.
   *
   * @property PACKAGE_NOT_FOUND
   * @type Number
   * @default 14
   * @final
   */
  PACKAGE_NOT_FOUND: 14,

  /**
   * Executing a state machine transition failed.
   *
   * @property TRANSITION
   * @type Number
   * @default 15
   * @final
   */
  TRANSITION: 15,

  /**
   * Package configuration is not valid when creating a Package.
   *
   * @property INVALID_CONFIGURATION
   * @type Number
   * @default 16
   * @final
   */
  INVALID_CONFIGURATION: 16,

  /**
   * Generating media thumbnail failed.
   *
   * @property GENERATE_THUMB
   * @type Number
   * @default 17
   * @final
   */
  GENERATE_THUMB: 17,

  /**
   * Getting media metadata failed.
   *
   * @property GET_METADATA
   * @type Number
   * @default 18
   * @final
   */
  GET_METADATA: 18,

  /**
   * Copying media thumbnail failed.
   *
   * @property COPY_THUMB
   * @type Number
   * @default 19
   * @final
   */
  COPY_THUMB: 19
};

Object.freeze(ERRORS);
module.exports = ERRORS;
