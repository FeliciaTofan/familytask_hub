// FamilyTask Hub - Main JavaScript

// Global variables
let currentUser = null;
let currentFamily = null;
let currentFamilyData = null;
let taskTemplates = [];
let familyMembers = [];
let currentTaskType = 'predefined';
let currentDifficulty = 3;

// Authentication functions
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.success) {
            currentUser = { id: data.user_id, name: data.name };
            document.getElementById('user-name').textContent = data.name;
            showApp();
            loadUserFamilies();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Login failed. Please try again.', 'error');
    }
}

async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (data.success) {
            currentUser = { id: data.user_id, name: data.name };
            document.getElementById('user-name').textContent = data.name;
            showApp();
            loadUserFamilies();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Registration failed. Please try again.', 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        currentFamily = null;
        showAuth();
    } catch (error) {
        showAlert('Logout failed', 'error');
    }
}

// UI functions
function showAuth() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    // Make sure family content is hidden initially
    document.getElementById('family-content').classList.add('hidden');
    document.getElementById('invite-code-btn').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Family management
async function loadUserFamilies() {
    try {
        const response = await fetch('/api/families');
        const families = await response.json();
        
        const familySelect = document.getElementById('family-select');
        familySelect.innerHTML = '<option value="">Select Family</option>';
        
        families.forEach(family => {
            const option = document.createElement('option');
            option.value = family.id;
            option.textContent = family.name;
            option.dataset.inviteCode = family.invite_code;
            familySelect.appendChild(option);
        });

        // If user has no families, make sure content is hidden and clear any data
        if (families.length === 0) {
            document.getElementById('family-content').classList.add('hidden');
            document.getElementById('invite-code-btn').style.display = 'none';
            currentFamily = null;
            currentFamilyData = null;
            displayTasks([]);
            familyMembers = [];
            updateMembersDisplay();
        } else if (families.length === 1) {
            // Auto-select if only one family
            familySelect.value = families[0].id;
            selectFamily(families[0].id);
        } else {
            // Multiple families - user needs to select
            document.getElementById('family-content').classList.add('hidden');
            document.getElementById('invite-code-btn').style.display = 'none';
            currentFamily = null;
            currentFamilyData = null;
        }
    } catch (error) {
        showAlert('Failed to load families', 'error');
        // Make sure content is hidden on error
        document.getElementById('family-content').classList.add('hidden');
        document.getElementById('invite-code-btn').style.display = 'none';
        displayTasks([]);
        familyMembers = [];
        updateMembersDisplay();
    }
}

async function selectFamily(familyId) {
    if (!familyId) {
        document.getElementById('family-content').classList.add('hidden');
        document.getElementById('invite-code-btn').style.display = 'none';
        currentFamily = null;
        currentFamilyData = null;
        return;
    }

    currentFamily = familyId;
    
    // Get family data for invite code
    const familySelect = document.getElementById('family-select');
    const selectedOption = familySelect.selectedOptions[0];
    currentFamilyData = {
        id: familyId,
        name: selectedOption.textContent,
        invite_code: selectedOption.dataset.inviteCode
    };
    
    document.getElementById('family-content').classList.remove('hidden');
    document.getElementById('invite-code-btn').style.display = 'inline-block';
    
    await Promise.all([
        loadTaskTemplates(),
        loadFamilyMembers(),
        loadFamilyTasks()
    ]);
}

function showInviteCode() {
    if (!currentFamilyData) return;
    
    showModal(`
        <h3 style="color: #27ae60; margin-bottom: 20px;">👨‍👩‍👧‍👦 Invite Family Members</h3>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
            <p style="margin-bottom: 10px;"><strong>Family:</strong> ${currentFamilyData.name}</p>
            <p style="margin-bottom: 15px;"><strong>Invite Code:</strong></p>
            <div style="background: white; padding: 15px; border: 2px dashed #27ae60; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #27ae60; cursor: pointer;" onclick="copyInviteCode('${currentFamilyData.invite_code}')">
                ${currentFamilyData.invite_code}
            </div>
            <p style="margin-top: 15px; color: #6c757d; font-size: 14px;">
                Click the code to copy it! Share with family members so they can join.
            </p>
        </div>
        <div style="text-align: center;">
            <button class="btn btn-primary" onclick="closeModal()">Close</button>
        </div>
    `);
}

function copyInviteCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showAlert('Invite code copied to clipboard! 📋');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('Invite code copied! 📋');
    });
}

// Task management
async function loadTaskTemplates() {
    try {
        const response = await fetch('/api/task-templates');
        taskTemplates = await response.json();
        
        const select = document.getElementById('task-template');
        select.innerHTML = '<option value="">Choose a task...</option>';
        
        let currentCategory = '';
        taskTemplates.forEach(template => {
            if (template.category !== currentCategory) {
                currentCategory = template.category;
                const optgroup = document.createElement('optgroup');
                optgroup.label = currentCategory;
                select.appendChild(optgroup);
            }
            
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = `${template.name} ${'★'.repeat(template.difficulty)}`;
            option.dataset.difficulty = template.difficulty;
            option.dataset.days = template.estimated_days;
            select.lastChild.appendChild(option);
        });
    } catch (error) {
        showAlert('Failed to load task templates', 'error');
    }
}

async function loadFamilyMembers() {
    // Don't load members if no family is selected
    if (!currentFamily) {
        familyMembers = [];
        updateAssignDropdowns();
        updateMembersDisplay();
        return;
    }
    
    try {
        const response = await fetch(`/api/family/${currentFamily}/members`);
        
        if (response.status === 403) {
            // User is not a member of this family
            familyMembers = [];
            updateAssignDropdowns();
            updateMembersDisplay();
            return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
            familyMembers = data;
            updateAssignDropdowns();
            updateMembersDisplay();
        } else {
            showAlert(data.error || 'Failed to load family members', 'error');
            familyMembers = [];
            updateAssignDropdowns();
            updateMembersDisplay();
        }
    } catch (error) {
        showAlert('Failed to load family members', 'error');
        familyMembers = [];
        updateAssignDropdowns();
        updateMembersDisplay();
    }
}

async function loadFamilyTasks() {
    // Don't load tasks if no family is selected
    if (!currentFamily) {
        displayTasks([]);
        return;
    }
    
    try {
        const response = await fetch(`/api/family/${currentFamily}/tasks`);
        
        if (response.status === 403) {
            // User is not a member of this family
            document.getElementById('family-content').classList.add('hidden');
            showAlert('Access denied. You are not a member of this family.', 'error');
            // Reset family selection
            document.getElementById('family-select').value = '';
            currentFamily = null;
            currentFamilyData = null;
            return;
        }
        
        const tasks = await response.json();
        
        if (response.ok) {
            displayTasks(tasks);
        } else {
            showAlert(tasks.error || 'Failed to load tasks', 'error');
            displayTasks([]);
        }
    } catch (error) {
        showAlert('Failed to load tasks', 'error');
        displayTasks([]);
    }
}

function updateAssignDropdowns() {
    const selects = ['assign-to'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        select.innerHTML = '<option value="">Assign later</option>';
        
        familyMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

function updateMembersDisplay() {
    const membersList = document.getElementById('members-list');
    membersList.innerHTML = '';
    
    if (familyMembers.length === 0) {
        membersList.innerHTML = `
            <div style="text-align: center; color: #6c757d; padding: 20px; grid-column: 1 / -1;">
                Select or join a family to see members
            </div>
        `;
        return;
    }
    
    familyMembers.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        memberCard.innerHTML = `
            <div class="member-name">${member.name}</div>
            <div class="member-stats">
                <span>${member.active_tasks || 0} active</span>
                <span>${member.completed_tasks || 0} done</span>
            </div>
        `;
        membersList.appendChild(memberCard);
    });
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('tasks-list');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <p style="text-align: center; color: #6c757d; padding: 40px;">
                No tasks yet. Add your first task!
            </p>
        `;
        return;
    }
    
    const activeTasks = tasks.filter(task => !task.is_completed);
    const completedTasks = tasks.filter(task => task.is_completed);
    
    tasksList.innerHTML = '';
    
    if (activeTasks.length > 0) {
        const activeHeader = document.createElement('h3');
        activeHeader.textContent = '🔥 Active Tasks';
        activeHeader.style.color = '#27ae60';
        activeHeader.style.marginBottom = '15px';
        tasksList.appendChild(activeHeader);
        
        activeTasks.forEach(task => {
            tasksList.appendChild(createTaskElement(task));
        });
    }
    
    if (completedTasks.length > 0) {
        const completedHeader = document.createElement('h3');
        completedHeader.textContent = '✅ Completed Tasks';
        completedHeader.style.color = '#95a5a6';
        completedHeader.style.marginTop = '30px';
        completedHeader.style.marginBottom = '15px';
        tasksList.appendChild(completedHeader);
        
        completedTasks.forEach(task => {
            tasksList.appendChild(createTaskElement(task));
        });
    }
}

function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.is_completed ? 'completed' : ''}`;
    
    const daysLeft = calculateDaysLeft(task.created_at, task.estimated_days);
    const daysText = daysLeft > 0 ? `${daysLeft} days left` : 
                   daysLeft === 0 ? 'Due today' : 
                   `${Math.abs(daysLeft)} days overdue`;
    
    taskItem.innerHTML = `
        <div class="task-header">
            <div>
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span>${'★'.repeat(task.difficulty)} difficulty</span>
                    <span>${daysText}</span>
                    <span>Added ${new Date(task.created_at).toLocaleDateString()}</span>
                </div>
                ${task.description ? `<p style="margin: 8px 0; color: #6c757d;">${task.description}</p>` : ''}
            </div>
        </div>
        <div class="task-actions">
            ${!task.is_completed ? `
                <select class="assign-select" onchange="assignTask(${task.id}, this.value)">
                    <option value="">Unassigned</option>
                    ${familyMembers.map(member => 
                        `<option value="${member.id}" ${task.assigned_to === member.id ? 'selected' : ''}>
                            ${member.name}
                        </option>`
                    ).join('')}
                </select>
                ${task.assigned_to === currentUser.id ? 
                    `<button class="btn btn-primary btn-small" onclick="completeTask(${task.id})">Complete</button>` : 
                    ''
                }
            ` : `
                <span style="color: #95a5a6;">Completed by ${task.assigned_to_name || 'Unknown'}</span>
            `}
        </div>
    `;
    
    return taskItem;
}

function calculateDaysLeft(createdAt, estimatedDays) {
    const created = new Date(createdAt);
    const due = new Date(created);
    due.setDate(due.getDate() + estimatedDays);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Task form functions
function selectTaskType(type) {
    currentTaskType = type;
    
    // Update UI
    document.querySelectorAll('.radio-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (type === 'predefined') {
        document.getElementById('predefined-fields').classList.remove('hidden');
        document.getElementById('custom-fields').classList.add('hidden');
    } else {
        document.getElementById('predefined-fields').classList.add('hidden');
        document.getElementById('custom-fields').classList.remove('hidden');
    }
}

function setDifficulty(level) {
    currentDifficulty = level;
    const difficultyTexts = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    
    document.querySelectorAll('.star').forEach((star, index) => {
        star.classList.toggle('active', index < level);
    });
    
    document.getElementById('difficulty-text').textContent = difficultyTexts[level];
}

async function assignTask(taskId, userId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_to: userId || null })
        });
        
        const data = await response.json();
        if (data.success) {
            showAlert('Task assigned successfully!');
            loadFamilyTasks();
            loadFamilyMembers();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Failed to assign task', 'error');
    }
}

async function completeTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        if (data.success) {
            showAlert('Task completed! Great job! 🎉');
            loadFamilyTasks();
            loadFamilyMembers();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Failed to complete task', 'error');
    }
}

async function randomAssignTasks() {
    try {
        const response = await fetch(`/api/family/${currentFamily}/random-assign`, {
            method: 'POST'
        });
        
        const data = await response.json();
        if (data.success) {
            showAlert(`Randomly assigned ${data.assigned_tasks} tasks!`);
            loadFamilyTasks();
            loadFamilyMembers();
        } else if (data.message) {
            showAlert(data.message);
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Failed to assign tasks randomly', 'error');
    }
}

// Modal functions
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function showCreateFamilyModal() {
    showModal(`
        <h3 style="margin-bottom: 20px;">Create New Family</h3>
        <div class="form-group">
            <label>Family Name</label>
            <input type="text" id="new-family-name" placeholder="Enter family name">
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="createFamily()">Create</button>
        </div>
    `);
}

function showJoinFamilyModal() {
    showModal(`
        <h3 style="margin-bottom: 20px;">Join Family</h3>
        <div class="form-group">
            <label>Family Invite Code</label>
            <input type="text" id="join-invite-code" placeholder="Enter invite code" style="text-transform: uppercase;">
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="joinFamily()">Join</button>
        </div>
    `);
}

async function createFamily() {
    const name = document.getElementById('new-family-name').value;
    if (!name) {
        showAlert('Please enter a family name', 'error');
        return;
    }

    try {
        const response = await fetch('/api/create-family', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        const data = await response.json();
        if (data.success) {
            // Show success message with invite code
            showModal(`
                <h3 style="color: #27ae60; margin-bottom: 20px;">✅ Family Created Successfully!</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <p style="margin-bottom: 10px;"><strong>Family Name:</strong> ${name}</p>
                    <p style="margin-bottom: 15px;"><strong>Invite Code:</strong></p>
                    <div style="background: white; padding: 15px; border: 2px dashed #27ae60; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #27ae60;">
                        ${data.invite_code}
                    </div>
                    <p style="margin-top: 15px; color: #6c757d; font-size: 14px;">
                        Share this code with family members so they can join!
                    </p>
                </div>
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="closeModal(); loadUserFamilies();">Continue</button>
                </div>
            `);
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Failed to create family', 'error');
    }
}

async function joinFamily() {
    const inviteCode = document.getElementById('join-invite-code').value;
    if (!inviteCode) {
        showAlert('Please enter an invite code', 'error');
        return;
    }

    try {
        const response = await fetch('/api/join-family', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invite_code: inviteCode.toUpperCase() })
        });

        const data = await response.json();
        if (data.success) {
            showAlert('Successfully joined family!');
            closeModal();
            loadUserFamilies();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        showAlert('Failed to join family', 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Family select change
    document.getElementById('family-select').addEventListener('change', (e) => {
        selectFamily(e.target.value);
    });

    // Task template change
    document.getElementById('task-template').addEventListener('change', (e) => {
        const option = e.target.selectedOptions[0];
        if (option.dataset.days) {
            document.getElementById('estimated-days').value = option.dataset.days;
        }
    });

    // Task form submit
    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let title, description = '', difficulty = 3, estimatedDays;
        
        if (currentTaskType === 'predefined') {
            const templateId = document.getElementById('task-template').value;
            if (!templateId) {
                showAlert('Please select a task', 'error');
                return;
            }
            const template = taskTemplates.find(t => t.id == templateId);
            title = template.name;
            difficulty = template.difficulty;
        } else {
            title = document.getElementById('custom-title').value;
            description = document.getElementById('custom-description').value;
            difficulty = currentDifficulty;
            
            if (!title) {
                showAlert('Please enter a task title', 'error');
                return;
            }
        }
        
        estimatedDays = parseInt(document.getElementById('estimated-days').value);
        const assignedTo = document.getElementById('assign-to').value || null;
        
        try {
            const response = await fetch(`/api/family/${currentFamily}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    difficulty,
                    estimated_days: estimatedDays,
                    assigned_to: assignedTo
                })
            });
            
            const data = await response.json();
            if (data.success) {
                showAlert('Task added successfully!');
                document.getElementById('task-form').reset();
                if (currentTaskType === 'custom') {
                    setDifficulty(3);
                }
                loadFamilyTasks();
                loadFamilyMembers(); // Refresh member stats
            } else {
                showAlert(data.error, 'error');
            }
        } catch (error) {
            showAlert('Failed to add task', 'error');
        }
    });

    // Close modal when clicking overlay
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });

    // Handle Enter key in forms
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (!document.getElementById('auth-section').classList.contains('hidden')) {
                if (!document.getElementById('login-form').classList.contains('hidden')) {
                    login();
                } else {
                    register();
                }
            }
        }
    });

    // Initialize difficulty selector
    setDifficulty(3);
});