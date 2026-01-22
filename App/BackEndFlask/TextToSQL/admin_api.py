from flask import Blueprint, jsonify, request
from models import db, User, Query, QueryReport
from auth import admin_token_required
import datetime

admin_api = Blueprint('admin_api', __name__)


@admin_api.route('/users', methods=['GET'])
@admin_token_required
def get_users(current_user):
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


@admin_api.route('/users/<int:user_id>', methods=['PUT'])
@admin_token_required
def update_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    data = request.json

    if 'is_admin' in data:
        user.is_admin = data['is_admin']

    db.session.commit()
    return jsonify({'success': True})


@admin_api.route('/users/<int:user_id>', methods=['DELETE'])
@admin_token_required
def delete_user(current_user, user_id):
    user = User.query.get_or_404(user_id)

    # Không cho phép xóa chính mình
    if user.id == current_user.id:
        return jsonify({'error': 'Không thể xóa tài khoản của chính mình'}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True})


@admin_api.route('/queries', methods=['GET'])
@admin_token_required
def get_queries(current_user):
    queries = Query.query.all()
    result = []
    for query in queries:
        result.append({
            'id': query.id,
            'question': query.question,
            'sql_query': query.sql_query,
            'DBSchema': query.DBSchema,
            'created_at': query.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'user_id': query.user_id,
            'username': query.user.username
        })
    return jsonify(result)


@admin_api.route('/queries/<int:query_id>', methods=['DELETE'])
@admin_token_required
def admin_delete_query(current_user, query_id):
    query = Query.query.get_or_404(query_id)

    db.session.delete(query)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Truy vấn đã được xóa thành công'})


# API lấy báo cáo
@admin_api.route('/reports', methods=['GET'])
@admin_token_required
def get_reports(current_user):
    reports = db.session.query(QueryReport).all()
    result = []

    for report in reports:
        # Lấy thông tin query và user an toàn
        query = db.session.query(Query).get(report.query_id)
        user = db.session.query(User).get(report.user_id)

        if query and user:
            result.append({
                'id': report.id,
                'query_id': report.query_id,
                'question': query.question,
                'sql_query': query.sql_query,
                'reported_by': user.username,
                'reason': report.reason,
                'status': report.status,
                'created_at': report.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'resolved_at': report.resolved_at.strftime('%Y-%m-%d %H:%M:%S') if report.resolved_at else None,
                'admin_notes': report.admin_notes
            })

    return jsonify(result)


# API cập nhật trạng thái báo cáo
@admin_api.route('/reports/<int:report_id>', methods=['PUT'])
@admin_token_required
def update_report_status(current_user, report_id):
    report = db.session.query(QueryReport).get_or_404(report_id)
    data = request.json

    if 'status' in data:
        report.status = data['status']

    if 'admin_notes' in data:
        report.admin_notes = data['admin_notes']

    # Nếu trạng thái là đã xem xét hoặc bỏ qua, cập nhật thời gian giải quyết
    if data.get('status') in ['reviewed', 'ignored']:
        report.resolved_at = datetime.datetime.utcnow()

    db.session.commit()
    return jsonify({'success': True})