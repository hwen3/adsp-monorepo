import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { TemplateService } from './pdf';
import { getTemplateBody } from '@core-services/notification-shared';
import { ServiceDirectory, adspId } from '@abgov/adsp-service-sdk';
import { validate } from 'uuid';
import * as NodeCache from 'node-cache';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import * as fs from 'fs';

const TIME_ZONE = 'America/Edmonton';
handlebars.registerHelper('formatDate', function (value: unknown, { hash = {} }: { hash: Record<string, string> }) {
  try {
    if (value instanceof Date) {
      value = DateTime.fromJSDate(value)
        .setZone(TIME_ZONE)
        .toFormat(hash.format || 'ff ZZZZ');
    } else if (typeof value === 'string') {
      value = DateTime.fromISO(value)
        .setZone(TIME_ZONE)
        .toFormat(hash.format || 'ff ZZZZ');
    }
  } catch (err) {
    // If this fails, then just fallback to default.
  }
  return value;
});

const resolveLabelFromScope = (scope: string) => {
  // eslint-disable-next-line no-useless-escape
  const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;
  const isValid = validPatternRegex.test(scope);
  if (!isValid) return null;

  const lastSegment = scope.split('/').pop();

  if (lastSegment) {
    const lowercased = lastSegment.replace(/([A-Z])/g, ' $1').toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
  return '';
};

const getFormFieldValue = (scope: string, data: object) => {
  if (data !== undefined) {
    const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentValue: any = data;

    for (const key of pathArray) {
      if (currentValue[key] === undefined) {
        return '';
      }
      currentValue = currentValue[key];
    }

    return Array.isArray(currentValue)
      ? currentValue[currentValue.length - 1]
      : typeof currentValue === 'object'
      ? ''
      : currentValue;
  } else {
    return '';
  }
};

export const getAllRequiredFields = (schema: JsonSchema4 | JsonSchema7): string[] => {
  const requiredFields: string[] = [];

  function findRequired(fields: JsonSchema4 | JsonSchema7) {
    if (fields && fields.required && Array.isArray(fields.required)) {
      fields.required.forEach((field: string) => {
        requiredFields.push(field);
      });
    }

    if (fields !== undefined && fields.properties) {
      Object.keys(fields.properties).forEach((key) => {
        if (fields.properties) {
          findRequired(fields.properties[key]);
        }
      });
    } else if (fields && fields.type === 'array' && fields.items && typeof fields.items === 'object') {
      const childItems: JsonSchema4 = JSON.parse(JSON.stringify(fields.items));
      findRequired(childItems);
    }
  }
  findRequired(schema);
  return requiredFields;
};

const fileId = (value: string, fileServiceUrl: string) => {
  let returnValue = '';

  try {
    if (typeof value === 'string' && value.slice(0, 4) === 'urn:') {
      if (value.indexOf('urn:ads:platform:file-service') !== -1) {
        returnValue = value.split('/')[value.split('/').length - 1];
      } else {
        return null;
      }
    } else if (validate(value)) {
      returnValue = value;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
  }

  return `<a href="${fileServiceUrl}file/v1/files/${returnValue}/download?unsafe=true&embed=true">${returnValue}</a> `;
};

class HandlebarsTemplateService implements TemplateService {
  fileServiceCache: NodeCache;

  constructor(private readonly directory: ServiceDirectory) {
    this.fileServiceCache = new NodeCache({
      stdTTL: 0,
      useClones: false,
    });

    this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`).then((result) => {
      this.fileServiceCache.set('fileServiceUrl', result.toString());
    });
  }

  getTemplateFunction(template: string, channel?: string) {
    const styledTemplate = getTemplateBody(template, channel || 'pdf', {});
    const fileServiceUrl = this.fileServiceCache.get('fileServiceUrl') as string;

    handlebars.registerHelper('fileId', function (value: string) {
      let returnValue = '';

      try {
        if (typeof value === 'string' && value.slice(0, 4) === 'urn:') {
          if (value.indexOf('urn:ads:platform:file-service') !== -1) {
            returnValue = value.split('/')[value.split('/').length - 1];
          } else {
            return null;
          }
        } else if (validate(value)) {
          returnValue = value;
        } else {
          return null;
        }
      } catch (err) {
        console.error(err);
      }

      return `${fileServiceUrl}file/v1/files/${returnValue}/download?unsafe=true&embed=true`;
    });

    handlebars.registerPartial('elements', fs.readFileSync('./apps/pdf-service/src/pdf/partials/elements.hbs', 'utf8'));

    handlebars.registerHelper('isRequiredField', function (requiredFields, element) {
      const lastSegment: string = element.scope?.split('/').pop();
      const isRequired = requiredFields && requiredFields.includes(lastSegment);
      return isRequired;
    });

    handlebars.registerHelper('requiredField', function (dataSchema) {
      const requiredFields = dataSchema && getAllRequiredFields(dataSchema);
      return requiredFields;
    });

    handlebars.registerHelper('isControlAndHasScope', function (element) {
      return element.type === 'Control' && element.scope;
    });
    handlebars.registerHelper('isListWithDetailAndHasScope', function (element) {
      return element.type === 'ListWithDetail' && element.scope && element.options;
    });

    handlebars.registerHelper('scopeName', function (scope) {
      const scopeName = scope.replace('#/properties/', '');
      const firstCap = scopeName.charAt(0).toUpperCase() + scopeName.substring(1);
      return firstCap;
    });

    handlebars.registerHelper('withEach', function (context, data, requiredFields, options) {
      let ret = '';

      if (!options) {
        options = { ...requiredFields };
        requiredFields = null;
      }

      for (let i = 0, j = context.length; i < j; i++) {
        const extendedContext = Object.assign({}, context[i], { params: { data, requiredFields } });
        ret = ret + options.fn(extendedContext);
      }

      return ret;
    });

    handlebars.registerHelper('firstDetail', function (context, data, requiredFields, scope, options) {
      const scopeName = scope.replace('#/properties/', '');
      if (!options) {
        options = { ...requiredFields };
        requiredFields = null;
      }
      const extendedContext = Object.assign({}, context[0], { params: { requiredFields, data: data[scopeName] } });
      const ret = '' + options.fn(extendedContext);
      return ret;
    });

    handlebars.registerHelper('withEachData', function (context, requiredFields, element, options) {
      let ret = '';

      if (!options) {
        options = { ...requiredFields };
        requiredFields = null;
      }

      for (let i = 0, j = context.length; i < j; i++) {
        const extendedContext = Object.assign({}, context[i], { params: { requiredFields, element } });
        ret = ret + options.fn(extendedContext);
      }

      return ret;
    });

    handlebars.registerHelper('label', function (element) {
      const label = element?.label ? element.label : resolveLabelFromScope(element.scope);
      return label;
    });
    handlebars.registerHelper('value', function (element, data) {
      let value = getFormFieldValue(element.scope, data ? data : {});

      if (typeof value === 'string' && value.slice(0, 4) === 'urn:') {
        value = fileId(value, fileServiceUrl);
      }

      return value;
    });
    handlebars.registerHelper('isControl', function (element) {
      return element.type === 'Control';
    });

    handlebars.registerHelper('hasElements', function (element) {
      return element.elements && element.elements.length > 0;
    });

    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    return handlebars.compile(styledTemplate, { noEscape: true });
  }
}

export function createTemplateService(directory: ServiceDirectory): TemplateService {
  return new HandlebarsTemplateService(directory);
}
