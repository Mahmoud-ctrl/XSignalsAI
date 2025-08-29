from marshmallow import EXCLUDE, Schema, fields, pre_load, validate, ValidationError, validates_schema

class SignupSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))

class LoginSchema(Schema):
    email = fields.Email(required=False)
    phone = fields.Str(required=False)
    password = fields.Str(required=True)

    @validates_schema
    def validate_identifier(self, data, **kwargs):
        if not data.get("email"):
            raise ValidationError("Email is required.")

class RequestPasswordResetSchema(Schema):
    email = fields.Email(required=True, error_messages={'required': 'Email is required'})

class ResetPasswordSchema(Schema):
    email = fields.Email(required=True, error_messages={'required': 'Email is required'})
    code = fields.Str(required=True, validate=validate.Length(min=1), error_messages={'required': 'Reset code is required'})
    password = fields.Str(required=True, validate=validate.Length(min=6), error_messages={
        'required': 'Password is required',
        'validator_failed': 'Password must be at least 6 characters long'
    })

class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True, error_messages={'required': 'Current password is required'})
    new_password = fields.Str(required=True, validate=validate.Length(min=6), error_messages={
        'required': 'New password is required',
        'validator_failed': 'New password must be at least 6 characters long'
    })