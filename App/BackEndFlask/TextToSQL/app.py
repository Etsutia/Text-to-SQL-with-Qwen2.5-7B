from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_login import login_required, current_user
from flask_cors import CORS
from models import db, User, Query, QueryReport
from auth import auth, login_manager, token_required
from admin_api import admin_api
from config import Config
import requests
import json
import os
import re
import logging
import jwt

# Thiết lập logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Cấu hình CORS để chấp nhận requests từ React frontend
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Khởi tạo các extension
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    # Đăng ký các blueprint
    app.register_blueprint(auth, url_prefix='/auth')
    app.register_blueprint(admin_api, url_prefix='/api/admin')

    # LM Studio API endpoint
    LM_STUDIO_API_URL = "http://127.0.0.1:1234/v1/chat/completions"

    # Thay thế @app.before_first_request bằng with app.app_context()
    with app.app_context():
        db.create_all()

    def generate_sql(question, schema=None):
        """Tạo câu truy vấn SQL từ câu hỏi thông qua LM Studio API"""
        if schema:
            prompt = f"""### SQLite Schema:
```sql
{schema}
```

### Question:
{question}

### SQL Query:
"""
        else:
            prompt = f"""### Question:
{question}

### SQL Query:
"""

        # Tạo prompt theo định dạng chat để gửi đến API
        messages = [
            {"role": "user", "content": prompt}
        ]

        # Cấu hình request
        payload = {
            "model": "qwen2.5-7bt",  # Model ID từ LM Studio
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 512,
            "stream": False
        }

        headers = {
            "Content-Type": "application/json"
        }

        try:
            # Gửi request đến LM Studio API
            logger.info(f"Sending request to LM Studio API: {json.dumps(payload)}")
            response = requests.post(LM_STUDIO_API_URL, headers=headers, data=json.dumps(payload), timeout=60)

            if response.status_code == 200:
                result = response.json()
                logger.info(f"Received response: {json.dumps(result)}")

                # Kiểm tra cấu trúc phản hồi
                if 'choices' in result and len(result['choices']) > 0 and 'message' in result['choices'][0]:
                    output = result['choices'][0]['message']['content']

                    # Trích xuất SQL từ phản hồi
                    sql_match = re.search(r"```sql\n(.*?)```", output, re.DOTALL)
                    if sql_match:
                        return sql_match.group(1).strip()
                    else:
                        # Nếu không có định dạng đặc biệt, trả về toàn bộ phản hồi
                        return output.strip()
                else:
                    raise Exception(f"Unexpected API response structure: {json.dumps(result)}")
            else:
                raise Exception(f"API Error: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            raise Exception(f"Request Error: {str(e)}")

    @app.route('/')
    def home():
        return jsonify({"message": "TexttoSQL API is running"})

    # RESTful API cho React frontend
    @app.route('/api/generate', methods=['POST'])
    @token_required
    def api_generate(current_user):
        data = request.json
        question = data.get('question', '')
        schema = data.get('schema', '')

        if not question:
            return jsonify({'error': 'Vui lòng nhập câu hỏi'}), 400

        try:
            logger.info(f"Processing question: {question}")
            sql_query = generate_sql(question, schema)
            logger.info(f"Generated SQL: {sql_query}")

            # Lưu truy vấn vào cơ sở dữ liệu
            new_query = Query(
                question=question,
                sql_query=sql_query,
                DBSchema=schema,
                user_id=current_user.id
            )
            db.session.add(new_query)
            db.session.commit()

            return jsonify({
                'sql': sql_query,
                'query_id': new_query.id
            })
        except Exception as e:
            logger.error(f"Error generating SQL: {str(e)}")
            return jsonify({'error': f'Có lỗi xảy ra: {str(e)}'}), 500

    @app.route('/api/user/profile', methods=['GET'])
    @token_required
    def user_profile(current_user):
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

    @app.route('/api/user/queries/<int:query_id>', methods=['DELETE'])
    @token_required
    def delete_user_query(current_user, query_id):
        query = Query.query.get_or_404(query_id)

        # Kiểm tra quyền sở hữu (chỉ cho phép xóa truy vấn của chính mình)
        if query.user_id != current_user.id and not current_user.is_admin:
            return jsonify({'error': 'Bạn không có quyền xóa truy vấn này'}), 403

        db.session.delete(query)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Truy vấn đã được xóa thành công'})

    @app.route('/api/admin/users', methods=['GET'])
    @token_required
    def admin_get_users(current_user):
        if not current_user.is_admin:
            return jsonify({'error': 'Không có quyền truy cập'}), 403

        users = User.query.all()
        result = []
        for user in users:
            result.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'query_count': len(user.queries)
            })
        return jsonify(result)

    @app.route('/api/admin/queries', methods=['GET'])
    @token_required
    def admin_get_queries(current_user):
        if not current_user.is_admin:
            return jsonify({'error': 'Không có quyền truy cập'}), 403

        queries = Query.query.all()
        result = []
        for query in queries:
            result.append({
                'id': query.id,
                'question': query.question,
                'sql_query': query.sql_query,
                'created_at': query.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': query.user_id,
                'username': query.user.username
            })
        return jsonify(result)

    @app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
    @token_required
    def admin_update_user(current_user, user_id):
        if not current_user.is_admin:
            return jsonify({'error': 'Không có quyền truy cập'}), 403

        user = User.query.get_or_404(user_id)
        data = request.json

        if 'is_admin' in data:
            user.is_admin = data['is_admin']

        db.session.commit()
        return jsonify({'success': True})

    @app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
    @token_required
    def admin_delete_user(current_user, user_id):
        if not current_user.is_admin:
            return jsonify({'error': 'Không có quyền truy cập'}), 403

        user = User.query.get_or_404(user_id)

        # Không cho phép xóa chính mình
        if user.id == current_user.id:
            return jsonify({'error': 'Không thể xóa tài khoản của chính mình'}), 400

        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True})

    # Route xử lý form cho web interface
    @app.route('/generate', methods=['POST'])
    @login_required
    def generate():
        data = request.json
        question = data.get('question', '')
        schema = data.get('schema', '')

        if not question:
            return jsonify({'error': 'Vui lòng nhập câu hỏi'}), 400

        try:
            logger.info(f"Processing question: {question}")
            sql_query = generate_sql(question, schema)
            logger.info(f"Generated SQL: {sql_query}")

            # Lưu truy vấn vào cơ sở dữ liệu
            new_query = Query(
                question=question,
                sql_query=sql_query,
                DBSchema=schema,
                user_id=current_user.id
            )
            db.session.add(new_query)
            db.session.commit()

            return jsonify({'sql': sql_query})
        except Exception as e:
            logger.error(f"Error generating SQL: {str(e)}")
            return jsonify({'error': f'Có lỗi xảy ra: {str(e)}'}), 500

    @app.route('/api/user/queries', methods=['GET'])
    @token_required
    def get_user_queries(current_user):
        user_queries = Query.query.filter_by(user_id=current_user.id).order_by(Query.created_at.desc()).all()
        result = []

        for query in user_queries:
            result.append({
                'id': query.id,
                'question': query.question,
                'sql_query': query.sql_query,
                'DBSchema': query.DBSchema,
                'created_at': query.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify(result)

    @app.route('/api/user/queries/<int:query_id>/report', methods=['POST'])
    @token_required
    def report_query(current_user, query_id):
        query = Query.query.get_or_404(query_id)

        # Kiểm tra xem người dùng đã báo cáo truy vấn này chưa
        existing_report = db.session.query(QueryReport).filter(
            QueryReport.query_id == query_id,
            QueryReport.user_id == current_user.id
        ).first()

        if existing_report:
            return jsonify({'error': 'Bạn đã báo cáo truy vấn này trước đó'}), 400

        data = request.json
        reason = data.get('reason', '')

        # Tạo báo cáo mới
        new_report = QueryReport(
            query_id=query_id,
            user_id=current_user.id,
            reason=reason
        )

        # Đánh dấu truy vấn là đã bị báo cáo
        query.is_reported = True

        db.session.add(new_report)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Truy vấn đã được báo cáo thành công'
        })

    @app.route('/api/user/queries/<int:query_id>/report-status', methods=['GET'])
    @token_required
    def check_report_status(current_user, query_id):
        # Kiểm tra xem người dùng đã báo cáo truy vấn này chưa
        report = db.session.query(QueryReport).filter(
            QueryReport.query_id == query_id,
            QueryReport.user_id == current_user.id
        ).first()

        if report:
            return jsonify({
                'is_reported': True,
                'status': report.status,
                'created_at': report.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify({'is_reported': False})

    @app.route('/health', methods=['GET'])
    def health_check():
        """Kiểm tra kết nối tới LM Studio API"""
        try:
            # Gửi request kiểm tra đến API
            response = requests.get("http://127.0.0.1:1234/v1/models", timeout=5)
            if response.status_code == 200:
                models_data = response.json()
                logger.info(f"LM Studio API health check: OK, models available: {len(models_data.get('data', []))}")
                return jsonify({
                    'status': 'ok',
                    'message': 'Kết nối tới LM Studio thành công',
                    'models': models_data
                })
            else:
                logger.warning(f"LM Studio API health check failed: {response.status_code}")
                return jsonify({
                    'status': 'error',
                    'message': f'Lỗi kết nối tới LM Studio: {response.status_code}'
                }), 500
        except Exception as e:
            logger.error(f"LM Studio API health check exception: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f'Không thể kết nối tới LM Studio: {str(e)}'
            }), 500

    return app


if __name__ == '__main__':
    app = create_app()

    print("=" * 50)
    print("Ứng dụng đã được tạo. Đảm bảo LM Studio đang chạy tại http://127.0.0.1:1234")
    print("Đang khởi động Flask server...")
    print("=" * 50)

    app.run(debug=True, host='0.0.0.0', port=5000)