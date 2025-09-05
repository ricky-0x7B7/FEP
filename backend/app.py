# Flat GET endpoints for all main tables
from models import get_db_connection

from models import get_db_connection
# All comments, variable names, and routes are in English



from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import os
import uuid
import sqlite3
import logging
from translator import get_translation_service, translate_field, pre_translate_all_fields
from auth import auth_bp
from config import Config
from flask_cors import CORS

# Setup logging
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS properly
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size for videos

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'mp4', 'avi', 'mov', 'mkv', 'webm'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

app.register_blueprint(auth_bp)

# GET endpoints for all main tables
@app.route('/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    users = conn.execute('SELECT * FROM users').fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

# CRUD endpoints for Users
@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    print(f"Received user creation request: {data}")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if username already exists
        existing_user = cursor.execute('SELECT id FROM users WHERE username = ?', (data['username'],)).fetchone()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Insert the user record
        cursor.execute('''
            INSERT INTO users (username, password, role, email, phone, photo, full_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (data['username'], generate_password_hash(data['password']), data['role'], 
              data.get('email', ''), data.get('phone', ''), data.get('photo', ''),
              data.get('name', data.get('full_name', ''))))
        
        user_id = cursor.lastrowid
        print(f"Created user with ID: {user_id}")
        
        conn.commit()
        
        # Return the created user (without password)
        new_user = cursor.execute('SELECT id, username, role, email, phone, photo, full_name FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        
        print("User created successfully")
        return jsonify({'message': 'User created successfully', 'user': dict(new_user)}), 201
        
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    print(f"Received user update request for ID {user_id}: {data}")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        existing_user = cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if not existing_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if username already exists for another user
        if 'username' in data:
            username_check = cursor.execute('SELECT id FROM users WHERE username = ? AND id != ?', (data['username'], user_id)).fetchone()
            if username_check:
                return jsonify({'error': 'Username already exists'}), 400
        
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        if 'username' in data:
            update_fields.append('username = ?')
            update_values.append(data['username'])
        if 'password' in data and data['password']:  # Only update password if provided
            update_fields.append('password = ?')
            update_values.append(generate_password_hash(data['password']))
        if 'role' in data:
            update_fields.append('role = ?')
            update_values.append(data['role'])
        if 'email' in data:
            update_fields.append('email = ?')
            update_values.append(data.get('email', ''))
        if 'phone' in data:
            update_fields.append('phone = ?')
            update_values.append(data.get('phone', ''))
        if 'photo' in data:
            update_fields.append('photo = ?')
            update_values.append(data.get('photo', ''))
        if 'name' in data:  # Map frontend 'name' to database 'full_name'
            update_fields.append('full_name = ?')
            update_values.append(data.get('name', ''))
        if 'full_name' in data:  # Also handle direct full_name updates
            update_fields.append('full_name = ?')
            update_values.append(data.get('full_name', ''))
        if 'bio' in data:
            update_fields.append('bio = ?')
            update_values.append(data.get('bio', ''))
        if 'ui_language' in data:
            update_fields.append('ui_language = ?')
            update_values.append(data.get('ui_language', ''))
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        # Add user_id to values for WHERE clause
        update_values.append(user_id)
        
        # Execute update
        update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(update_query, update_values)
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'User not found'}), 404
        
        conn.commit()
        
        # Return the updated user (without password)
        updated_user = cursor.execute('SELECT id, username, role, email, phone, photo, full_name, bio, ui_language FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        
        print("User updated successfully")
        return jsonify({'message': 'User updated successfully', 'user': dict(updated_user)}), 200
        
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        existing_user = cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,)).fetchone()
        if not existing_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete the user
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'User not found'}), 404
        
        conn.commit()
        conn.close()
        
        print(f"User with ID {user_id} deleted successfully")
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        print(f"Error deleting user: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/missions', methods=['GET'])
def get_missions():
    conn = get_db_connection()
    # Join with users table to get referent information
    missions = conn.execute('''
        SELECT m.*, u.username as referent_username, u.email as referent_email
        FROM missions m
        LEFT JOIN users u ON m.referent_id = u.id
    ''').fetchall()
    conn.close()
    return jsonify([dict(m) for m in missions])

@app.route('/children', methods=['GET'])
def get_children():
    # Get current user from session (you'll need to implement session management)
    # For now, we'll add user_id and role as query parameters for testing
    user_id = request.args.get('user_id', type=int)
    user_role = request.args.get('user_role', 'admin')  # Default to admin for testing
    
    conn = get_db_connection()
    
    # Base query with all joins
    base_query = '''
        SELECT c.*, 
               m.name as mission_name, 
               u.username as referent_username,
               u.email as referent_email,
               s.username as sponsor_username,
               s.email as sponsor_email
        FROM children c
        LEFT JOIN missions m ON c.mission_id = m.id
        LEFT JOIN users u ON m.referent_id = u.id
        LEFT JOIN users s ON c.sponsor_id = s.id
    '''
    
    # Apply role-based filtering
    if user_role == 'sponsor' and user_id:
        # Sponsors see only children they sponsor
        query = base_query + '''
            WHERE s.id = ?
        '''
        children = conn.execute(query, (user_id,)).fetchall()
    elif user_role == 'localReferent' and user_id:
        # Referents see only children in their missions
        query = base_query + '''
            WHERE u.id = ?
        '''
        children = conn.execute(query, (user_id,)).fetchall()
    else:
        # Admins see all children
        children = conn.execute(base_query).fetchall()
    
    conn.close()
    
    # Calculate age in years for each child
    from datetime import datetime
    children_list = []
    for child in children:
        child_dict = dict(child)
        if child_dict['birth']:
            birth_date = datetime.strptime(child_dict['birth'], '%Y-%m-%d')
            today = datetime.now()
            age = today.year - birth_date.year
            if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                age -= 1
            child_dict['age'] = max(0, age)
        else:
            child_dict['age'] = 0
        
        # Add sponsorship status
        child_dict['is_sponsored'] = child_dict['sponsor_id'] is not None
        
        children_list.append(child_dict)
    
    return jsonify(children_list)

@app.route('/sponsors', methods=['GET'])
def get_sponsors():
    conn = get_db_connection()
    sponsors = conn.execute('SELECT * FROM sponsors').fetchall()
    conn.close()
    return jsonify([dict(s) for s in sponsors])

@app.route('/news', methods=['GET'])
def get_news():
    # Get current user from session (you'll need to implement session management)
    # For now, we'll add user_id and role as query parameters for testing
    user_id = request.args.get('user_id', type=int)
    user_role = request.args.get('user_role', 'admin')  # Default to admin for testing
    
    conn = get_db_connection()
    
    # Base query with all joins to get referent, child information, and creator details
    # Referent is dynamically retrieved through child->mission->referent chain for maximum consistency
    base_query = '''
        SELECT n.*, 
               ref.username as referent_username,
               ref.email as referent_email,
               c.name as child_name,
               m.name as mission_name,
               creator.username as created_by_username,
               creator.email as created_by_email,
               creator.role as created_by_role,
               updater.username as updated_by_username,
               updater.email as updated_by_email,
               updater.role as updated_by_role
        FROM news n
        LEFT JOIN children c ON n.child_id = c.id
        LEFT JOIN missions m ON c.mission_id = m.id
        LEFT JOIN users ref ON m.referent_id = ref.id
        LEFT JOIN users creator ON n.created_by = creator.id
        LEFT JOIN users updater ON n.updated_by = updater.id
    '''
    
    # Apply role-based filtering
    if user_role == 'sponsor' and user_id:
        # Sponsors see only news about children they sponsor
        query = base_query + '''
            WHERE c.id IN (
                SELECT child_id FROM sponsor_children WHERE sponsor_id = ?
            )
            ORDER BY n.created_at DESC
        '''
        news = conn.execute(query, (user_id,)).fetchall()
    elif user_role == 'referent' and user_id:
        # Referents see only news from children of their missions
        query = base_query + '''
            WHERE m.referent_id = ?
            ORDER BY n.created_at DESC
        '''
        news = conn.execute(query, (user_id,)).fetchall()
    else:
        # Admins see all news
        query = base_query + '''
            ORDER BY n.created_at DESC
        '''
        news = conn.execute(query).fetchall()
    
    # Get media files for each news item
    result = []
    for item in news:
        news_dict = dict(item)
        
        # Get media files for this news item
        media_files = conn.execute('''
            SELECT media_path, media_type, description, media_order
            FROM news_media 
            WHERE news_id = ? 
            ORDER BY media_order
        ''', (news_dict['id'],)).fetchall()
        
        news_dict['media'] = [dict(media) for media in media_files]
        result.append(news_dict)
    
    conn.close()
    return jsonify(result)


# CRUD endpoints for News
@app.route('/news', methods=['POST'])
def create_news():
    data = request.get_json()
    print(f"Received news creation request: {data}")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert the news record (referent_id is derived from child->mission->referent relationship)
        cursor.execute('''
            INSERT INTO news (title, content, date, child_id, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        ''', (data['title'], data['content'], data['date'], data['child_id'], data.get('created_by')))
        
        news_id = cursor.lastrowid
        print(f"Created news with ID: {news_id}")
        
        # Handle media files if provided
        media_files = data.get('media_files', [])
        print(f"Processing {len(media_files)} media files")
        
        for i, media in enumerate(media_files):
            try:
                print(f"Processing media {i}: {media}")
                # Handle both frontend formats: 'type'/'path' and 'media_type'/'media_path'
                raw_media_type = media.get('type') or media.get('media_type')
                media_path = media.get('path') or media.get('media_path')
                
                # Map MIME types to database values
                if raw_media_type:
                    if raw_media_type.startswith('image/'):
                        media_type = 'photo'
                    elif raw_media_type.startswith('video/'):
                        media_type = 'video'
                    elif raw_media_type in ['photo', 'video']:
                        media_type = raw_media_type
                    else:
                        media_type = 'photo'  # default fallback
                else:
                    media_type = 'photo'  # default fallback
                
                print(f"Media path: {media_path}, mapped type: {media_type} (from: {raw_media_type})")
                
                if not media_path:
                    print(f"Warning: Skipping media item {i} - no path found")
                    continue
                
                cursor.execute('''
                    INSERT INTO news_media (news_id, media_type, media_path, description, media_order)
                    VALUES (?, ?, ?, ?, ?)
                ''', (news_id, media_type, media_path, media.get('description', ''), i))
                print(f"Successfully inserted media: {media_path}")
            except Exception as media_error:
                print(f"Error processing media item {i}: {media_error}")
                raise
        
        conn.commit()
        
        # Pre-translate news fields for multilingual support
        if news_id:
            try:
                print(f"Pre-translating news fields for news ID: {news_id}")
                news_data = {
                    'title': data['title'],
                    'content': data['content']
                }
                # Use UI language as source language (fallback to 'en' if not provided)
                source_language = data.get('ui_language', 'en')
                print(f"Using source language: {source_language}")
                pre_translate_all_fields('news', news_id, news_data, source_language)
                print("Pre-translation completed successfully")
            except Exception as translate_error:
                print(f"Warning: Pre-translation failed: {translate_error}")
                # Non interrompiamo il processo se la traduzione fallisce
        
        conn.close()
        print("News created successfully")
        return jsonify({'message': 'News created successfully', 'id': news_id}), 201
    except Exception as e:
        print(f"Error creating news: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/news/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    data = request.get_json()
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user ID from request
        current_user_id = data.get('current_user_id')  # You should get this from session in production
        
        # Update the news record (referent_id is derived from child->mission->referent relationship)
        cursor.execute('''
            UPDATE news 
            SET title = ?, content = ?, date = ?, child_id = ?, 
                updated_by = ?, updated_at = datetime('now')
            WHERE id = ?
        ''', (data['title'], data['content'], data['date'], data['child_id'], 
              current_user_id, news_id))
        
        print(f"News record updated for ID: {news_id}")
        
        # Handle media files update with selective logic to avoid orphaned files
        media_files = data.get('media_files', [])
        print(f"Received media_files: {media_files}")
        
        # Get existing media files for this news
        existing_media = cursor.execute(
            'SELECT media_path FROM news_media WHERE news_id = ?', 
            (news_id,)
        ).fetchall()
        existing_paths = [m['media_path'] for m in existing_media]
        print(f"Existing media paths: {existing_paths}")
        
        # Get new media paths from request
        new_paths = [m.get('path') or m.get('media_path') for m in media_files if m.get('path') or m.get('media_path')]
        print(f"New media paths: {new_paths}")
        
        # Find files to delete (exist in DB but not in new request)
        files_to_delete = set(existing_paths) - set(new_paths)
        print(f"Files to delete: {files_to_delete}")
        
        # Delete orphaned media records and files
        for file_path in files_to_delete:
            cursor.execute('DELETE FROM news_media WHERE news_id = ? AND media_path = ?', 
                           (news_id, file_path))
            # Also delete physical file
            try:
                import os
                upload_folder = 'uploads'
                os.remove(os.path.join(upload_folder, file_path))
                print(f"Deleted orphaned file: {file_path}")
            except OSError as e:
                print(f"Could not delete file {file_path}: {e}")
        
        # Add only truly new media files or update existing ones
        for i, media in enumerate(media_files):
            try:
                media_path = media.get('path') or media.get('media_path')
                media_type = media.get('type') or media.get('media_type')
                
                print(f"Processing media {i}: {media}")
                print(f"Media path: {media_path}, type: {media_type}")
                
                # Validate media_type
                if media_type not in ['photo', 'video']:
                    print(f"Invalid media_type '{media_type}', defaulting to 'photo'")
                    media_type = 'photo'
                
                if not media_path:
                    print(f"Warning: Skipping media item {i} - no path found")
                    continue
                
                if media_path not in existing_paths:
                    # This is a new file, insert it
                    print(f"Inserting new media: news_id={news_id}, type={media_type}, path={media_path}")
                    try:
                        cursor.execute('''
                            INSERT INTO news_media (news_id, media_type, media_path, description, media_order)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (news_id, media_type, media_path, media.get('description', ''), i))
                        print(f"Added new media file: {media_path}")
                    except Exception as insert_error:
                        print(f"FOREIGN KEY ERROR on INSERT: {insert_error}")
                        print(f"Values: news_id={news_id}, media_type={media_type}, media_path={media_path}")
                        raise
                else:
                    # File exists, just update order and description
                    print(f"Updating existing media: path={media_path}")
                    try:
                        cursor.execute('''
                            UPDATE news_media 
                            SET description = ?, media_order = ?
                            WHERE news_id = ? AND media_path = ?
                        ''', (media.get('description', ''), i, news_id, media_path))
                        print(f"Updated existing media file: {media_path}")
                    except Exception as update_error:
                        print(f"FOREIGN KEY ERROR on UPDATE: {update_error}")
                        print(f"Values: news_id={news_id}, media_path={media_path}")
                        raise
            except Exception as media_error:
                print(f"Error processing media item {i}: {media_error}")
                raise
        
        conn.commit()
        
        # Re-translate news fields for multilingual support when content is updated
        try:
            print(f"Re-translating news fields for news ID: {news_id}")
            
            # Clear old translations for this news item
            service = get_translation_service()
            conn_trans = sqlite3.connect(service.db_path)
            cursor_trans = conn_trans.cursor()
            cursor_trans.execute('''
                DELETE FROM translations 
                WHERE entity_type = 'news' AND entity_id = ?
            ''', (news_id,))
            conn_trans.commit()
            conn_trans.close()
            print(f"Cleared old translations for news ID: {news_id}")
            
            news_data = {
                'title': data['title'],
                'content': data['content']
            }
            # Use UI language as source language (fallback to 'en' if not provided)
            source_language = data.get('ui_language', 'en')
            print(f"Using source language: {source_language}")
            pre_translate_all_fields('news', news_id, news_data, source_language)
            print("News update pre-translation completed successfully")
        except Exception as translate_error:
            print(f"Warning: News update pre-translation failed: {translate_error}")
            # Non interrompiamo il processo se la traduzione fallisce
        
        # Commit all changes at the end
        conn.commit()
        print(f"All changes committed successfully for news ID: {news_id}")
        conn.close()
        return jsonify({'message': 'News updated successfully'})
    except Exception as e:
        print(f"Error in update_news: {str(e)}")
        import traceback
        traceback.print_exc()
        # Close connection in case of error to prevent database lock
        if conn:
            try:
                conn.close()
            except:
                pass
        return jsonify({'error': str(e)}), 500

@app.route('/news/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM news WHERE id = ?', (news_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'News deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# CRUD endpoints for Children
@app.route('/children', methods=['POST'])
def create_child():
    data = request.get_json()
    try:
        conn = get_db_connection()
        
        # Create child
        cursor = conn.execute('''
            INSERT INTO children (name, gender, birth, photo, description, mission_id, sponsor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (data['name'], data['gender'], data.get('birth_date'), 
              data.get('photo'), data.get('description'), data['mission_id'], data.get('sponsor_id')))
        
        child_id = cursor.lastrowid
        conn.commit()
        
        # Pre-translate children fields for multilingual support if child was created successfully
        if child_id and (data.get('name') or data.get('description')):
            try:
                # Get the source language from the request or detect from user preference
                source_language = data.get('source_language', 'en')
                
                child_data = {}
                if data.get('name'):
                    child_data['name'] = data['name']
                if data.get('description'):
                    child_data['description'] = data['description']
                    
                pre_translate_all_fields('children', child_id, child_data, source_language)
                logger.info(f"Pre-translated children fields for new child {child_id}")
            except Exception as translation_error:
                logger.warning(f"Translation failed for new child {child_id}: {translation_error}")
                # Continue without failing the creation
        
        conn.close()
        return jsonify({'message': 'Child created successfully', 'id': child_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/children/<int:child_id>', methods=['PUT'])
def update_child(child_id):
    data = request.get_json()
    try:
        conn = get_db_connection()
        
        # First check if child exists
        child = conn.execute('SELECT * FROM children WHERE id = ?', (child_id,)).fetchone()
        if not child:
            conn.close()
            return jsonify({'error': 'Child not found'}), 404

        # Update child (map birth_date to birth column)
        conn.execute('''
            UPDATE children 
            SET name = ?, gender = ?, birth = ?, photo = ?, description = ?, mission_id = ?, sponsor_id = ?
            WHERE id = ?
        ''', (data['name'], data['gender'], data.get('birth_date'),
              data.get('photo'), data.get('description'), data['mission_id'], data.get('sponsor_id'), child_id))
        conn.commit()
        
        # Get the source language from the request or detect from user preference
        source_language = data.get('source_language', 'en')
        
        # Pre-translate children fields for multilingual support
        if data.get('name') or data.get('description'):
            try:
                child_data = {}
                if data.get('name'):
                    child_data['name'] = data['name']
                if data.get('description'):
                    child_data['description'] = data['description']
                    
                pre_translate_all_fields('children', child_id, child_data, source_language)
                logger.info(f"Pre-translated children fields for child {child_id}")
            except Exception as translation_error:
                logger.warning(f"Translation failed for child {child_id}: {translation_error}")
                # Continue without failing the update
        
        conn.close()
        return jsonify({'message': 'Child updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/children/<int:child_id>', methods=['DELETE'])
def delete_child(child_id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM children WHERE id = ?', (child_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Child deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# CRUD endpoints for Missions
@app.route('/missions', methods=['POST'])
def create_mission():
    data = request.get_json()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO missions (name, description, referent_id)
            VALUES (?, ?, ?)
        ''', (data['name'], data.get('description'), data.get('referent_id')))
        
        mission_id = cursor.lastrowid
        conn.commit()
        
        # Pre-translate mission description for multilingual support
        if mission_id and data.get('description'):
            try:
                print(f"Pre-translating mission description for mission ID: {mission_id}")
                mission_data = {
                    'description': data['description']
                }
                # Use UI language as source language (fallback to 'en' if not provided)
                source_language = data.get('ui_language', 'en')
                print(f"Using source language: {source_language}")
                pre_translate_all_fields('mission', mission_id, mission_data, source_language)
                print("Mission pre-translation completed successfully")
            except Exception as translate_error:
                print(f"Warning: Mission pre-translation failed: {translate_error}")
                # Non interrompiamo il processo se la traduzione fallisce
        
        conn.close()
        return jsonify({'message': 'Mission created successfully', 'id': mission_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/missions/<int:mission_id>', methods=['PUT'])
def update_mission(mission_id):
    try:
        conn = get_db_connection()
        
        # First check if mission exists
        mission = conn.execute('SELECT * FROM missions WHERE id = ?', (mission_id,)).fetchone()
        if not mission:
            conn.close()
            return jsonify({'error': 'Mission not found'}), 404

        # Handle both JSON and form data (for file uploads)
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle file upload
            data = request.form.to_dict()
            photo_file = request.files.get('photo')
            
            photo_filename = None
            if photo_file and photo_file.filename:
                if allowed_file(photo_file.filename):
                    # Generate unique filename
                    filename = secure_filename(photo_file.filename)
                    unique_filename = f"{uuid.uuid4()}_{filename}"
                    photo_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                    photo_file.save(photo_path)
                    photo_filename = unique_filename
                    print(f"Mission photo saved: {photo_filename}")
                else:
                    conn.close()
                    return jsonify({'error': 'Invalid file type'}), 400
        else:
            # Handle JSON data
            data = request.get_json()
            photo_filename = data.get('photo') if data.get('photo') else mission['photo']
        
        # Update mission
        conn.execute('''
            UPDATE missions 
            SET name = ?, description = ?, referent_id = ?, photo = ?
            WHERE id = ?
        ''', (data['name'], data.get('description'), 
              data.get('referent_id'), photo_filename or mission['photo'], mission_id))
        conn.commit()
        
        # Re-translate mission description if updated
        if data.get('description'):
            try:
                print(f"Re-translating updated mission description for mission ID: {mission_id}")
                
                # Clear old translations for this mission item
                service = get_translation_service()
                conn_trans = sqlite3.connect(service.db_path)
                cursor_trans = conn_trans.cursor()
                cursor_trans.execute('''
                    DELETE FROM translations 
                    WHERE entity_type = 'mission' AND entity_id = ?
                ''', (mission_id,))
                conn_trans.commit()
                conn_trans.close()
                print(f"Cleared old translations for mission ID: {mission_id}")
                
                mission_data = {
                    'description': data['description']
                }
                # Use UI language as source language (fallback to 'en' if not provided)
                source_language = data.get('ui_language', 'en')
                print(f"Using source language: {source_language}")
                pre_translate_all_fields('mission', mission_id, mission_data, source_language)
                print("Mission update pre-translation completed successfully")
            except Exception as translate_error:
                print(f"Warning: Mission update pre-translation failed: {translate_error}")
                # Non interrompiamo il processo se la traduzione fallisce
        
        conn.close()
        return jsonify({'message': 'Mission updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/missions/<int:mission_id>', methods=['DELETE'])
def delete_mission(mission_id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM missions WHERE id = ?', (mission_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Mission deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# File upload endpoint
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Check file size (Flask should handle this automatically, but let's be explicit)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Seek back to beginning
        
        max_size = app.config.get('MAX_CONTENT_LENGTH', 50 * 1024 * 1024)
        if file_size > max_size:
            return jsonify({'error': f'File too large. Maximum size is {max_size // (1024*1024)}MB'}), 413
        
        print(f"Uploading file: {file.filename}, Size: {file_size} bytes, Type: {file.content_type}")
        
        if file and allowed_file(file.filename):
            # Generate unique filename to avoid conflicts
            filename = secure_filename(file.filename)
            name, ext = os.path.splitext(filename)
            unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
            
            # Create uploads directory if it doesn't exist
            upload_dir = os.path.join(app.config['UPLOAD_FOLDER'])
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save the file
            file_path = os.path.join(upload_dir, unique_filename)
            file.save(file_path)
            
            print(f"File saved successfully: {file_path}")
            
            return jsonify({
                'message': 'File uploaded successfully',
                'filename': unique_filename,
                'url': f'/uploads/{unique_filename}'
            })
        
        return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    try:
        # Get file extension to set proper content type
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        
        # Set content type for videos
        content_type = None
        if ext in ['mp4']:
            content_type = 'video/mp4'
        elif ext in ['avi']:
            content_type = 'video/x-msvideo'
        elif ext in ['mov']:
            content_type = 'video/quicktime'
        elif ext in ['webm']:
            content_type = 'video/webm'
        elif ext in ['mkv']:
            content_type = 'video/x-matroska'
        
        if content_type:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename, mimetype=content_type)
        else:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
            
    except Exception as e:
        print(f"Error serving file {filename}: {str(e)}")
        return jsonify({'error': 'File not found'}), 404


# Translation endpoints: multilingual support with intelligent caching
@app.route('/translate', methods=['POST'])
def translate_text():
    """
    Endpoint per traduzione diretta di testo
    Supporta traduzione semplice senza cache per uso generico
    """
    data = request.get_json()
    text = data.get('text', '')
    source_lang = data.get('source_lang', 'auto')  # auto-detect
    target_lang = data.get('target_lang', 'en')
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
        
    try:
        service = get_translation_service()
        
        # Se source_lang è 'auto', rileva automaticamente
        if source_lang == 'auto':
            source_lang = service.detect_language(text)
        
        translated_text = service.translate_text(text, target_lang, source_lang)
        
        return jsonify({
            'translated_text': translated_text,
            'source_language': source_lang,
            'target_language': target_lang
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/translate/field', methods=['POST'])
def translate_field_cached():
    """
    Endpoint per traduzione di campi specifici con cache intelligente
    Supporta: news.title, news.content, missions.description, children.name, children.description
    """
    data = request.get_json()
    
    # Parametri richiesti
    entity_type = data.get('entity_type')  # 'news' o 'missions'
    entity_id = data.get('entity_id')      # ID dell'entità
    field_name = data.get('field_name')    # 'title', 'content', 'description'
    target_language = data.get('target_language', 'en')  # Lingua desiderata
    original_text = data.get('original_text', '')        # Testo originale
    
    # Auto-determina source_language
    service = get_translation_service()
    conn = sqlite3.connect(service.db_path)
    cursor = conn.cursor()
    
    # Per gli utenti, usa ui_language dalla tabella users
    if entity_type == 'user':
        cursor.execute('SELECT ui_language FROM users WHERE id = ?', (entity_id,))
        user_result = cursor.fetchone()
        source_language = user_result[0] if user_result else 'en'
        logger.info(f"Using user ui_language: {source_language} for user {entity_id}")
    else:
        # Per altri tipi, cerca nella cache (is_original=1)
        cursor.execute('''
            SELECT language FROM translations 
            WHERE entity_type = ? AND entity_id = ? AND field_name = ? AND is_original = 1
        ''', (entity_type, entity_id, field_name))
        
        result = cursor.fetchone()
        source_language = result[0] if result else 'en'  # Fallback a 'en'
        logger.info(f"Auto-determined source language: {source_language} for {entity_type}.{entity_id}.{field_name}")
    
    conn.close()
    
    # Validazione parametri
    if not all([entity_type, entity_id, field_name, original_text]):
        return jsonify({
            'error': 'Missing required parameters: entity_type, entity_id, field_name, original_text'
        }), 400
    
    try:
        translated_text = translate_field(
            entity_type, entity_id, field_name, target_language, original_text, source_language
        )
        
        return jsonify({
            'translated_text': translated_text,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'field_name': field_name,
            'target_language': target_language,
            'cached': True  # Indica che utilizza il sistema di cache
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/translate/stats', methods=['GET'])
def translation_stats():
    """
    Endpoint per statistiche delle traduzioni
    """
    try:
        service = get_translation_service()
        stats = service.get_translation_stats()
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Main entry point: run Flask app locally
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)
