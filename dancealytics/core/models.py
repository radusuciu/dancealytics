"""Le models."""
from marshmallow import Schema, fields, post_dump
from dancealytics import db

Column = db.Column
Text = db.Text
Integer = db.Integer
relationship = db.relationship

