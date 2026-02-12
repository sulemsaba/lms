class AppException(Exception):
    """Base exception for domain-level errors."""


class AuthorizationException(AppException):
    """Raised for permission violations."""


class ValidationException(AppException):
    """Raised for business rule validation errors."""


class ConflictException(AppException):
    """Raised when optimistic lock or sync conflicts happen."""
