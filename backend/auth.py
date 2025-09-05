# User authentication logic for KuttiApp backend
# All comments, variable names, and routes are in English

import sqlite3
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    email = data.get('email')
    phone = data.get('phone')
    photo = data.get('photo')
    if not username or not password or not role:
        return jsonify({'error': 'Missing required fields'}), 400
    hashed_password = generate_password_hash(password)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''INSERT INTO users (username, password, role, email, phone, photo) VALUES (?, ?, ?, ?, ?, ?)''',
                       (username, hashed_password, role, email, phone, photo))
        conn.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    finally:
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password are required'}), 400
        
        conn = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            if user and check_password_hash(user['password'], password):
                # Convert user row to dictionary and remove sensitive data
                user_dict = {k: user[k] for k in user.keys() if k != 'password'}
                return jsonify({
                    'success': True,
                    'user': user_dict
                }), 200
            
            return jsonify({
                'success': False,
                'error': 'Invalid username or password'
            }), 401
            
        except sqlite3.Error as e:
            print(f"Database error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Database error occurred'
            }), 500
        finally:
            if conn:
                conn.close()
                
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
