"""
Marshmallow Schemas for validation and serialization
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
import re

class UserSchema(Schema):
    """User serialization schema"""
    id = fields.Str(dump_only=True)
    email = fields.Email(required=True)
    first_name = fields.Str()
    last_name = fields.Str()
    is_active = fields.Bool(dump_only=True)
    is_verified = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class RegisterSchema(Schema):
    """Registration validation schema"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8, max=128))
    first_name = fields.Str(validate=validate.Length(max=100))
    last_name = fields.Str(validate=validate.Length(max=100))
    
    @validates('password')
    def validate_password(self, value):
        """Ensure password meets complexity requirements"""
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', value):
            raise ValidationError('Password must contain at least one number')


class LoginSchema(Schema):
    """Login validation schema"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class TokenSchema(Schema):
    """Token response schema"""
    access_token = fields.Str()
    refresh_token = fields.Str()
    token_type = fields.Str(default='Bearer')
    expires_in = fields.Int()
