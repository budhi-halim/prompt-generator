// Global State
const state = {
    step: 0,
    data: null,
    selectedModelIndex: null,
    selectedStyleIndex: null,
    dynamicInputs: {}
};

// DOM Elements
const contentArea = document.getElementById('content-area');
const backBtn = document.getElementById('back-btn');
const homeBtn = document.getElementById('home-btn');

// Icons
const ICONS = {
    forward: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" /></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`
};

// Init
async function init() {
    try {
        const response = await fetch('./data/prompt_template.json');
        if (!response.ok) throw new Error('Failed to load templates');
        state.data = await response.json();
        renderStep();
    } catch (error) {
        contentArea.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
    }
}

// Event Listeners
homeBtn.addEventListener('click', () => {
    state.step = 0;
    state.selectedModelIndex = null;
    state.selectedStyleIndex = null;
    state.dynamicInputs = {};
    renderStep();
});

backBtn.addEventListener('click', () => {
    if (state.step > 0) {
        state.step--;
        renderStep();
    }
});

// Render Logic
function renderStep() {
    // Reset Scroll
    window.scrollTo(0, 0);

    // Toggle Back Button visibility
    if (state.step === 0) {
        backBtn.classList.add('hidden');
    } else {
        backBtn.classList.remove('hidden');
    }

    contentArea.innerHTML = ''; // Clear current content
    contentArea.classList.remove('fade-in'); // Reset animation
    void contentArea.offsetWidth; // Trigger reflow
    contentArea.classList.add('fade-in'); // Add animation

    switch (state.step) {
        case 0:
            renderModelSelection();
            break;
        case 1:
            renderStyleSelection();
            break;
        case 2:
            renderDynamicForm();
            break;
        case 3:
            renderOutput();
            break;
        default:
            console.error('Unknown step');
    }
}

// Step 1: Model Selection
function renderModelSelection() {
    const title = document.createElement('h2');
    title.className = 'form-title';
    title.innerText = 'Select Model';
    contentArea.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'selection-grid';

    state.data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'selection-card';
        card.innerHTML = `
            <div class="card-title">${item.model.replace(/_/g, ' ')}</div>
            <div class="card-desc">Select to continue</div>
        `;
        card.onclick = () => {
            state.selectedModelIndex = index;
            state.step++;
            renderStep();
        };
        grid.appendChild(card);
    });

    contentArea.appendChild(grid);
}

// Step 2: Style Selection
function renderStyleSelection() {
    const title = document.createElement('h2');
    title.className = 'form-title';
    title.innerText = 'Choose Aesthetic';
    contentArea.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'form-subtitle';
    subtitle.innerText = 'Define the visual direction of your generation.';
    contentArea.appendChild(subtitle);

    const grid = document.createElement('div');
    grid.className = 'selection-grid';

    const modelStyles = state.data[state.selectedModelIndex].style;

    modelStyles.forEach((style, index) => {
        const card = document.createElement('div');
        card.className = 'selection-card';
        card.innerHTML = `
            <div class="card-title" style="text-transform: capitalize;">${style.name}</div>
        `;
        card.onclick = () => {
            state.selectedStyleIndex = index;
            state.step++;
            renderStep();
        };
        grid.appendChild(card);
    });

    contentArea.appendChild(grid);
}

// Step 3: Dynamic Inputs
function renderDynamicForm() {
    const title = document.createElement('h2');
    title.className = 'form-title';
    title.innerText = 'Fine-tune Details';
    contentArea.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'form-subtitle';
    subtitle.innerText = 'Leave fields blank to skip specific parameters.';
    contentArea.appendChild(subtitle);

    const form = document.createElement('form');
    form.onsubmit = (e) => {
        e.preventDefault();
        state.step++;
        renderStep();
    };

    const currentStyle = state.data[state.selectedModelIndex].style[state.selectedStyleIndex];
    // We only take positive dynamic fields as per prompt implication, 
    // but code is extensible if negative has dynamic fields.
    const dynamicFields = currentStyle.positive.dynamic;

    dynamicFields.forEach(field => {
        const group = document.createElement('div');
        group.className = 'input-group';
        
        const label = document.createElement('label');
        label.innerText = field.replace(/_/g, ' ');
        label.htmlFor = field;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = field;
        input.className = 'input-field';
        input.placeholder = `Enter ${field.replace(/_/g, ' ')}...`;
        
        // Restore previous value if exists
        if (state.dynamicInputs[field]) {
            input.value = state.dynamicInputs[field];
        }

        input.addEventListener('input', (e) => {
            state.dynamicInputs[field] = e.target.value;
        });

        group.appendChild(label);
        group.appendChild(input);
        form.appendChild(group);
    });

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'submit-btn';
    submitBtn.innerHTML = `Generate Prompt`;

    form.appendChild(submitBtn);
    contentArea.appendChild(form);
}

// Step 4: Output Generation
function renderOutput() {
    const modelData = state.data[state.selectedModelIndex];
    const styleData = modelData.style[state.selectedStyleIndex];
    const isMerge = modelData.merge;

    // 1. Construct Positive Prompt
    let positiveArray = [...styleData.positive.fixed];
    
    // Insert dynamic values relative to their definition? 
    // The prompt says "concatenate the parameters", implying appending.
    // However, usually dynamic vars mix in. 
    // Instruction 14 says: JS will automatically concatenate... After every parameter, add ",\n".
    
    // Let's iterate through the dynamic keys defined in JSON to ensure order
    styleData.positive.dynamic.forEach(key => {
        const val = state.dynamicInputs[key];
        if (val && val.trim() !== "") {
            positiveArray.push(val.trim());
        }
    });

    const positiveText = positiveArray.join(',\n');

    // 2. Construct Negative Prompt
    let negativeArray = [...styleData.negative.fixed];
    // If negative had dynamic fields, add them here.
    const negativeText = negativeArray.join(',\n');

    // 3. Render View
    const container = document.createElement('div');
    container.className = `output-container ${isMerge ? 'single' : 'split'}`;

    if (isMerge) {
        // Single Text Area
        const fullText = `${positiveText},\nno ${negativeText}`;
        container.appendChild(createOutputBox('Full Prompt', fullText));
    } else {
        // Two Text Areas
        container.appendChild(createOutputBox('Positive Prompt', positiveText));
        container.appendChild(createOutputBox('Negative Prompt', negativeText));
    }

    contentArea.appendChild(container);
}

function createOutputBox(label, text) {
    const box = document.createElement('div');
    box.className = 'output-box';

    const header = document.createElement('div');
    header.className = 'output-header';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'output-label';
    labelSpan.innerText = label;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = ICONS.copy;
    copyBtn.ariaLabel = "Copy to clipboard";
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = ICONS.check;
            setTimeout(() => {
                copyBtn.innerHTML = ICONS.copy;
            }, 2000);
        });
    });

    header.appendChild(labelSpan);
    header.appendChild(copyBtn);

    const textarea = document.createElement('textarea');
    textarea.className = 'result-text';
    textarea.value = text;
    textarea.readOnly = true;
    textarea.addEventListener('click', () => textarea.select());

    box.appendChild(header);
    box.appendChild(textarea);

    return box;
}

// Start app
init();