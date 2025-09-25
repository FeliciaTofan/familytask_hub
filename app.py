from flask import Flask, request, jsonify, session, render_template
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import secrets
import string
from datetime import datetime, timedelta
import os
from functools import wraps

from dotenv import load_dotenv
load_dotenv()  # Loading variables from the .env file

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-fallback-secret-key')
CORS(app)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'familytask_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'your_password')
}

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_invite_code():
    """Generate random invite code for family"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/')
def index():
    """Serve main page"""
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({'error': 'All fields are required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'error': 'User already exists'}), 400
        
        # Create user
        password_hash = hash_password(password)
        cur.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (name, email, password_hash)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        
        session['user_id'] = user_id
        session['user_name'] = name
        
        return jsonify({'success': True, 'user_id': user_id, 'name': name})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({'error': 'Email and password are required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        password_hash = hash_password(password)
        cur.execute(
            "SELECT id, name FROM users WHERE email = %s AND password_hash = %s",
            (email, password_hash)
        )
        user = cur.fetchone()
        
        if user:
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            return jsonify({'success': True, 'user_id': user['id'], 'name': user['name']})
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session.clear()
    return jsonify({'success': True})

@app.route('/api/create-family', methods=['POST'])
@require_auth
def create_family():
    """Create new family"""
    data = request.json
    family_name = data.get('name')
    
    if not family_name:
        return jsonify({'error': 'Family name is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        invite_code = generate_invite_code()
        
        # Create family
        cur.execute(
            "INSERT INTO families (name, invite_code, created_by) VALUES (%s, %s, %s) RETURNING id",
            (family_name, invite_code, session['user_id'])
        )
        family_id = cur.fetchone()[0]
        
        # Add creator to family
        cur.execute(
            "INSERT INTO family_members (family_id, user_id) VALUES (%s, %s)",
            (family_id, session['user_id'])
        )
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'family_id': family_id,
            'invite_code': invite_code
        })
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/join-family', methods=['POST'])
@require_auth
def join_family():
    """Join family by invite code or email"""
    data = request.json
    invite_code = data.get('invite_code')
    email = data.get('email')
    
    if not invite_code:
        return jsonify({'error': 'Invite code is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        # Find family by invite code
        cur.execute("SELECT id FROM families WHERE invite_code = %s", (invite_code,))
        family = cur.fetchone()
        
        if not family:
            return jsonify({'error': 'Invalid invite code'}), 400
        
        family_id = family[0]
        
        # Check if user is already in family
        cur.execute(
            "SELECT id FROM family_members WHERE family_id = %s AND user_id = %s",
            (family_id, session['user_id'])
        )
        if cur.fetchone():
            return jsonify({'error': 'Already member of this family'}), 400
        
        # Add user to family
        cur.execute(
            "INSERT INTO family_members (family_id, user_id) VALUES (%s, %s)",
            (family_id, session['user_id'])
        )
        
        conn.commit()
        
        return jsonify({'success': True, 'family_id': family_id})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/families', methods=['GET'])
@require_auth
def get_user_families():
    """Get families user belongs to"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT f.id, f.name, f.invite_code
            FROM families f
            JOIN family_members fm ON f.id = fm.family_id
            WHERE fm.user_id = %s
        """, (session['user_id'],))
        
        families = cur.fetchall()
        return jsonify(list(families))
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/family/<int:family_id>/members', methods=['GET'])
@require_auth
def get_family_members(family_id):
    """Get family members"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT u.id, u.name, u.email,
                   COUNT(CASE WHEN t.is_completed = FALSE THEN 1 END) as active_tasks,
                   COUNT(CASE WHEN t.is_completed = TRUE THEN 1 END) as completed_tasks
            FROM users u
            JOIN family_members fm ON u.id = fm.user_id
            LEFT JOIN tasks t ON u.id = t.assigned_to AND t.family_id = %s
            WHERE fm.family_id = %s
            GROUP BY u.id, u.name, u.email
        """, (family_id, family_id))
        
        members = cur.fetchall()
        return jsonify(list(members))
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/task-templates', methods=['GET'])
@require_auth
def get_task_templates():
    """Get predefined task templates"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM task_templates ORDER BY category, name")
        templates = cur.fetchall()
        return jsonify(list(templates))
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/family/<int:family_id>/tasks', methods=['GET'])
@require_auth
def get_family_tasks(family_id):
    """Get all tasks for family - only if user is family member"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user is member of this family
        cur.execute("""
            SELECT 1 FROM family_members 
            WHERE family_id = %s AND user_id = %s
        """, (family_id, session['user_id']))
        
        if not cur.fetchone():
            return jsonify({'error': 'Access denied. You are not a member of this family.'}), 403
        
        # Get tasks for family
        cur.execute("""
            SELECT t.*, u.name as assigned_to_name, uc.name as created_by_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users uc ON t.created_by = uc.id
            WHERE t.family_id = %s
            ORDER BY t.is_completed, t.created_at DESC
        """, (family_id,))
        
        tasks = cur.fetchall()
        return jsonify(list(tasks))
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/family/<int:family_id>/tasks', methods=['POST'])
@require_auth
def create_task(family_id):
    """Create new task"""
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    difficulty = data.get('difficulty', 3)
    estimated_days = data.get('estimated_days', 1)
    assigned_to = data.get('assigned_to')
    
    if not title:
        return jsonify({'error': 'Task title is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        due_date = datetime.now().date() + timedelta(days=estimated_days)
        
        cur.execute("""
            INSERT INTO tasks (family_id, title, description, difficulty, estimated_days, 
                             assigned_to, created_by, due_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (family_id, title, description, difficulty, estimated_days, 
              assigned_to, session['user_id'], due_date))
        
        task_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({'success': True, 'task_id': task_id})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/tasks/<int:task_id>/assign', methods=['PUT'])
@require_auth
def assign_task(task_id):
    """Assign task to user"""
    data = request.json
    assigned_to = data.get('assigned_to')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE tasks SET assigned_to = %s WHERE id = %s",
            (assigned_to, task_id)
        )
        conn.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/tasks/<int:task_id>/complete', methods=['PUT'])
@require_auth
def complete_task(task_id):
    """Mark task as completed"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE tasks SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP
            WHERE id = %s AND assigned_to = %s
        """, (task_id, session['user_id']))
        
        if cur.rowcount == 0:
            return jsonify({'error': 'Task not found or not assigned to you'}), 404
        
        conn.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/family/<int:family_id>/random-assign', methods=['POST'])
@require_auth
def random_assign_tasks(family_id):
    """Randomly assign unassigned tasks"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get unassigned tasks
        cur.execute("""
            SELECT id, difficulty FROM tasks 
            WHERE family_id = %s AND assigned_to IS NULL AND is_completed = FALSE
        """, (family_id,))
        unassigned_tasks = cur.fetchall()
        
        if not unassigned_tasks:
            return jsonify({'message': 'No unassigned tasks found'})
        
        # Get family members
        cur.execute("""
            SELECT u.id FROM users u
            JOIN family_members fm ON u.id = fm.user_id
            WHERE fm.family_id = %s
        """, (family_id,))
        members = [row['id'] for row in cur.fetchall()]
        
        if not members:
            return jsonify({'error': 'No family members found'}), 400
        
        # Simple round-robin assignment weighted by difficulty
        member_loads = {member: 0 for member in members}
        current_member = 0
        
        # Sort tasks by difficulty (descending) for better distribution
        tasks_sorted = sorted(unassigned_tasks, key=lambda x: x['difficulty'], reverse=True)
        
        for task in tasks_sorted:
            # Find member with lowest current load
            min_load_member = min(members, key=lambda m: member_loads[m])
            
            # Assign task
            cur.execute(
                "UPDATE tasks SET assigned_to = %s WHERE id = %s",
                (min_load_member, task['id'])
            )
            
            # Update member load
            member_loads[min_load_member] += task['difficulty']
        
        conn.commit()
        
        return jsonify({'success': True, 'assigned_tasks': len(tasks_sorted)})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)