from flask import Blueprint, render_template
from dancealytics import db

home = Blueprint('home', __name__,
                 template_folder='templates',
                 static_folder='static')


@home.route('/')
def index():
    bootstrap = None
    return render_template('index.html', bootstrap=bootstrap)

@home.before_app_first_request
def create_db():
    db.create_all()
    db.session.commit()
