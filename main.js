// تهيئة قاعدة البيانات المحلية (Local Storage) عشان البيانات متضيعش
let inventory = JSON.parse(localStorage.getItem('novaStoreInventory')) || [];

// دالة مساعدة لحساب التكلفة
function getUnit(c, q) {
    let cost = parseFloat(document.getElementById(c).value) || 0;
    let qty = parseFloat(document.getElementById(q).value) || 1;
    return qty > 0 ? (cost / qty) : 0;
}

// الحساب المباشر
function calculateLive() {
    // حساب تكلفة الوحدة من كل خامة
    let uFab = getUnit('c-fabric', 'q-fabric');
    let uBag = getUnit('c-bag', 'q-bag');
    let uPlas = getUnit('c-plastic', 'q-plastic');
    let uPap = getUnit('c-paper', 'q-paper');
    let uLab = getUnit('c-label', 'q-label');
    let uDtf = getUnit('c-dtf', 'q-dtf');

    document.getElementById('u-fabric').innerText = uFab.toFixed(2) + ' ج';
    document.getElementById('u-bag').innerText = uBag.toFixed(2) + ' ج';
    document.getElementById('u-plastic').innerText = uPlas.toFixed(2) + ' ج';
    document.getElementById('u-paper').innerText = uPap.toFixed(2) + ' ج';
    document.getElementById('u-label').innerText = uLab.toFixed(2) + ' ج';
    document.getElementById('u-dtf').innerText = uDtf.toFixed(2) + ' ج';

    let pieceCost = uFab + uBag + uPlas + uPap + uLab + uDtf;
    let producedQty = parseFloat(document.getElementById('producedQty').value) || 0;
    let sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;

    let totalCost = pieceCost * producedQty;
    let pieceProfit = sellPrice - pieceCost;
    let expectedProfit = pieceProfit * producedQty;

    // تحديث الشاشة الزرقاء
    document.getElementById('r-totalCost').innerText = totalCost.toFixed(2) + ' ج';
    document.getElementById('r-pieceCost').innerText = pieceCost.toFixed(2) + ' ج';

    let elPieceProf = document.getElementById('r-pieceProfit');
    elPieceProf.innerText = pieceProfit.toFixed(2) + ' ج';
    elPieceProf.className = pieceProfit >= 0 ? 'value text-success' : 'value text-danger';

    let elExpProf = document.getElementById('r-expectedProfit');
    elExpProf.innerText = expectedProfit.toFixed(2) + ' ج';
    elExpProf.className = pieceProfit >= 0 ? 'value text-success' : 'value text-danger';

    return { pieceCost, totalCost, pieceProfit, producedQty, sellPrice };
}

// حفظ الموديل الجديد
document.getElementById('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();

    let name = document.getElementById('modelName').value;
    let shape = document.getElementById('modelShape').value;
    let color = document.getElementById('modelColor').value;

    let calc = calculateLive();

    let newItem = {
        id: Date.now(),
        name: name,
        shape: shape,
        color: color,
        qty: calc.producedQty,
        sold: 0,
        pieceCost: calc.pieceCost,
        totalCost: calc.totalCost,
        sellPrice: calc.sellPrice,
        pieceProfit: calc.pieceProfit
    };

    inventory.push(newItem);
    saveData();
    renderTable();

    // مسح الخانات المتغيرة فقط لتسهيل الإدخال المتكرر
    document.getElementById('modelColor').value = '';
    document.getElementById('producedQty').value = '1';
    document.getElementById('modelColor').focus();
    calculateLive();
});

// تحديث وعرض الجدول
function renderTable() {
    let tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    inventory.forEach(item => {
        let remain = item.qty - item.sold;
        let actualProfit = item.sold * item.pieceProfit;

        // تحديد لون التنبيه للمخزون
        let stockClass = '';
        if (remain === 0) stockClass = 'stock-danger';
        else if (remain <= 5) stockClass = 'stock-warning';

        let profitClass = actualProfit >= 0 ? 'text-success' : 'text-danger';

        let tr = document.createElement('tr');
        tr.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${item.shape}</td>
                <td>${item.color}</td>
                <td>${item.totalCost.toFixed(2)}</td>
                <td>${item.pieceCost.toFixed(2)}</td>
                <td>${item.sellPrice.toFixed(2)}</td>
                <td>${item.qty}</td>
                <td>${item.sold}</td>
                <td class="${stockClass}">${remain}</td>
                <td class="${profitClass}" style="font-weight:bold">${actualProfit.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sell" onclick="openModal(${item.id})" ${remain === 0 ? 'disabled' : ''}>+ بيع</button>
                    <button class="btn btn-delete" onclick="deleteItem(${item.id})">حذف</button>
                </td>
            `;
        tbody.appendChild(tr);
    });
}

// الحفظ في LocalStorage
function saveData() {
    localStorage.setItem('novaStoreInventory', JSON.stringify(inventory));
}

// حذف عنصر
function deleteItem(id) {
    if (confirm('هل أنت متأكد من حذف هذا الموديل بالكامل؟')) {
        inventory = inventory.filter(i => i.id !== id);
        saveData();
        renderTable();
    }
}

// أدوات نافذة المبيعات (Modal)
function openModal(id) {
    let item = inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('sellingItemId').value = id;
    let remain = item.qty - item.sold;
    document.getElementById('modalInfo').innerText = `بيع: ${item.name} - ${item.shape} - ${item.color} (المتبقي: ${remain} قطعة)`;

    let sellInput = document.getElementById('sellAmount');
    sellInput.value = 1;
    sellInput.max = remain;

    document.getElementById('salesModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('salesModal').style.display = 'none';
}

function confirmSale() {
    let id = parseInt(document.getElementById('sellingItemId').value);
    let amount = parseInt(document.getElementById('sellAmount').value);

    let item = inventory.find(i => i.id === id);
    if (item) {
        let remain = item.qty - item.sold;
        if (amount > 0 && amount <= remain) {
            item.sold += amount;
            saveData();
            renderTable();
            closeModal();
        } else {
            alert('الكمية المدخلة غير صحيحة أو أكبر من المتاح في المخزن!');
        }
    }
}

// تشغيل الحساب المباشر ورسم الجدول عند فتح الصفحة
calculateLive();
renderTable();