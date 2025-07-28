from flask import Blueprint

accessibility_bp = Blueprint(
    'accessibility',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/accessibility'
)

from . import routes
