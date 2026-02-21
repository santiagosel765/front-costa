import { HttpErrorResponse } from '@angular/common/http';

import { mapHttpErrorMessage } from './api-error.util';

describe('mapHttpErrorMessage', () => {
  it('returns plan message for identifiable module-disabled 403', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: {
        message: 'MODULE_NOT_AVAILABLE for tenant',
      },
    });

    expect(mapHttpErrorMessage(error)).toBe('Módulo no disponible en tu plan.');
  });

  it('returns permissions message for generic 403', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: {
        message: 'Access denied',
      },
    });

    expect(mapHttpErrorMessage(error)).toBe('No tienes permisos para realizar esta acción.');
  });
});
