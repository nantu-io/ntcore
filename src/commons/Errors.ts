export class ServiceNotFoundError extends Error {
  message = 'Service Not Found.';
}

export class IllegalStateError extends Error {
  message = 'Illegal State.';
}

export class GenericError extends Error {
  constructor(message: string) {
    super(message);
  }
}