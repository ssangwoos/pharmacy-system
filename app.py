import sqlite3
from flask import Flask, request, jsonify, render_template, g

# Flask 앱 생성
app = Flask(__name__)
DATABASE = 'pharmacy.db'

# --- 데이터베이스 연결 및 설정 ---
def get_db():
    """데이터베이스 커넥션을 가져옵니다. 없으면 새로 생성합니다."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        # 결과를 딕셔너리 형태로 받기 위해 row_factory 설정
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """요청이 끝날 때 데이터베이스 연결을 닫습니다."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """'products' 테이블을 생성합니다. (초기화)"""
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# --- API 엔드포인트 (데이터 통신 창구) ---

# [GET] 모든 상품 목록 가져오기 API
@app.route('/api/products', methods=['GET'])
def get_products():
    db = get_db()
    cursor = db.execute('SELECT * FROM products ORDER BY company, product_name')
    products = [dict(row) for row in cursor.fetchall()]
    return jsonify(products)

# [POST] 새 상품 추가하기 API
@app.route('/api/products', methods=['POST'])
def add_product():
    new_product = request.json
    db = get_db()
    db.execute(
        'INSERT INTO products (company, product_name, package_unit, contact) VALUES (?, ?, ?, ?)',
        [new_product['company'], new_product['product_name'], new_product['package_unit'], new_product.get('contact', '')]
    )
    db.commit()
    return jsonify({'message': '상품이 추가되었습니다.'}), 201

# [PUT] 기존 상품 수정하기 API
@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    updated_product = request.json
    db = get_db()
    db.execute(
        'UPDATE products SET company = ?, product_name = ?, package_unit = ?, contact = ? WHERE id = ?',
        [updated_product['company'], updated_product['product_name'], updated_product['package_unit'], updated_product.get('contact', ''), product_id]
    )
    db.commit()
    return jsonify({'message': '상품이 수정되었습니다.'})

# [DELETE] 상품 삭제하기 API
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    db = get_db()
    db.execute('DELETE FROM products WHERE id = ?', [product_id])
    db.commit()
    return jsonify({'message': '상품이 삭제되었습니다.'})


# --- 페이지 라우팅 (HTML 화면 보여주기) ---

# 루트 경로: 주문 페이지 보여주기
@app.route('/')
def index():
    return render_template('index.html')

# 관리 페이지 보여주기
@app.route('/manage')
def manage():
    return render_template('manage.html')


# --- 서버 실행 ---
if __name__ == '__main__':
    # 최초 실행 시 데이터베이스 테이블을 만들기 위해 다음 줄의 주석을 해제하고 실행 후 다시 주석 처리하세요.
    # init_db() 
    app.run(debug=True)