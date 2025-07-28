from flask import Blueprint

story_to_code_bp = Blueprint(
    'story_to_code',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/story_to_code'
)

from . import routes
