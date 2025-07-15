class ApiError extends Error {
  constructor(statusCode, errors = [], stack = "") {
    super(errors[0]?.message || "Something went wrong"); // Inherit message from Error class

    this.statusCode = statusCode; // HTTP status code (e.g., 404, 500)
    this.data = null; // Any additional data (optional)
    this.success = false; // Indicates failure
    this.errors = errors; // Array of error messages

    if (stack) {
      this.stack = stack; // Use custom stack trace (if provided)
    } else {
      Error.captureStackTrace(this, this.constructor); // Capture current stack trace
    }
  }
}

export { ApiError };
