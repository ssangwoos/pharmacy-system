// 페이지 로드 시 상품 목록을 불러옵니다.
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

function setupEventListeners() {
    const form = document.getElementById('product-form');
    form.addEventListener('submit', handleFormSubmit);

    const cancelBtn = document.getElementById('cancel-edit-btn');
    cancelBtn.addEventListener('click', resetForm);
}

// 상품 목록을 서버에서 가져와 테이블에 표시하는 함수
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        const tableBody = document.querySelector("#product-list-table tbody");
        tableBody.innerHTML = ""; // 기존 목록 초기화

        products.forEach(product => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${product.company}</td>
                <td>${product.product_name}</td>
                <td>${product.package_unit}</td>
                <td>
                    <button class="btn-edit" onclick="editProduct(${product.id},'${product.company}','${product.product_name}','${product.package_unit}', '${product.contact || ''}')">수정</button>
                    <button class="btn-danger" onclick="deleteProduct(${product.id})">삭제</button>
                </td>
            `;
        });
    } catch (error) {
        console.error('상품 목록 로딩 실패:', error);
    }
}

// 폼 제출(저장) 처리 함수
async function handleFormSubmit(event) {
    event.preventDefault(); // 폼 기본 동작 방지

    const productId = document.getElementById('product-id').value;
    const productData = {
        company: document.getElementById('company').value,
        product_name: document.getElementById('product_name').value,
        package_unit: document.getElementById('package_unit').value,
        contact: document.getElementById('contact').value,
    };

    try {
        let response;
        if (productId) {
            // 수정
            response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });
        } else {
            // 등록
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });
        }

        if (!response.ok) {
            throw new Error('서버 응답 오류');
        }

        const result = await response.json();
        alert(result.message);
        resetForm();
        loadProducts(); // 목록 새로고침

    } catch (error) {
        console.error('저장 실패:', error);
        alert('저장에 실패했습니다.');
    }
}

// 수정 버튼 클릭 시 폼에 데이터를 채우는 함수
function editProduct(id, company, name, unit, contact) {
    document.getElementById('product-id').value = id;
    document.getElementById('company').value = company;
    document.getElementById('product_name').value = name;
    document.getElementById('package_unit').value = unit;
    document.getElementById('contact').value = contact;

    document.getElementById('form-title').textContent = '상품 정보 수정';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    window.scrollTo(0, 0); // 페이지 상단으로 스크롤
}

// 상품 삭제 함수
async function deleteProduct(id) {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('삭제 실패');
        const result = await response.json();
        alert(result.message);
        loadProducts(); // 목록 새로고침
    } catch (error) {
        console.error('삭제 실패:', error);
        alert('삭제에 실패했습니다.');
    }
}

// 폼 초기화 함수
function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-title').textContent = '새 상품 등록';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}