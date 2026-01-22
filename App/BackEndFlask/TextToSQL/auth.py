from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify, current_app
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Query, QueryReport
from functools import wraps
import jwt
import datetime

auth = Blueprint('auth', __name__)
login_manager = LoginManager()


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        return f(*args, **kwargs)

    return decorated_function


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
        except:
            return jsonify({'error': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
            if not current_user.is_admin:
                return jsonify({'error': 'Admin privileges required!'}), 403
        except:
            return jsonify({'error': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.form if request.form else request.json
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()

        if user and user.password == password:
            login_user(user)
            # Tạo JWT token
            token = jwt.encode({
                'user_id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
            }, current_app.config['JWT_SECRET_KEY'])

            if request.is_json:
                return jsonify({
                    'success': True,
                    'is_admin': user.is_admin,
                    'token': token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_admin': user.is_admin
                    }
                })
            return redirect(url_for('home'))

        if request.is_json:
            return jsonify({'error': 'Tên đăng nhập hoặc mật khẩu không đúng'}), 401
        flash('Tên đăng nhập hoặc mật khẩu không đúng')

    if request.is_json:
        return jsonify({'error': 'Method not allowed'}), 405
    return render_template('login.html')


@auth.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.form if request.form else request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        # Kiểm tra username và email đã tồn tại chưa
        user_exists = User.query.filter_by(username=username).first()
        email_exists = User.query.filter_by(email=email).first()

        if user_exists:
            if request.is_json:
                return jsonify({'error': 'Tên đăng nhập đã tồn tại'}), 400
            flash('Tên đăng nhập đã tồn tại')
            return render_template('register.html')

        if email_exists:
            if request.is_json:
                return jsonify({'error': 'Email đã tồn tại'}), 400
            flash('Email đã tồn tại')
            return render_template('register.html')

        # Tạo user mới với mật khẩu lưu trực tiếp
        new_user = User(username=username, email=email, password=password)

        # Nếu đây là user đầu tiên, đặt quyền admin
        if User.query.count() == 0:
            new_user.is_admin = True

        db.session.add(new_user)
        db.session.commit()

        if request.is_json:
            return jsonify({'success': True})

        flash('Đăng ký thành công! Vui lòng đăng nhập.')
        return redirect(url_for('auth.login'))

    if request.is_json:
        return jsonify({'error': 'Method not allowed'}), 405
    return render_template('register.html')


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))


# API route cho profile
@auth.route('/api/user/profile', methods=['GET'])
@token_required
def api_user_profile(current_user):
    user_queries = Query.query.filter_by(user_id=current_user.id).all()
    queries_data = []

    for query in user_queries:
        queries_data.append({
            'id': query.id,
            'question': query.question,
            'sql_query': query.sql_query,
            'DBSchema': query.DBSchema,
            'created_at': query.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })

    return jsonify({
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'is_admin': current_user.is_admin,
            'created_at': current_user.created_at.strftime('%Y-%m-%d %H:%M:%S')
        },
        'queries': queries_data
    })


# Trang profile cho web interface
@auth.route('/profile')
@login_required
def profile():
    # Lấy lịch sử truy vấn của người dùng
    user_queries = current_user.queries
    return render_template('profile.html', user=current_user, queries=user_queries)


@auth.route('/admin')
@login_required
@admin_required
def admin_panel():
    # Lấy tất cả người dùng
    users = User.query.all()
    # Lấy tất cả truy vấn
    all_queries = Query.query.all()
    return render_template('admin.html', users=users, queries=all_queries)