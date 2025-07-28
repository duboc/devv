# System Patterns

## 1. Modular Application Architecture

To support multiple, distinct applications within a single framework, the project will be refactored into a modular architecture using **Flask Blueprints**.

-   **`app.py` (Main Application):** The main `app.py` file will be responsible for creating the Flask app instance, discovering and registering blueprints, and running the application. It will be kept lean and focused on orchestration.

-   **`apps/` (Application Modules):** A new `apps/` directory will be created. Each subdirectory within `apps/` will represent a self-contained application module (e.g., `apps/story_to_data/`, `apps/repo_inspection/`).

-   **Blueprint Structure (per app):** Each application module will have a consistent structure:
    -   `__init__.py`: Defines the Flask Blueprint for the application.
    -   `routes.py`: Contains all the Flask routes (API endpoints) specific to that application.
    -   `templates/`: A subdirectory for the application's specific HTML templates (e.g., `story_to_data.html`).
    -   `static/`: A subdirectory for any application-specific CSS or JavaScript.

-   **`utils/` (Shared Utilities):** Common utilities, like the `GeminiClient` in `utils_vertex.py`, will be moved to a shared `utils/` directory to be accessible by all application modules.

## 2. Data and Control Flow

1.  **Initial Load:** The user navigates to the root URL (`/`). The main `app.py` renders a primary layout template (`layout.html`) which includes the sidebar navigation.
2.  **Navigation:** The user clicks a link in the sidebar (e.g., "User Story to Data").
3.  **Dynamic Content Loading:** JavaScript will fetch the HTML content for the selected application (e.g., from `/story_to_data/`) and inject it into the main content area of the page. This creates a single-page application (SPA) feel without a complex frontend framework.
4.  **API Interaction:** Once an application's UI is loaded, all its interactions (e.g., clicking "Generate Story") will be handled by its own dedicated API endpoints, which are defined in its blueprint (e.g., `/story_to_data/generate/story`).
5.  **Backend Processing:** The request is routed to the correct blueprint's `routes.py` file. The route handler processes the request, calls any necessary utility functions (from the shared `utils/` directory), and returns a JSON response.
6.  **Frontend Update:** The application-specific JavaScript receives the response and updates the UI dynamically.

## 3. State Management

The application will remain stateless on the server-side. All application state will be managed on the client-side within the scope of the currently loaded application's JavaScript. This ensures that the applications are self-contained and do not interfere with each other.

## 4. Adding New Applications - Critical Patterns

### 4.1 Navigation Integration Requirements

When adding a new application, ensure these components are synchronized:

1. **Blueprint Registration** in `app.py`:
   ```python
   from apps.new_app import new_app_bp
   app.register_blueprint(new_app_bp)
   ```

2. **Navigation Menu** in `templates/layout.html`:
   ```html
   <a href="#" class="nav-item" data-page="new_app">
       <i class="fas fa-icon"></i>
       <span>Display Name</span>
   </a>
   ```

3. **JavaScript Routing** in `static/js/main.js`:
   ```javascript
   const pageData = {
       'new_app': { 
           title: 'Display Name', 
           icon: 'fas fa-icon', 
           category: 'Section Name', 
           url: '/new_app/' 
       }
   };
   ```

### 4.2 Common Debugging Issues

**Problem**: "Page not found" when clicking navigation button
- **Root Cause**: Mismatch between `data-page` attribute and JavaScript pageData key
- **Solution**: Ensure `data-page="app_name"` matches exactly with the key in pageData object and the blueprint url_prefix

**Problem**: Blueprint routes not responding
- **Root Cause**: Blueprint not registered in main app.py
- **Solution**: Add import and registration in app.py

**Problem**: Template not found errors
- **Root Cause**: Template path mismatch between blueprint config and render_template call
- **Solution**: Use simple filename in render_template, ensure template_folder='templates' in blueprint

### 4.3 Naming Conventions

- **Blueprint name**: Use snake_case (e.g., `story_to_code`)
- **URL prefix**: Use snake_case with leading slash (e.g., `/story_to_code`)
- **Template files**: Use snake_case matching blueprint name (e.g., `story_to_code.html`)
- **JavaScript keys**: Use snake_case matching blueprint name (e.g., `story_to_code`)
- **Navigation data-page**: Use snake_case matching blueprint name (e.g., `data-page="story_to_code"`)

### 4.4 Template Standardization Requirements

For consistency across applications, all templates must follow the exact same ID and class patterns:

**Configuration Form Elements:**
- Form ID: `config-form` (no suffixes)
- Radio button IDs: `{{ model }}`, `{{ industry }}`, `{{ lang }}` (no prefixes)
- Persona input: `persona_name`
- User story select: `user_story_select`
- User story textarea: `user_story`

**Generation Workflow Elements:**
- Button IDs: `generate_story_btn`, `generate_tasks_btn`, `generate_[type]_btn`
- Loader IDs: `loader_story`, `loader_tasks`, `loader_[type]`
- Regenerate button IDs: `regen_story_btn`, `regen_tasks_btn`, `regen_[type]_btn`
- Clear button ID: `clear_all_btn`
- Results container: `results-container`

**Required CSS Styles:**
Each template must include the action-button-wrapper styles for proper regenerate icon positioning:
```css
.action-button-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}
.regenerate-icon {
    position: absolute;
    right: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    cursor: pointer;
    font-size: 1.25rem;
    transition: transform 0.2s;
}
.clear-icon {
    color: var(--text-light);
    cursor: pointer;
    font-size: 1.1rem;
    transition: color 0.2s, transform 0.2s;
}
```

**Critical Rule**: Never use application-specific suffixes (like `_code`, `_data`) in template IDs. This ensures JavaScript functions work consistently across all applications without modification.
