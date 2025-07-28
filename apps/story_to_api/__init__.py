from flask import Blueprint

story_to_api_bp = Blueprint(
    'story_to_api',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/story_to_api'
)

from . import routes
