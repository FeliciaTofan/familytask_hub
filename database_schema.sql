-- FamilyTask Hub Database Schema
-- Run this in your PostgreSQL database

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Families table
CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family members junction table
CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, user_id)
);

-- Predefined task templates
CREATE TABLE task_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 3,
    estimated_days INTEGER DEFAULT 1
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 3,
    estimated_days INTEGER DEFAULT 1,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id),
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined tasks
INSERT INTO task_templates (name, category, difficulty, estimated_days) VALUES
-- Kitchen tasks
('Wash dishes', 'Kitchen', 2, 1),
('Cook dinner', 'Kitchen', 3, 1),
('Clean refrigerator', 'Kitchen', 3, 2),
('Deep clean oven', 'Kitchen', 4, 1),
('Organize pantry', 'Kitchen', 3, 2),
('Take out trash', 'Kitchen', 1, 1),
('Load/unload dishwasher', 'Kitchen', 1, 1),
('Wipe countertops', 'Kitchen', 1, 1),
('Clean stovetop', 'Kitchen', 2, 1),
('Sweep kitchen floor', 'Kitchen', 2, 1),

-- Bathroom tasks
('Clean toilet', 'Bathroom', 2, 1),
('Clean shower/bathtub', 'Bathroom', 3, 1),
('Mop bathroom floor', 'Bathroom', 2, 1),
('Clean mirror', 'Bathroom', 1, 1),
('Replace toilet paper', 'Bathroom', 1, 1),
('Clean sink', 'Bathroom', 1, 1),
('Organize medicine cabinet', 'Bathroom', 2, 1),
('Wash bath mats', 'Bathroom', 2, 1),

-- Living areas
('Vacuum living room', 'Living', 2, 1),
('Dust furniture', 'Living', 2, 1),
('Organize bookshelf', 'Living', 2, 1),
('Clean windows', 'Living', 3, 2),
('Vacuum under furniture', 'Living', 4, 1),
('Wash curtains', 'Living', 3, 2),
('Organize TV area', 'Living', 2, 1),

-- Bedroom tasks
('Make beds', 'Bedroom', 1, 1),
('Change bed sheets', 'Bedroom', 2, 1),
('Organize closet', 'Bedroom', 4, 3),
('Vacuum bedroom', 'Bedroom', 2, 1),
('Dust nightstands', 'Bedroom', 1, 1),
('Organize dresser', 'Bedroom', 2, 1),

-- Laundry tasks
('Do laundry wash', 'Laundry', 2, 1),
('Fold and put away clothes', 'Laundry', 3, 1),
('Iron clothes', 'Laundry', 3, 2),
('Organize laundry room', 'Laundry', 2, 1),
('Clean lint trap', 'Laundry', 1, 1),

-- Outdoor tasks
('Mow lawn', 'Outdoor', 4, 2),
('Water plants', 'Outdoor', 1, 1),
('Weed garden', 'Outdoor', 3, 2),
('Clean garage', 'Outdoor', 5, 4),
('Wash car', 'Outdoor', 3, 2),
('Take care of pets', 'Outdoor', 2, 1),
('Clean patio', 'Outdoor', 3, 1),
('Rake leaves', 'Outdoor', 3, 2),

-- General maintenance
('Replace light bulbs', 'Maintenance', 1, 1),
('Check smoke detectors', 'Maintenance', 2, 1),
('Organize storage room', 'Maintenance', 4, 3),
('Clean air vents', 'Maintenance', 3, 2),
('Fix loose handles', 'Maintenance', 2, 1),

-- Shopping and errands
('Grocery shopping', 'Shopping', 3, 2),
('Buy household supplies', 'Shopping', 2, 1),
('Pay bills', 'Shopping', 2, 1),
('Pick up dry cleaning', 'Shopping', 1, 1),
('Return items to store', 'Shopping', 2, 1),

-- Kids and family
('Help with homework', 'Family', 3, 1),
('Drive kids to activities', 'Family', 2, 1),
('Organize toy room', 'Family', 3, 2),
('Prepare school lunches', 'Family', 2, 1),
('Bath time for kids', 'Family', 2, 1),

-- Seasonal tasks
('Decorate for holidays', 'Seasonal', 4, 3),
('Store seasonal clothes', 'Seasonal', 3, 2),
('Clean gutters', 'Seasonal', 5, 3),
('Winterize outdoor furniture', 'Seasonal', 3, 2),
('Spring cleaning', 'Seasonal', 5, 7),

-- Technology and admin
('Backup computer files', 'Technology', 2, 1),
('Update software', 'Technology', 1, 1),
('Organize digital photos', 'Technology', 3, 3),
('Plan family activities', 'Planning', 3, 2),
('Schedule appointments', 'Planning', 2, 1),
('Meal planning', 'Planning', 3, 1),
('Budget review', 'Planning', 4, 2),
('File documents', 'Planning', 2, 1);

-- Create indexes for better performance
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_completed ON tasks(is_completed);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);