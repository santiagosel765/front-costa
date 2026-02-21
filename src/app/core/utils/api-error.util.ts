import { HttpErrorResponse } from '@angular/common/http';

type ValidationItem = string | { field?: string; message?: string; defaultMessage?: string };

interface ErrorBody {
  message?: string;
  error?: string;
  detail?: string;
  details?: ValidationItem[] | string;
  errors?: ValidationItem[];
}

const FALLBACK_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

const MODULE_PLAN_ERROR_HINTS = [
  'MODULE_DISABLED',
  'MODULE_NOT_AVAILABLE',
  'TENANT_MODULE_DISABLED',
  'PLAN_MODULE_DISABLED',
  'LICENSE_MODULE_DISABLED',
  'modulo no disponible',
  'módulo no disponible',
  'module not available',
  'module disabled',
  'not included in plan',
  'no incluido en tu plan',
  'tenant module',
];

function isModuleUnavailableError(payload: ErrorBody): boolean {
  const possibleValues = [
    payload.message,
    payload.error,
    payload.detail,
    typeof payload.details === 'string' ? payload.details : undefined,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return MODULE_PLAN_ERROR_HINTS.some((hint) =>
    possibleValues.some((value) => value.includes(hint.toLowerCase())),
  );
}

function formatValidationItem(item: ValidationItem): string {
  if (typeof item === 'string') {
    return item;
  }

  const message = item.message ?? item.defaultMessage ?? '';
  if (!item.field) {
    return message;
  }

  return `${item.field}: ${message}`;
}

function parseValidationDetails(payload: ErrorBody): string[] {
  const details = payload.details ?? payload.errors;

  if (!details) {
    return [];
  }

  if (typeof details === 'string') {
    return [details];
  }

  return details.map(formatValidationItem).filter((item) => !!item);
}

export function mapHttpErrorMessage(error: HttpErrorResponse): string {
  const payload: ErrorBody = typeof error.error === 'object' && error.error !== null ? error.error : {};

  if (error.status === 403) {
    return isModuleUnavailableError(payload)
      ? 'Módulo no disponible en tu plan.'
      : 'No tienes permisos para realizar esta acción.';
  }

  if (error.status === 409) {
    return payload.message ?? payload.detail ?? 'Conflicto: el recurso ya existe o no puede procesarse.';
  }

  if (error.status === 400) {
    const validations = parseValidationDetails(payload);
    if (validations.length) {
      return validations.join(' | ');
    }

    return payload.message ?? payload.detail ?? 'Revisa los datos ingresados e inténtalo nuevamente.';
  }

  return payload.message ?? payload.error ?? payload.detail ?? FALLBACK_ERROR;
}
