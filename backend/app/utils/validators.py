import re


def validate_phone_number(phone: str) -> bool:
    return bool(re.fullmatch(r"^\+?[0-9]{9,15}$", phone))


def validate_registration_number(value: str) -> bool:
    return bool(re.fullmatch(r"^[A-Za-z0-9\-_/]{3,40}$", value))
