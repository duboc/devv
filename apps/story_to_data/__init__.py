from flask import Blueprint

story_to_data_bp = Blueprint(
    'story_to_data',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/story_to_data'
)

from . import routes
