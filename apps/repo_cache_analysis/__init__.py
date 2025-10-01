from flask import Blueprint

repo_cache_analysis_bp = Blueprint(
    'repo_cache_analysis_bp',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix='/repo_cache_analysis'
)

from . import routes
