document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app by loading the home page content by default
    loadPage('home');
    initializeNavigation();
});

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            
            // Update active state in sidebar
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Load the content for the selected page
            loadPage(pageId);
        });
    });
}

async function loadPage(pageId) {
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');
    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');

    const pageData = {
        'home': { title: 'Home', icon: 'fas fa-home', category: 'Navigation', url: '/static/home.html' },
        'story_to_data': { title: 'User Story to Data', icon: 'fas fa-database', category: 'User Story Automation', url: '/story_to_data/' },
        'story_to_code': { title: 'User Story to Code', icon: 'fas fa-code', category: 'User Story Automation', url: '/story_to_code/' },
        'story_to_api': { title: 'User Story to API', icon: 'fas fa-server', category: 'User Story Automation', url: '/story_to_api/' },
        'image_to_code': { title: 'Image to Code', icon: 'fas fa-image', category: 'Code Intelligence', url: '/image_to_code/' },
        'repo_inspection': { title: 'Repo Inspection', icon: 'fas fa-search', category: 'Code Intelligence', url: '/repo_inspection/' },
        'repo_cache_analysis': { title: 'Repo Cache Analysis', icon: 'fas fa-search-dollar', category: 'Code Intelligence', url: '/repo_cache_analysis/' },
        'accessibility': { title: 'Accessibility', icon: 'fas fa-universal-access', category: 'UX/UI Design', url: '/accessibility/' },
        // Add other pages here as they are created
    };

    const current = pageData[pageId];
    if (!current) {
        contentArea.innerHTML = `<p>Page not found.</p>`;
        return;
    }

    // Update header
    pageTitle.innerHTML = `<i class="${current.icon}"></i> ${current.title}`;
    breadcrumbCategory.textContent = current.category;
    breadcrumbCurrent.textContent = current.title;

    try {
        const response = await fetch(current.url);
        if (!response.ok) {
            throw new Error(`Failed to load page: ${response.statusText}`);
        }
        const html = await response.text();
        contentArea.innerHTML = html;
        
        // After loading content, initialize its specific scripts
        if (pageId === 'story_to_data') {
            initializeStoryToDataApp();
        } else if (pageId === 'story_to_code') {
            initializeStoryToCodeApp();
        } else if (pageId === 'story_to_api') {
            initializeStoryToApiApp();
        } else if (pageId === 'image_to_code') {
            initializeImageToCodeApp();
        } else if (pageId === 'repo_inspection') {
            initializeRepoInspectionApp();
        } else if (pageId === 'repo_cache_analysis') {
            initializeRepoCacheAnalysisApp();
        } else if (pageId === 'accessibility') {
            initializeAccessibilityApp();
        }
    } catch (error) {
        console.error('Error loading page:', error);
        contentArea.innerHTML = `<p>Error loading page. Please try again.</p>`;
    }
}

function initializeAccessibilityApp() {
    // State management
    let generatedWcagAnalysis = '';
    let generatedUserStories = '';
    let generatedImplementation = '';

    // Element references
    const wcagBtn = document.getElementById('generate_wcag_analysis_btn');
    const userStoriesBtn = document.getElementById('generate_user_stories_btn');
    const implementationBtn = document.getElementById('generate_implementation_btn');
    const testPlanBtn = document.getElementById('generate_test_plan_btn');
    
    const regenWcagBtn = document.getElementById('regen_wcag_analysis_btn');
    const regenUserStoriesBtn = document.getElementById('regen_user_stories_btn');
    const regenImplementationBtn = document.getElementById('regen_implementation_btn');
    const regenTestPlanBtn = document.getElementById('regen_test_plan_btn');

    const clearAllBtn = document.getElementById('clear_all_btn');

    updateRadioVisuals();
    initializeTabs();
    initializeGenerationButtons();
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateRadioVisuals);
    });

    function updateRadioVisuals() {
        document.querySelectorAll('.radio-item').forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${targetTab}`);
                });
            });
        });
    }

    function initializeGenerationButtons() {
        if(wcagBtn) wcagBtn.addEventListener('click', () => handleGeneration('wcag_analysis'));
        if(userStoriesBtn) userStoriesBtn.addEventListener('click', () => handleGeneration('user_stories'));
        if(implementationBtn) implementationBtn.addEventListener('click', () => handleGeneration('implementation'));
        if(testPlanBtn) testPlanBtn.addEventListener('click', () => handleGeneration('test_plan'));

        if(regenWcagBtn) regenWcagBtn.addEventListener('click', () => handleGeneration('wcag_analysis'));
        if(regenUserStoriesBtn) regenUserStoriesBtn.addEventListener('click', () => handleGeneration('user_stories'));
        if(regenImplementationBtn) regenImplementationBtn.addEventListener('click', () => handleGeneration('implementation'));
        if(regenTestPlanBtn) regenTestPlanBtn.addEventListener('click', () => handleGeneration('test_plan'));

        if(clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
    }

    async function handleGeneration(type) {
        const buttons = {
            wcag_analysis: { btn: wcagBtn, loader: 'loader_wcag_analysis', regen: regenWcagBtn, nextBtn: userStoriesBtn },
            user_stories: { btn: userStoriesBtn, loader: 'loader_user_stories', regen: regenUserStoriesBtn, nextBtn: implementationBtn },
            implementation: { btn: implementationBtn, loader: 'loader_implementation', regen: regenImplementationBtn, nextBtn: testPlanBtn },
            test_plan: { btn: testPlanBtn, loader: 'loader_test_plan', regen: regenTestPlanBtn, nextBtn: null }
        };

        const current = buttons[type];
        const loader = document.getElementById(current.loader);
        
        current.btn.disabled = true;
        loader.style.display = 'inline-block';
        current.regen.style.display = 'none';

        // Collect form data manually to ensure radio buttons are captured
        const data = {
            use_case: document.querySelector('input[name="use_case"]:checked')?.value || 'Retail (Nike)',
            model_name: document.querySelector('input[name="model_name"]:checked')?.value || 'gemini-experimental',
            story_lang: document.querySelector('input[name="story_lang"]:checked')?.value || 'English'
        };
        
        // Add dependent content
        if (type === 'user_stories') data.wcag_analysis = generatedWcagAnalysis;
        if (type === 'implementation') data.user_stories = generatedUserStories;
        if (type === 'test_plan') data.implementation = generatedImplementation;

        try {
            const response = await fetch(`/accessibility/generate/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.error) {
                alert(`Error: ${result.error}`);
                current.btn.disabled = false;
                return;
            }
            
            // Store generated content
            if (type === 'wcag_analysis') generatedWcagAnalysis = result.content;
            if (type === 'user_stories') generatedUserStories = result.content;
            if (type === 'implementation') generatedImplementation = result.content;

            displayResult(type, result.content, result.prompt);
            updateButton(current.btn, current.regen, current.nextBtn);

        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
            current.btn.disabled = false;
        } finally {
            loader.style.display = 'none';
        }
    }

    function updateButton(currentBtn, regenBtn, nextBtn) {
        currentBtn.className = 'action-button button-completed';
        currentBtn.disabled = false;
        regenBtn.style.display = 'block';
        if (nextBtn) {
            nextBtn.className = 'action-button button-ready';
            nextBtn.disabled = false;
        }
    }

    function displayResult(type, content, prompt) {
        const container = document.getElementById('results-container');
        const placeholder = container.querySelector('p');
        if (placeholder) placeholder.remove();
        
        const resultId = `result-${type}`;
        let existingResult = document.getElementById(resultId);
        if (existingResult) existingResult.remove();

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.id = resultId;

        const typeIcons = {
            'wcag_analysis': 'fas fa-clipboard-check',
            'user_stories': 'fas fa-users',
            'implementation': 'fas fa-code',
            'test_plan': 'fas fa-vial'
        };

        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <h4><i class="${typeIcons[type]}"></i> ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}</h4>
            <i class="fas fa-chevron-down expand-icon"></i>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'result-content';
        const markdownHtml = marked.parse(content);
        
        contentDiv.innerHTML = `
            <div class="content-section">
                <h5><i class="fas fa-file-alt"></i> Generated Content</h5>
                <div class="markdown-content">${markdownHtml}</div>
            </div>
            <div class="content-section">
                <h5><i class="fas fa-code"></i> Prompt Used</h5>
                <pre class="prompt-content">${prompt}</pre>
            </div>
        `;

        header.addEventListener('click', () => {
            contentDiv.classList.toggle('visible');
            header.classList.toggle('expanded');
        });

        resultItem.appendChild(header);
        resultItem.appendChild(contentDiv);
        container.prepend(resultItem);
        
        setTimeout(() => header.click(), 100);
        
        document.querySelector('.tab[data-tab="results"]').click();
    }

    function clearAll() {
        generatedWcagAnalysis = '';
        generatedUserStories = '';
        generatedImplementation = '';

        const buttons = [wcagBtn, userStoriesBtn, implementationBtn, testPlanBtn];
        const regens = [regenWcagBtn, regenUserStoriesBtn, regenImplementationBtn, regenTestPlanBtn];

        wcagBtn.className = 'action-button button-ready';
        wcagBtn.disabled = false;
        
        userStoriesBtn.className = 'action-button button-waiting';
        userStoriesBtn.disabled = true;
        implementationBtn.className = 'action-button button-waiting';
        implementationBtn.disabled = true;
        testPlanBtn.className = 'action-button button-waiting';
        testPlanBtn.disabled = true;

        regens.forEach(r => r.style.display = 'none');

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); font-style: italic;">
                Generated accessibility analysis will appear here...
            </p>
        `;
        
        document.querySelector('.tab[data-tab="generate"]').click();
    }
}

function initializeStoryToDataApp() {
    // State management
    let generatedStory = '';
    let generatedTasks = '';
    let generatedDw = '';

    // Element references
    const storyBtn = document.getElementById('generate_story_btn');
    const tasksBtn = document.getElementById('generate_tasks_btn');
    const dwBtn = document.getElementById('generate_dw_btn');
    const bqBtn = document.getElementById('generate_bigquery_btn');
    
    const regenStoryBtn = document.getElementById('regen_story_btn');
    const regenTasksBtn = document.getElementById('regen_tasks_btn');
    const regenDwBtn = document.getElementById('regen_dw_btn');
    const regenBqBtn = document.getElementById('regen_bigquery_btn');

    const clearAllBtn = document.getElementById('clear_all_btn');

    updateRadioVisuals();
    initializeTabs();
    initializeGenerationButtons();

    const userStorySelect = document.getElementById('user_story_select');
    const userStoryTextarea = document.getElementById('user_story');
    if (userStorySelect && userStoryTextarea) {
        userStoryTextarea.value = userStorySelect.value;
        userStorySelect.addEventListener('change', () => {
            userStoryTextarea.value = userStorySelect.value;
        });
    }
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateRadioVisuals);
    });

    function updateRadioVisuals() {
        document.querySelectorAll('.radio-item').forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${targetTab}`);
                });
            });
        });
    }

    function initializeGenerationButtons() {
        if(storyBtn) storyBtn.addEventListener('click', () => handleGeneration('story'));
        if(tasksBtn) tasksBtn.addEventListener('click', () => handleGeneration('tasks'));
        if(dwBtn) dwBtn.addEventListener('click', () => handleGeneration('dw'));
        if(bqBtn) bqBtn.addEventListener('click', () => handleGeneration('bigquery'));

        if(regenStoryBtn) regenStoryBtn.addEventListener('click', () => handleGeneration('story'));
        if(regenTasksBtn) regenTasksBtn.addEventListener('click', () => handleGeneration('tasks'));
        if(regenDwBtn) regenDwBtn.addEventListener('click', () => handleGeneration('dw'));
        if(regenBqBtn) regenBqBtn.addEventListener('click', () => handleGeneration('bigquery'));

        if(clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
    }

    async function handleGeneration(type) {
        const buttons = {
            story: { btn: storyBtn, loader: 'loader_story', regen: regenStoryBtn, nextBtn: tasksBtn },
            tasks: { btn: tasksBtn, loader: 'loader_tasks', regen: regenTasksBtn, nextBtn: dwBtn },
            dw: { btn: dwBtn, loader: 'loader_dw', regen: regenDwBtn, nextBtn: bqBtn },
            bigquery: { btn: bqBtn, loader: 'loader_bigquery', regen: regenBqBtn, nextBtn: null }
        };

        const current = buttons[type];
        const loader = document.getElementById(current.loader);
        
        current.btn.disabled = true;
        loader.style.display = 'inline-block';
        current.regen.style.display = 'none';

        const formData = new FormData(document.getElementById('config-form'));
        const data = Object.fromEntries(formData.entries());
        data.user_story = document.getElementById('user_story').value;
        
        if (type === 'tasks') data.story_content = generatedStory;
        if (type === 'dw') data.tasks_content = generatedTasks;
        if (type === 'bigquery') data.dw_content = generatedDw;

        try {
            const response = await fetch(`/story_to_data/generate/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.error) {
                alert(`Error: ${result.error}`);
                current.btn.disabled = false; // Re-enable on error
                return;
            }
            
            if (type === 'story') generatedStory = result.content;
            if (type === 'tasks') generatedTasks = result.content;
            if (type === 'dw') generatedDw = result.content;

            displayResult(type, result.content, result.prompt);
            updateButton(current.btn, current.regen, current.nextBtn);

        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
            current.btn.disabled = false; // Re-enable on error
        } finally {
            loader.style.display = 'none';
        }
    }

    function updateButton(currentBtn, regenBtn, nextBtn) {
        currentBtn.className = 'action-button button-completed';
        currentBtn.disabled = false;
        regenBtn.style.display = 'block';
        if (nextBtn) {
            nextBtn.className = 'action-button button-ready';
            nextBtn.disabled = false;
        }
    }

    function displayResult(type, content, prompt) {
        const container = document.getElementById('results-container');
        const placeholder = container.querySelector('p');
        if (placeholder) placeholder.remove();
        
        const resultId = `result-${type}`;
        let existingResult = document.getElementById(resultId);
        if (existingResult) existingResult.remove();

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.id = resultId;

        const typeIcons = {
            'story': 'fas fa-book',
            'tasks': 'fas fa-tasks',
            'dw': 'fas fa-database',
            'bigquery': 'fas fa-cloud'
        };

        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <h4><i class="${typeIcons[type]}"></i> ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
            <i class="fas fa-chevron-down expand-icon"></i>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'result-content';
        const markdownHtml = marked.parse(content);
        
        contentDiv.innerHTML = `
            <div class="content-section">
                <h5><i class="fas fa-file-alt"></i> Generated Content</h5>
                <div class="markdown-content">${markdownHtml}</div>
            </div>
            <div class="content-section">
                <h5><i class="fas fa-code"></i> Prompt Used</h5>
                <pre class="prompt-content">${prompt}</pre>
            </div>
        `;

        header.addEventListener('click', () => {
            contentDiv.classList.toggle('visible');
            header.classList.toggle('expanded');
        });

        resultItem.appendChild(header);
        resultItem.appendChild(contentDiv);
        container.prepend(resultItem);
        
        setTimeout(() => header.click(), 100);
        
        document.querySelector('.tab[data-tab="results"]').click();
    }

    function clearAll() {
        generatedStory = '';
        generatedTasks = '';
        generatedDw = '';

        const buttons = [storyBtn, tasksBtn, dwBtn, bqBtn];
        const regens = [regenStoryBtn, regenTasksBtn, regenDwBtn, regenBqBtn];

        storyBtn.className = 'action-button button-ready';
        storyBtn.disabled = false;
        
        tasksBtn.className = 'action-button button-waiting';
        tasksBtn.disabled = true;
        dwBtn.className = 'action-button button-waiting';
        dwBtn.disabled = true;
        bqBtn.className = 'action-button button-waiting';
        bqBtn.disabled = true;

        regens.forEach(r => r.style.display = 'none');

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); font-style: italic;">
                Generated content will appear here...
            </p>
        `;
        
        document.querySelector('.tab[data-tab="generate"]').click();
    }
}

function initializeImageToCodeApp() {
    // State management
    let generatedDescription = '';
    let generatedBackend = '';
    let generatedFrontend = '';
    let generatedTestCases = '';
    let generatedTestScript = '';
    let currentUseCase = 'Sprint Planning';
    let uploadedImageData = null;

    updateRadioVisuals();
    initializeTabs();
    initializeUseCaseHandling();
    initializeImageUpload();
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateRadioVisuals);
    });

    function updateRadioVisuals() {
        document.querySelectorAll('.radio-item').forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${targetTab}`);
                });
            });
        });
    }

    function initializeUseCaseHandling() {
        const useCaseRadios = document.querySelectorAll('input[name="use_case"]');
        const descriptionTextarea = document.getElementById('use_case_description');
        const customPromptSection = document.getElementById('custom_prompt_section');
        const uploadSection = document.getElementById('upload_section');
        const defaultImageSection = document.getElementById('default_image_section');
        const defaultImage = document.getElementById('default_image');
        const imageSourceText = document.getElementById('image_source_text');

        // Add smooth transitions and animations
        function addImageLoadingEffect(img) {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease';
            
            img.onload = function() {
                setTimeout(() => {
                    img.style.opacity = '1';
                }, 100);
            };
        }
        
        const useCaseDescriptions = {
            "Sprint Planning": "This use case focuses on creating a development plan for a login screen. It includes generating backend, frontend, and deployment code based on the image analysis.",
            "Random Jokes Website": "This use case involves creating a website that generates random jokes using Vertex AI. It includes backend, frontend, and deployment code generation based on a napkin sketch.",
            "Test Plan Generation": "This use case is centered around creating a comprehensive test plan for a login screen. It includes generating test cases, test execution scripts, and Selenium automation scripts.",
            "Custom Use Case": "This option allows you to upload your own image and provide a custom prompt for analysis. You can then generate various outputs based on your specific needs."
        };

        const useCaseImages = {
            "Sprint Planning": {
                url: "https://storage.googleapis.com/convento-samples/tela-login.png",
                description: "Login screen image from gs://convento-samples/tela-login.png"
            },
            "Random Jokes Website": {
                url: "https://storage.googleapis.com/convento-samples/guardanapo.jpg",
                description: "Napkin sketch from gs://convento-samples/guardanapo.jpg"
            },
            "Test Plan Generation": {
                url: "https://storage.googleapis.com/convento-samples/tela-login.png",
                description: "Login screen image from gs://convento-samples/tela-login.png"
            }
        };

        function updateUseCase() {
            const selectedUseCase = document.querySelector('input[name="use_case"]:checked')?.value;
            if (selectedUseCase) {
                currentUseCase = selectedUseCase;
                descriptionTextarea.value = useCaseDescriptions[selectedUseCase];
                
                if (selectedUseCase === 'Custom Use Case') {
                    // Show custom sections, hide default image
                    customPromptSection.style.display = 'block';
                    uploadSection.style.display = 'block';
                    defaultImageSection.style.display = 'none';
                } else {
                    // Show default image, hide custom sections
                    customPromptSection.style.display = 'none';
                    uploadSection.style.display = 'none';
                    defaultImageSection.style.display = 'block';
                    
                    // Set the default image for this use case
                    const imageConfig = useCaseImages[selectedUseCase];
                    if (imageConfig) {
                        defaultImage.src = imageConfig.url;
                        // Remove the image source text display
                        imageSourceText.textContent = '';
                    }
                }
                
                generateWorkflowButtons();
            }
        }

        useCaseRadios.forEach(radio => {
            radio.addEventListener('change', updateUseCase);
        });

        // Initialize with first option
        updateUseCase();
    }

    function initializeImageUpload() {
        const imageUpload = document.getElementById('image_upload');
        const imagePreview = document.getElementById('image_preview');
        const previewImg = document.getElementById('preview_img');

        imageUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('image', file);

                try {
                    const response = await fetch('/image_to_code/upload_image', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();

                    if (result.success) {
                        uploadedImageData = result.image_data;
                        previewImg.src = result.image_data;
                        imagePreview.style.display = 'block';
                    } else {
                        alert('Error uploading image: ' + result.error);
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Error uploading image. Please try again.');
                }
            }
        });
    }

    function generateWorkflowButtons() {
        const container = document.getElementById('generation_buttons');
        container.innerHTML = '';

        let workflow = [];

        if (currentUseCase === 'Test Plan Generation') {
            workflow = [
                { id: 'description', label: '1. Generate Initial Description', icon: 'fas fa-file-alt' },
                { id: 'test_cases', label: '2. Generate Test Cases', icon: 'fas fa-list-check' },
                { id: 'test_script', label: '3. Generate Test Script', icon: 'fas fa-code' },
                { id: 'selenium', label: '4. Generate Selenium Script', icon: 'fas fa-robot' }
            ];
        } else {
            workflow = [
                { id: 'description', label: '1. Generate Initial Description', icon: 'fas fa-file-alt' },
                { id: 'backend', label: '2. Generate Backend Code', icon: 'fas fa-server' },
                { id: 'frontend', label: '3. Generate Frontend Code', icon: 'fas fa-code' },
                { id: 'deployment', label: '4. Generate Deployment Scripts', icon: 'fas fa-cloud' }
            ];
        }

        workflow.forEach((step, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'action-button-wrapper';

            const button = document.createElement('button');
            button.id = `generate_${step.id}_btn`;
            button.className = index === 0 ? 'action-button button-ready' : 'action-button button-waiting';
            button.disabled = index !== 0;
            button.innerHTML = `
                <span><i class="${step.icon}"></i> ${step.label}</span>
                <div class="loader" id="loader_${step.id}"></div>
            `;

            const regenIcon = document.createElement('i');
            regenIcon.className = 'fas fa-redo regenerate-icon';
            regenIcon.id = `regen_${step.id}_btn`;
            regenIcon.style.display = 'none';

            button.addEventListener('click', () => handleGeneration(step.id));
            regenIcon.addEventListener('click', () => handleGeneration(step.id));

            wrapper.appendChild(button);
            wrapper.appendChild(regenIcon);
            container.appendChild(wrapper);
        });

        // Add clear all button functionality
        const clearAllBtn = document.getElementById('clear_all_btn');
        if (clearAllBtn) {
            clearAllBtn.removeEventListener('click', clearAll);
            clearAllBtn.addEventListener('click', clearAll);
        }
    }

    async function handleGeneration(type) {
        const btn = document.getElementById(`generate_${type}_btn`);
        const loader = document.getElementById(`loader_${type}`);
        const regenBtn = document.getElementById(`regen_${type}_btn`);
        
        btn.disabled = true;
        loader.style.display = 'inline-block';
        regenBtn.style.display = 'none';

        // Collect form data manually to ensure radio buttons are captured
        const data = {
            use_case: document.querySelector('input[name="use_case"]:checked')?.value || 'Sprint Planning',
            model_name: document.querySelector('input[name="model_name"]:checked')?.value || 'gemini-2.5-flash',
            story_lang: document.querySelector('input[name="story_lang"]:checked')?.value || 'English'
        };
        
        // Add custom prompt for custom use case
        if (currentUseCase === 'Custom Use Case') {
            data.custom_prompt = document.getElementById('custom_prompt')?.value || '';
        }
        
        // Add dependent content
        if (type === 'backend') data.description_content = generatedDescription;
        if (type === 'frontend') data.backend_content = generatedBackend;
        if (type === 'deployment') {
            data.backend_content = generatedBackend;
            data.frontend_content = generatedFrontend;
        }
        if (type === 'test_cases') data.description_content = generatedDescription;
        if (type === 'test_script') data.test_cases_content = generatedTestCases;
        if (type === 'selenium') data.test_cases_content = generatedTestCases;

        try {
            const response = await fetch(`/image_to_code/generate/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.error) {
                alert(`Error: ${result.error}`);
                btn.disabled = false;
                return;
            }
            
            // Store generated content
            if (type === 'description') generatedDescription = result.content;
            if (type === 'backend') generatedBackend = result.content;
            if (type === 'frontend') generatedFrontend = result.content;
            if (type === 'test_cases') generatedTestCases = result.content;
            if (type === 'test_script') generatedTestScript = result.content;

            displayResult(type, result.content, result.prompt);
            updateButton(btn, regenBtn, getNextButton(type));

        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
            btn.disabled = false;
        } finally {
            loader.style.display = 'none';
        }
    }

    function getNextButton(currentType) {
        const workflows = {
            'Test Plan Generation': ['description', 'test_cases', 'test_script', 'selenium'],
            'default': ['description', 'backend', 'frontend', 'deployment']
        };
        
        const workflow = workflows[currentUseCase] || workflows['default'];
        const currentIndex = workflow.indexOf(currentType);
        
        if (currentIndex < workflow.length - 1) {
            return document.getElementById(`generate_${workflow[currentIndex + 1]}_btn`);
        }
        return null;
    }

    function updateButton(currentBtn, regenBtn, nextBtn) {
        currentBtn.className = 'action-button button-completed';
        currentBtn.disabled = false;
        regenBtn.style.display = 'block';
        if (nextBtn) {
            nextBtn.className = 'action-button button-ready';
            nextBtn.disabled = false;
        }
    }

    function displayResult(type, content, prompt) {
        const container = document.getElementById('results-container');
        const placeholder = container.querySelector('p');
        if (placeholder) placeholder.remove();
        
        const resultId = `result-${type}`;
        let existingResult = document.getElementById(resultId);
        if (existingResult) existingResult.remove();

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.id = resultId;

        const typeIcons = {
            'description': 'fas fa-file-alt',
            'backend': 'fas fa-server',
            'frontend': 'fas fa-code',
            'deployment': 'fas fa-cloud',
            'test_cases': 'fas fa-list-check',
            'test_script': 'fas fa-code',
            'selenium': 'fas fa-robot'
        };

        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <h4><i class="${typeIcons[type]}"></i> ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}</h4>
            <i class="fas fa-chevron-down expand-icon"></i>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'result-content';
        const markdownHtml = marked.parse(content);
        
        contentDiv.innerHTML = `
            <div class="content-section">
                <h5><i class="fas fa-file-alt"></i> Generated Content</h5>
                <div class="markdown-content">${markdownHtml}</div>
            </div>
            <div class="content-section">
                <h5><i class="fas fa-code"></i> Prompt Used</h5>
                <pre class="prompt-content">${prompt}</pre>
            </div>
        `;

        header.addEventListener('click', () => {
            contentDiv.classList.toggle('visible');
            header.classList.toggle('expanded');
        });

        resultItem.appendChild(header);
        resultItem.appendChild(contentDiv);
        container.prepend(resultItem);
        
        setTimeout(() => header.click(), 100);
        
        document.querySelector('.tab[data-tab="results"]').click();
    }

    function clearAll() {
        generatedDescription = '';
        generatedBackend = '';
        generatedFrontend = '';
        generatedTestCases = '';
        generatedTestScript = '';

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); font-style: italic;">
                Generated content will appear here...
            </p>
        `;
        
        // Regenerate buttons based on current use case
        generateWorkflowButtons();
        
        document.querySelector('.tab[data-tab="generate"]').click();
    }
}

function initializeStoryToApiApp() {
    // State management
    let generatedStory = '';
    let generatedTasks = '';
    let generatedOpenapi = '';

    // Element references
    const storyBtn = document.getElementById('generate_story_btn');
    const tasksBtn = document.getElementById('generate_tasks_btn');
    const openapiBtn = document.getElementById('generate_openapi_btn');
    const apigeeBtn = document.getElementById('generate_apigee_btn');
    
    const regenStoryBtn = document.getElementById('regen_story_btn');
    const regenTasksBtn = document.getElementById('regen_tasks_btn');
    const regenOpenapiBtn = document.getElementById('regen_openapi_btn');
    const regenApigeeBtn = document.getElementById('regen_apigee_btn');

    const clearAllBtn = document.getElementById('clear_all_btn');

    updateRadioVisuals();
    initializeTabs();
    initializeGenerationButtons();

    const userStorySelect = document.getElementById('user_story_select');
    const userStoryTextarea = document.getElementById('user_story');
    if (userStorySelect && userStoryTextarea) {
        userStoryTextarea.value = userStorySelect.value;
        userStorySelect.addEventListener('change', () => {
            userStoryTextarea.value = userStorySelect.value;
        });
    }
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateRadioVisuals);
    });

    function updateRadioVisuals() {
        document.querySelectorAll('.radio-item').forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${targetTab}`);
                });
            });
        });
    }

    function initializeGenerationButtons() {
        if(storyBtn) storyBtn.addEventListener('click', () => handleGeneration('story'));
        if(tasksBtn) tasksBtn.addEventListener('click', () => handleGeneration('tasks'));
        if(openapiBtn) openapiBtn.addEventListener('click', () => handleGeneration('openapi'));
        if(apigeeBtn) apigeeBtn.addEventListener('click', () => handleGeneration('apigee'));

        if(regenStoryBtn) regenStoryBtn.addEventListener('click', () => handleGeneration('story'));
        if(regenTasksBtn) regenTasksBtn.addEventListener('click', () => handleGeneration('tasks'));
        if(regenOpenapiBtn) regenOpenapiBtn.addEventListener('click', () => handleGeneration('openapi'));
        if(regenApigeeBtn) regenApigeeBtn.addEventListener('click', () => handleGeneration('apigee'));

        if(clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
    }

    async function handleGeneration(type) {
        const buttons = {
            story: { btn: storyBtn, loader: 'loader_story', regen: regenStoryBtn, nextBtn: tasksBtn },
            tasks: { btn: tasksBtn, loader: 'loader_tasks', regen: regenTasksBtn, nextBtn: openapiBtn },
            openapi: { btn: openapiBtn, loader: 'loader_openapi', regen: regenOpenapiBtn, nextBtn: apigeeBtn },
            apigee: { btn: apigeeBtn, loader: 'loader_apigee', regen: regenApigeeBtn, nextBtn: null }
        };

        const current = buttons[type];
        const loader = document.getElementById(current.loader);
        
        current.btn.disabled = true;
        loader.style.display = 'inline-block';
        current.regen.style.display = 'none';

        const formData = new FormData(document.getElementById('config-form'));
        const data = Object.fromEntries(formData.entries());
        data.user_story = document.getElementById('user_story').value;
        
        if (type === 'tasks') data.story_content = generatedStory;
        if (type === 'openapi') data.tasks_content = generatedTasks;
        if (type === 'apigee') data.openapi_content = generatedOpenapi;

        try {
            const response = await fetch(`/story_to_api/generate/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.error) {
                alert(`Error: ${result.error}`);
                current.btn.disabled = false; // Re-enable on error
                return;
            }
            
            if (type === 'story') generatedStory = result.content;
            if (type === 'tasks') generatedTasks = result.content;
            if (type === 'openapi') generatedOpenapi = result.content;

            displayResult(type, result.content, result.prompt);
            updateButton(current.btn, current.regen, current.nextBtn);

        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
            current.btn.disabled = false; // Re-enable on error
        } finally {
            loader.style.display = 'none';
        }
    }

    function updateButton(currentBtn, regenBtn, nextBtn) {
        currentBtn.className = 'action-button button-completed';
        currentBtn.disabled = false;
        regenBtn.style.display = 'block';
        if (nextBtn) {
            nextBtn.className = 'action-button button-ready';
            nextBtn.disabled = false;
        }
    }

    function displayResult(type, content, prompt) {
        const container = document.getElementById('results-container');
        const placeholder = container.querySelector('p');
        if (placeholder) placeholder.remove();
        
        const resultId = `result-${type}`;
        let existingResult = document.getElementById(resultId);
        if (existingResult) existingResult.remove();

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.id = resultId;

        const typeIcons = {
            'story': 'fas fa-book',
            'tasks': 'fas fa-tasks',
            'openapi': 'fas fa-server',
            'apigee': 'fas fa-cloud'
        };

        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <h4><i class="${typeIcons[type]}"></i> ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
            <i class="fas fa-chevron-down expand-icon"></i>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'result-content';
        const markdownHtml = marked.parse(content);
        
        contentDiv.innerHTML = `
            <div class="content-section">
                <h5><i class="fas fa-file-alt"></i> Generated Content</h5>
                <div class="markdown-content">${markdownHtml}</div>
            </div>
            <div class="content-section">
                <h5><i class="fas fa-code"></i> Prompt Used</h5>
                <pre class="prompt-content">${prompt}</pre>
            </div>
        `;

        header.addEventListener('click', () => {
            contentDiv.classList.toggle('visible');
            header.classList.toggle('expanded');
        });

        resultItem.appendChild(header);
        resultItem.appendChild(contentDiv);
        container.prepend(resultItem);
        
        setTimeout(() => header.click(), 100);
        
        document.querySelector('.tab[data-tab="results"]').click();
    }

    function clearAll() {
        generatedStory = '';
        generatedTasks = '';
        generatedOpenapi = '';

        const buttons = [storyBtn, tasksBtn, openapiBtn, apigeeBtn];
        const regens = [regenStoryBtn, regenTasksBtn, regenOpenapiBtn, regenApigeeBtn];

        storyBtn.className = 'action-button button-ready';
        storyBtn.disabled = false;
        
        tasksBtn.className = 'action-button button-waiting';
        tasksBtn.disabled = true;
        openapiBtn.className = 'action-button button-waiting';
        openapiBtn.disabled = true;
        apigeeBtn.className = 'action-button button-waiting';
        apigeeBtn.disabled = true;

        regens.forEach(r => r.style.display = 'none');

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); font-style: italic;">
                Generated content will appear here...
            </p>
        `;
        
        document.querySelector('.tab[data-tab="generate"]').click();
    }
}

function initializeRepoInspectionApp() {
    const analysisTypeSelect = document.getElementById('analysis_type');
    const analysisDescriptionTextarea = document.getElementById('analysis_description');
    const customPromptGroup = document.getElementById('custom_prompt_group');
    const cloneBtn = document.getElementById('clone_btn');
    const generateBtn = document.getElementById('generate_analysis_btn');
    const resultsContainer = document.getElementById('results-container');
    const clearAllBtn = document.getElementById('clear_all_btn');

    let analysisOptions = {};
    let codeIndex = null;
    let codeText = null;

    initializeTabs();

    // Fetch analysis options from the DOM (passed from Flask)
    const analysisOptionsData = document.getElementById('analysis-options-data');
    if (analysisOptionsData) {
        try {
            analysisOptions = JSON.parse(analysisOptionsData.textContent);
        } catch (e) {
            console.error("Could not parse analysis options:", e);
        }
    }

    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${targetTab}`);
                });
            });
        });
    }

    function updateDescription() {
        if (!analysisTypeSelect) return;
        const selectedType = analysisTypeSelect.value;
        if (analysisOptions[selectedType]) {
            analysisDescriptionTextarea.value = analysisOptions[selectedType];
        }
        
        if (selectedType === 'custom') {
            customPromptGroup.style.display = 'block';
            analysisDescriptionTextarea.style.display = 'none';
        } else {
            customPromptGroup.style.display = 'none';
            analysisDescriptionTextarea.style.display = 'block';
        }
    }

    async function cloneAndIndex() {
        const repoUrl = document.getElementById('repo_url').value;
        if (!repoUrl) {
            alert('Please enter a repository URL.');
            return;
        }

        setButtonState(cloneBtn, 'loading');
        resultsContainer.innerHTML = '<p>Cloning and indexing repository...</p>';
        document.querySelector('.tab[data-tab="results"]').click();


        try {
            const response = await fetch('/repo_inspection/clone_and_index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_url: repoUrl }),
            });

            const data = await response.json();

            if (response.ok) {
                codeIndex = data.index;
                codeText = data.text;
                resultsContainer.innerHTML = `<p>${data.message}</p><p>Found ${codeIndex.length} files.</p>`;
                setButtonState(cloneBtn, 'success', 'regen_clone_btn');
                setButtonState(generateBtn, 'ready');
            } else {
                throw new Error(data.error || 'Unknown error occurred.');
            }
        } catch (error) {
            resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            setButtonState(cloneBtn, 'ready');
        }
    }

    async function generateAnalysis() {
        const modelName = document.querySelector('input[name="model_name"]:checked').value;
        const analysisType = analysisTypeSelect.value;
        let question = analysisOptions[analysisType];

        if (analysisType === 'custom') {
            question = document.getElementById('custom_prompt').value;
        }

        if (!question) {
            alert('Please select an analysis type or provide a custom prompt.');
            return;
        }

        if (!codeIndex || !codeText) {
            alert('Please clone and index a repository first.');
            return;
        }

        setButtonState(generateBtn, 'loading');
        resultsContainer.innerHTML = '<p>Generating analysis...</p>';
        document.querySelector('.tab[data-tab="results"]').click();

        try {
            const response = await fetch('/repo_inspection/generate_analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_name: modelName,
                    question: question,
                    code_index: codeIndex,
                    code_text: codeText,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                displayResult('analysis', data.content, data.prompt);
                setButtonState(generateBtn, 'success', 'regen_analysis_btn');
            } else {
                throw new Error(data.error || 'Unknown error occurred.');
            }
        } catch (error) {
            resultsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            setButtonState(generateBtn, 'ready');
        }
    }
    
    function clearAll() {
        codeIndex = null;
        codeText = null;
        resultsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-style: italic;">Generated content will appear here...</p>';
        setButtonState(cloneBtn, 'ready');
        setButtonState(generateBtn, 'waiting');
        document.getElementById('repo_url').value = 'https://github.com/GoogleCloudPlatform/microservices-demo';
        document.getElementById('regen_clone_btn').style.display = 'none';
        document.getElementById('regen_analysis_btn').style.display = 'none';
        document.querySelector('.tab[data-tab="configure"]').click();
    }

    function setButtonState(button, state, regenId) {
        const loader = button.querySelector('.loader');
        const regenIcon = regenId ? document.getElementById(regenId) : null;

        button.disabled = false;
        if(loader) loader.style.display = 'none';
        if(regenIcon) regenIcon.style.display = 'none';

        switch (state) {
            case 'loading':
                button.className = 'action-button button-loading';
                if(loader) loader.style.display = 'inline-block';
                button.disabled = true;
                break;
            case 'success':
                button.className = 'action-button button-completed';
                if(regenIcon) regenIcon.style.display = 'block';
                break;
            case 'ready':
                button.className = 'action-button button-ready';
                break;
            case 'waiting':
                button.className = 'action-button button-waiting';
                button.disabled = true;
                break;
        }
    }

    if (analysisTypeSelect) {
        analysisTypeSelect.addEventListener('change', updateDescription);
        updateDescription();
    }
    if (cloneBtn) {
        cloneBtn.addEventListener('click', cloneAndIndex);
        document.getElementById('regen_clone_btn').addEventListener('click', cloneAndIndex);
    }
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAnalysis);
        document.getElementById('regen_analysis_btn').addEventListener('click', generateAnalysis);
    }
    if(clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAll);
    }

    function displayResult(type, content, prompt) {
        const container = document.getElementById('results-container');
        const placeholder = container.querySelector('p');
        if (placeholder) placeholder.remove();
        
        const resultId = `result-${type}`;
        let existingResult = document.getElementById(resultId);
        if (existingResult) existingResult.remove();

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.id = resultId;

        const typeIcons = {
            'analysis': 'fas fa-search'
        };

        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <h4><i class="${typeIcons[type]}"></i> ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
            <i class="fas fa-chevron-down expand-icon"></i>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'result-content';
        const markdownHtml = marked.parse(content);
        
        contentDiv.innerHTML = `
            <div class="content-section">
                <h5><i class="fas fa-file-alt"></i> Generated Content</h5>
                <div class="markdown-content">${markdownHtml}</div>
            </div>
            <div class="content-section">
                <h5><i class="fas fa-code"></i> Prompt Used</h5>
                <pre class="prompt-content">${prompt}</pre>
            </div>
        `;

        header.addEventListener('click', () => {
            contentDiv.classList.toggle('visible');
            header.classList.toggle('expanded');
        });

        resultItem.appendChild(header);
        resultItem.appendChild(contentDiv);
        container.prepend(resultItem);
        
        setTimeout(() => header.click(), 100);
        
        document.querySelector('.tab[data-tab="results"]').click();
    }
}

function initializeRepoCacheAnalysisApp() {
    // State
    let sessionCache = {
        name: null,
        char_count: 0,
        code_index: null,
        code_text: null,
        costs: []
    };

    // Element References
    const processRepoBtn = document.getElementById('process_repo_btn');
    const generateAnalysisBtn = document.getElementById('generate_analysis_btn');
    const listCachesBtn = document.getElementById('list_caches_btn');
    const deleteCacheBtn = document.getElementById('delete_cache_btn');
    const cacheTtlSlider = document.getElementById('cache_ttl');
    const cacheTtlValue = document.getElementById('cache_ttl_value');
    const analysisTypeSelect = document.getElementById('analysis_type');
    const analysisDescription = document.getElementById('analysis_description');
    const customPromptGroup = document.getElementById('custom_prompt_group');
    const customPrompt = document.getElementById('custom_prompt');
    const resultsContainer = document.getElementById('results-container');
    const costsContainer = document.getElementById('costs-container');
    const cachesListContainer = document.getElementById('caches-list-container');
    const cacheSelect = document.getElementById('cache_select');

    const analysisOptions = {
        "summary": "Provide a comprehensive summary of the codebase, highlighting its architecture, main components, and top 3 key learnings for developers.",
        "readme": "Generate a detailed README for the application, including project overview, setup instructions, main features, and contribution guidelines.",
        "onboarding": "Create an in-depth getting started guide for new developers, covering setup process, code structure, development workflow, and best practices.",
        "issues": "Conduct a thorough code review to identify and explain the top 3 most critical issues or areas for improvement in the codebase.",
        "bug_fix": "Identify the most severe potential bug or vulnerability in the codebase, explain its impact, and provide a detailed fix with code examples.",
        "troubleshooting": "Develop a comprehensive troubleshooting guide for common issues, including potential error scenarios, diagnostics steps, and resolution procedures.",
        "custom": "Custom analysis (specify your own prompt)"
    };

    initializeTabs();
    initializeEventListeners();
    updateAnalysisDescription();

    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${targetTab}`);
                });
            });
        });
    }

    function initializeEventListeners() {
        if (cacheTtlSlider) {
            cacheTtlSlider.addEventListener('input', () => {
                const hours = cacheTtlSlider.value;
                cacheTtlValue.textContent = `${hours} hour${hours > 1 ? 's' : ''}`;
            });
        }

        if (analysisTypeSelect) {
            analysisTypeSelect.addEventListener('change', updateAnalysisDescription);
        }

        if (processRepoBtn) processRepoBtn.addEventListener('click', handleProcessRepository);
        if (generateAnalysisBtn) generateAnalysisBtn.addEventListener('click', handleGenerateAnalysis);
        if (listCachesBtn) listCachesBtn.addEventListener('click', handleListCaches);
        if (deleteCacheBtn) deleteCacheBtn.addEventListener('click', handleDeleteCache);
    }

    function updateAnalysisDescription() {
        const selected = analysisTypeSelect.value;
        analysisDescription.value = analysisOptions[selected] || '';
        customPromptGroup.style.display = selected === 'custom' ? 'block' : 'none';
    }

    function setButtonState(button, state) {
        const loader = button.querySelector('.loader');
        button.disabled = false;
        if (loader) loader.style.display = 'none';
        button.classList.remove('button-loading', 'button-completed', 'button-ready', 'button-waiting');

        switch (state) {
            case 'loading':
                button.disabled = true;
                button.classList.add('button-loading');
                if (loader) loader.style.display = 'inline-block';
                break;
            case 'completed':
                button.classList.add('button-completed');
                break;
            case 'ready':
                button.classList.add('button-ready');
                break;
            case 'waiting':
                button.classList.add('button-waiting');
                button.disabled = true;
                break;
        }
    }

    async function handleProcessRepository() {
        const repoUrl = document.getElementById('repo_url').value;
        if (!repoUrl) {
            alert('Please enter a repository URL.');
            return;
        }
        setButtonState(processRepoBtn, 'loading');
        resultsContainer.innerHTML = `<p class="placeholder-text">Cloning, indexing, and caching repository... This may take a moment.</p>`;

        try {
            const response = await fetch('/repo_cache_analysis/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo_url: repoUrl,
                    cache_ttl: parseInt(cacheTtlSlider.value, 10)
                })
            });
            const data = await response.json();

            if (response.ok) {
                sessionCache.name = data.cache_name;
                sessionCache.char_count = data.char_count;
                sessionCache.code_index = data.code_index;
                sessionCache.code_text = data.code_text;
                sessionCache.costs = []; // Reset costs for new repo

                resultsContainer.innerHTML = `<p class="placeholder-text" style="color: var(--success-color);">${data.message}</p>`;
                setButtonState(processRepoBtn, 'completed');
                setButtonState(generateAnalysisBtn, 'ready');
                updateCostsDisplay();
            } else {
                throw new Error(data.error || 'An unknown error occurred.');
            }
        } catch (error) {
            resultsContainer.innerHTML = `<p class="placeholder-text" style="color: var(--danger-color);">Error: ${error.message}</p>`;
            setButtonState(processRepoBtn, 'ready');
        }
    }

    async function handleGenerateAnalysis() {
        if (!sessionCache.name) {
            alert('Please process a repository first.');
            return;
        }

        const analysisType = analysisTypeSelect.value;
        const question = analysisType === 'custom' ? customPrompt.value : analysisOptions[analysisType];

        if (!question) {
            alert('Please select an analysis type or provide a custom prompt.');
            return;
        }

        setButtonState(generateAnalysisBtn, 'loading');
        resultsContainer.innerHTML = `<p class="placeholder-text">Generating analysis...</p>`;

        try {
            const response = await fetch('/repo_cache_analysis/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    cache_name: sessionCache.name,
                    code_index: sessionCache.code_index,
                    code_text: sessionCache.code_text
                })
            });
            const data = await response.json();

            if (response.ok) {
                const analysisHtml = marked.parse(data.analysis);
                resultsContainer.innerHTML = `<div class="markdown-content">${analysisHtml}</div>`;
                
                // Simple cost calculation for display
                const isFirstRequest = sessionCache.costs.length === 0;
                const cost = calculateCacheCost(sessionCache.char_count, parseInt(cacheTtlSlider.value, 10), 1, sessionCache.char_count, data.analysis.length, isFirstRequest);
                sessionCache.costs.push({type: analysisType, ...cost});
                updateCostsDisplay();

            } else {
                throw new Error(data.error || 'An unknown error occurred.');
            }
        } catch (error) {
            resultsContainer.innerHTML = `<p class="placeholder-text" style="color: var(--danger-color);">Error: ${error.message}</p>`;
        } finally {
            setButtonState(generateAnalysisBtn, 'ready');
        }
    }

    async function handleListCaches() {
        cachesListContainer.innerHTML = `<p class="placeholder-text">Fetching caches...</p>`;
        try {
            const response = await fetch('/repo_cache_analysis/caches');
            const caches = await response.json();

            if (response.ok) {
                if (caches.length > 0) {
                    let tableHtml = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Cache ID</th>
                                    <th>Model</th>
                                    <th>Create Time</th>
                                    <th>Expire Time</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    caches.forEach(cache => {
                        const cacheId = cache.name ? cache.name.split('/').pop() : 'N/A';
                        const modelName = cache.modelName ? cache.modelName.split('/').pop() : 'N/A';
                        const createTime = cache.createTime ? new Date(cache.createTime).toLocaleString() : 'N/A';
                        const expireTime = cache.expireTime ? new Date(cache.expireTime).toLocaleString() : 'N/A';

                        tableHtml += `
                            <tr>
                                <td>${cacheId}</td>
                                <td>${modelName}</td>
                                <td>${createTime}</td>
                                <td>${expireTime}</td>
                            </tr>
                        `;
                    });
                    tableHtml += `</tbody></table>`;
                    cachesListContainer.innerHTML = tableHtml;

                    cacheSelect.innerHTML = caches.filter(c => c.name).map(c => `<option value="${c.name}">${c.name.split('/').pop()}</option>`).join('');
                    cacheSelect.style.display = 'block';
                    deleteCacheBtn.style.display = 'block';

                } else {
                    cachesListContainer.innerHTML = `<p class="placeholder-text">No active caches found.</p>`;
                    cacheSelect.style.display = 'none';
                    deleteCacheBtn.style.display = 'none';
                }
            } else {
                throw new Error(caches.error || 'Failed to list caches.');
            }
        } catch (error) {
            cachesListContainer.innerHTML = `<p class="placeholder-text" style="color: var(--danger-color);">Error: ${error.message}</p>`;
        }
    }

    async function handleDeleteCache() {
        const selectedCacheName = cacheSelect.value;
        if (!selectedCacheName) {
            alert('Please select a cache to delete.');
            return;
        }

        if (!confirm(`Are you sure you want to delete cache ${selectedCacheName.split('/').pop()}?`)) {
            return;
        }

        try {
            const response = await fetch(`/repo_cache_analysis/caches/${encodeURIComponent(selectedCacheName)}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                handleListCaches(); // Refresh the list
            } else {
                throw new Error(data.error || 'Failed to delete cache.');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
    
    function calculateCacheCost(cachedChars, storageHours, numRequests, inputChars, outputChars, isFirstRequest) {
        const cacheCreationCost = isFirstRequest ? cachedChars * (0.0003125 / 1000) : 0;
        const storageCost = isFirstRequest ? (cachedChars * storageHours) * (0.001125 / 1000) : 0;
        const charInputCost = (inputChars * numRequests) * (0.0003125 / 1000);
        const cachedInputCost = (cachedChars * numRequests) * (0.000078125 / 1000);
        const totalInputCost = charInputCost + cachedInputCost;
        const outputCost = (outputChars * numRequests) * (0.00375 / 1000);
        const totalCost = cacheCreationCost + storageCost + totalInputCost + outputCost;

        return {
            "Cache Creation ($)": cacheCreationCost,
            "Storage ($)": storageCost,
            "Input ($)": totalInputCost,
            "Output ($)": outputCost,
            "Total ($)": totalCost,
        };
    }

    function updateCostsDisplay() {
        if (sessionCache.costs.length === 0) {
            costsContainer.innerHTML = `<p class="placeholder-text">Cost breakdown will appear here...</p>`;
            return;
        }

        let cumulativeCost = 0;
        const costRows = sessionCache.costs.map(cost => {
            cumulativeCost += cost["Total ($)"];
            return {
                "Analysis": cost.type.charAt(0).toUpperCase() + cost.type.slice(1),
                "Cache Creation ($)": cost["Cache Creation ($)"].toFixed(6),
                "Storage ($)": cost["Storage ($)"].toFixed(6),
                "Input ($)": cost["Input ($)"].toFixed(6),
                "Output ($)": cost["Output ($)"].toFixed(6),
                "Total ($)": cost["Total ($)"].toFixed(6),
                "Cumulative Cost ($)": cumulativeCost.toFixed(6)
            };
        });

        let tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Analysis</th>
                        <th>Creation ($)</th>
                        <th>Storage ($)</th>
                        <th>Input ($)</th>
                        <th>Output ($)</th>
                        <th>Total ($)</th>
                        <th>Cumulative ($)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        costRows.forEach(row => {
            tableHtml += `
                <tr>
                    <td>${row.Analysis}</td>
                    <td>${row["Cache Creation ($)"]}</td>
                    <td>${row["Storage ($)"]}</td>
                    <td>${row["Input ($)"]}</td>
                    <td>${row["Output ($)"]}</td>
                    <td>${row["Total ($)"]}</td>
                    <td>${row["Cumulative Cost ($)"]}</td>
                </tr>
            `;
        });
        tableHtml += `</tbody></table>`;
        costsContainer.innerHTML = tableHtml;
    }
}

function initializeStoryToCodeApp() {
    // State management
    let generatedStory = '';
    let generatedTasks = '';
    let generatedCode = '';

    // Element references
    const storyBtn = document.getElementById('generate_story_btn');
    const tasksBtn = document.getElementById('generate_tasks_btn');
    const codeBtn = document.getElementById('generate_code_btn');
    const testBtn = document.getElementById('generate_test_btn');
    
    const regenStoryBtn = document.getElementById('regen_story_btn');
    const regenTasksBtn = document.getElementById('regen_tasks_btn');
    const regenCodeBtn = document.getElementById('regen_code_btn');
    const regenTestBtn = document.getElementById('regen_test_btn');

    const clearAllBtn = document.getElementById('clear_all_btn');

    updateRadioVisuals();
    initializeTabs();
    initializeGenerationButtons();

    const userStorySelect = document.getElementById('user_story_select');
    const userStoryTextarea = document.getElementById('user_story');
    if (userStorySelect && userStoryTextarea) {
        userStoryTextarea.value = userStorySelect.value;
        userStorySelect.addEventListener('change', () => {
            userStoryTextarea.value = userStorySelect.value;
        });
    }
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateRadioVisuals);
    });

    function updateRadioVisuals() {
        document.querySelectorAll('.radio-item').forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${targetTab}`);
                });
            });
        });
    }

    function initializeGenerationButtons() {
        if(storyBtn) storyBtn.addEventListener('click', () => handleGeneration('story'));
        if(tasksBtn) tasksBtn.addEventListener('click', () => handleGeneration('tasks'));
        if(codeBtn) codeBtn.addEventListener('click', () => handleGeneration('code'));
        if(testBtn) testBtn.addEventListener('click', () => handleGeneration('test'));

        if(regenStoryBtn) regenStoryBtn.addEventListener('click', () => handleGeneration('story'));
        if(regenTasksBtn) regenTasksBtn.addEventListener('click', () => handleGeneration('tasks'));
        if(regenCodeBtn) regenCodeBtn.addEventListener('click', () => handleGeneration('code'));
        if(regenTestBtn) regenTestBtn.addEventListener('click', () => handleGeneration('test'));

        if(clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
    }

    async function handleGeneration(type) {
        const buttons = {
            story: { btn: storyBtn, loader: 'loader_story', regen: regenStoryBtn, nextBtn: tasksBtn },
            tasks: { btn: tasksBtn, loader: 'loader_tasks', regen: regenTasksBtn, nextBtn: codeBtn },
            code: { btn: codeBtn, loader: 'loader_code', regen: regenCodeBtn, nextBtn: testBtn },
            test: { btn: testBtn, loader: 'loader_test', regen: regenTestBtn, nextBtn: null }
        };

        const current = buttons[type];
        const loader = document.getElementById(current.loader);
        
        current.btn.disabled = true;
        loader.style.display = 'inline-block';
        current.regen.style.display = 'none';

        const formData = new FormData(document.getElementById('config-form'));
        const data = Object.fromEntries(formData.entries());
        data.user_story = document.getElementById('user_story').value;
        
        if (type === 'tasks') data.story_content = generatedStory;
        if (type === 'code') data.tasks_content = generatedTasks;
        if (type === 'test') data.code_content = generatedCode;

        try {
            const response = await fetch(`/story_to_code/generate/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.error) {
                alert(`Error: ${result.error}`);
                current.btn.disabled = false; // Re-enable on error
                return;
            }
            
            if (type === 'story') generatedStory = result.content;
            if (type === 'tasks') generatedTasks = result.content;
            if (type === 'code') generatedCode = result.content;

            displayResult(type, result.content, result.prompt);
            updateButton(current.btn, current.regen, current.nextBtn);

        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
            current.btn.disabled = false; // Re-enable on error
        } finally {
            loader.style.display = 'none';
        }
    }

    function updateButton(currentBtn, regenBtn, nextBtn) {
        currentBtn.className = 'action-button button-completed';
        currentBtn.disabled = false;
        regenBtn.style.display = 'block';
        if (nextBtn) {
            nextBtn.className = 'action-button button-ready';
            nextBtn.disabled = false;
        }
    }

    function displayResult(type, content, prompt) {
        const container = document.getElementById('results-container');
        const placeholder = container.querySelector('p');
        if (placeholder) placeholder.remove();
        
        const resultId = `result-${type}`;
        let existingResult = document.getElementById(resultId);
        if (existingResult) existingResult.remove();

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.id = resultId;

        const typeIcons = {
            'story': 'fas fa-book',
            'tasks': 'fas fa-tasks',
            'code': 'fas fa-code',
            'test': 'fas fa-vial'
        };

        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <h4><i class="${typeIcons[type]}"></i> ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
            <i class="fas fa-chevron-down expand-icon"></i>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'result-content';
        const markdownHtml = marked.parse(content);
        
        contentDiv.innerHTML = `
            <div class="content-section">
                <h5><i class="fas fa-file-alt"></i> Generated Content</h5>
                <div class="markdown-content">${markdownHtml}</div>
            </div>
            <div class="content-section">
                <h5><i class="fas fa-code"></i> Prompt Used</h5>
                <pre class="prompt-content">${prompt}</pre>
            </div>
        `;

        header.addEventListener('click', () => {
            contentDiv.classList.toggle('visible');
            header.classList.toggle('expanded');
        });

        resultItem.appendChild(header);
        resultItem.appendChild(contentDiv);
        container.prepend(resultItem);
        
        setTimeout(() => header.click(), 100);
        
        document.querySelector('.tab[data-tab="results"]').click();
    }

    function clearAll() {
        generatedStory = '';
        generatedTasks = '';
        generatedCode = '';

        const buttons = [storyBtn, tasksBtn, codeBtn, testBtn];
        const regens = [regenStoryBtn, regenTasksBtn, regenCodeBtn, regenTestBtn];

        storyBtn.className = 'action-button button-ready';
        storyBtn.disabled = false;
        
        tasksBtn.className = 'action-button button-waiting';
        tasksBtn.disabled = true;
        codeBtn.className = 'action-button button-waiting';
        codeBtn.disabled = true;
        testBtn.className = 'action-button button-waiting';
        testBtn.disabled = true;

        regens.forEach(r => r.style.display = 'none');

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); font-style: italic;">
                Generated content will appear here...
            </p>
        `;
        
        document.querySelector('.tab[data-tab="generate"]').click();
    }
}
