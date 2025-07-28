from flask import Blueprint

image_to_code_bp = Blueprint(
    'image_to_code',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/image_to_code'
)

from . import routes
