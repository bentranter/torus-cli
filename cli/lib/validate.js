'use strict';

var validate = exports;

var _ = require('lodash');
var validator = require('validator');
var errors = require('common/errors');
var rpath = require('common/rpath');
var definitions = require('common/cpath/definitions');

var CRED_NAME = new RegExp(/^[a-z][a-z0-9_]{0,63}$/);
var ACTION_SHORTHAND = new RegExp(/^(?:([crudl])(?!.*\1))+$/);
var INVITE_CODE_REGEX = new RegExp(/^[0-9a-ht-zjkmnpqr]{10}$/);

/**
 * Given a map of names to validation functions it returns a function that
 * validates that all of the object data must match.
 *
 * @param {Object} ruleMap map of value names to validation functions
 * @param {Boolean} requireAll defaults to true, require all to be present
 * @returns {Function} function accepting map of value names to values which
 *                     returns an empty array on success or an array of errors.
 */
validate.build = function (ruleMap, requireAll) {
  requireAll = (requireAll === undefined) ? true : requireAll;

  return function (input) {
    var keyDiff = _.difference(Object.keys(ruleMap), Object.keys(input));
    if (keyDiff.length > 0 && requireAll) {
      var msg = 'Missing parameters: ' + keyDiff.join(', ');
      return [new errors.Validation(msg)];
    }

    var errs = _.map(ruleMap, function (rule, name) {
      if (input[name] === undefined && !requireAll) {
        return null;
      }

      if (!rule) {
        throw new Error('Undefined Rule Provided: ' + name);
      }

      var values = Array.isArray(input[name]) ? input[name] : [input[name]];
      var output = values.map(rule).map(function (err) {
        return (typeof err === 'string') ?
          new errors.Validation(name + ': ' + err) : null;
      });

      return output;
    });

    // Finally, only return non-null values
    errs = _.flatten(errs);

    return errs.filter(function (err) {
      return err !== null && err !== undefined;
    });
  };
};

validate.expResourcePath = function (input) {
  var error = 'Invalid resource path provided';

  return rpath.validate(input) ? true : error;
};

validate.actionShorthand = function (input) {
  var error = 'Actions must be some combination of valid action shorthands (c, r, u, d, l)';

  return ACTION_SHORTHAND.test(input) ? true : error;
};

validate.credName = function (input) {
  var error =
    'Credential must contain only alphanumeric or underscore characters';

  return CRED_NAME.test(input) ? true : error;
};

validate.name = function (input) {
  var error = 'Please provide your fullname [a-zA-Z ,.\'-\\pL]';
  return validator.matches(input, /^[a-zA-Z\s,\.'\-pL]{1,64}$/) ? true : error;
};

validate.slug = function (input) {
  var error = 'Only alphanumeric, hyphens and underscores are allowed';
  return validator.matches(
    input, definitions.SLUG_REGEX) ? true : error;
};

validate.slugOrWildcard = function (input) {
  var error = 'Only alphanumeric, hyphens, underscores, or wildcard(*) allowed';
  return validator.matches(
    input, definitions.SLUG_OR_WILDCARD_REGEX) ? true : error;
};

validate.orExpression = function (input) {
  var error =
    'A valid expression must be provided (e.g. abc-123, abc-*, [ab|c-*])';
  return validator.matches(
    input, definitions.SLUG_WILDCARD_OR_EXP_REGEX) ? true : error;
};

validate.email = function (input) {
  var error = 'Please enter a valid email address';
  return validator.isEmail(input) ? true : error;
};

validate.url = function (input) {
  var error = 'Please enter a valid url';
  return validator.isURL(input) ? true : error;
};

validate.passphrase = function (input) {
  var error = 'Passphrase must be at least 8 characters';
  return input.length < 8 ? error : true;
};

validate.id = function (input) {
  var error = 'Please enter a valid 24 character ID';
  var matches = validator.matches(input, /^[a-zA-Z0-9\\_\\-]+$/);
  return input.length !== 24 || !matches ? error : true;
};

validate.code = function (input) {
  var error = 'Verification code must be exactly 9 characters';
  var trimmed = input.replace(/\s/g, '');
  return trimmed.length !== 9 ? error : true;
};

validate.inviteCode = function (code) {
  return !INVITE_CODE_REGEX.test(code) ?
    'Invite code must be 10 base32 characters' : true;
};
