"""
Marshmallow Schemas for User Service
"""

from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    """User serialization schema"""
    id = fields.Str(dump_only=True)
    email = fields.Email(dump_only=True)
    first_name = fields.Str()
    last_name = fields.Str()
    is_active = fields.Bool(dump_only=True)
    is_verified = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UpdateUserSchema(Schema):
    """User update validation"""
    first_name = fields.Str(validate=validate.Length(max=100))
    last_name = fields.Str(validate=validate.Length(max=100))


class UserProfileSchema(Schema):
    """User profile schema"""
    id = fields.Str(dump_only=True)
    user_id = fields.Str(dump_only=True)
    avatar_url = fields.Str(validate=validate.Length(max=500))
    phone = fields.Str(validate=validate.Length(max=20))
    address_line1 = fields.Str(validate=validate.Length(max=255))
    address_line2 = fields.Str(validate=validate.Length(max=255))
    city = fields.Str(validate=validate.Length(max=100))
    state = fields.Str(validate=validate.Length(max=100))
    postal_code = fields.Str(validate=validate.Length(max=20))
    country = fields.Str(validate=validate.Length(max=100))
    preferences = fields.Dict()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
