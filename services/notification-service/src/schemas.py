"""
Marshmallow Schemas for Notification Service
"""

from marshmallow import Schema, fields, validate

class EmailNotificationSchema(Schema):
    """Email notification validation"""
    to = fields.Email(required=True)
    subject = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    body = fields.Str(required=True, validate=validate.Length(min=1))
    template = fields.Str()


class SMSNotificationSchema(Schema):
    """SMS notification validation"""
    phone = fields.Str(required=True, validate=validate.Regexp(r'^\+[1-9]\d{1,14}$'))
    message = fields.Str(required=True, validate=validate.Length(min=1, max=160))


class PushNotificationSchema(Schema):
    """Push notification validation"""
    user_id = fields.Str(required=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    body = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    data = fields.Dict()
