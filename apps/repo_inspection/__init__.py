from flask import Blueprint

repo_inspection_bp = Blueprint(
    'repo_inspection_bp',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/repo_inspection'
)

from . import routes
