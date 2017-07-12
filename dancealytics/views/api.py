from flask import Blueprint, jsonify, request
import dancealytics.api as api


api_blueprint = Blueprint('api_blueprint', __name__,
                  template_folder='templates',
                  static_folder='static')


@api_blueprint.route('/')
def index():
    return jsonify('hello')

@api_blueprint.route('/search')
def search():
    term = request.args.get('term')

    if term:
        return jsonify(api.search(term))

@api_blueprint.route('/autocomplete')
def autocomplete():
    term = request.args.get('term')
    suggestions = api.autocomplete(term)
    return jsonify(suggestions)

@api_blueprint.route('/analyze/<track_id>')
def analyze(track_id):
    return jsonify(api.analyze(track_id))
