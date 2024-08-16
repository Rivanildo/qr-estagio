let html5QrCode;

function onScanSuccess(decodedText, decodedResult) {
    addResult(decodedText);
    $('#addRecordModal').modal('hide');
    $('#success-toast').toast('show');
    stopScanning();
}

function startScanning() {
    html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onScanSuccess
    ).catch(err => {
        console.error('Erro ao iniciar a leitura do QR code:', err);
        $('#error-toast').toast('show');
    });
}

function stopScanning() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log('QR code scanning stopped.');
        }).catch(err => {
            console.error('Erro ao parar a leitura do QR code:', err);
        });
        html5QrCode = null;
    }
}

$('#addRecordModal').on('shown.bs.modal', function () {
    startScanning();
});

$('#addRecordModal').on('hidden.bs.modal', function () {
    stopScanning();
});


async function addResult(decodedText) {
    var parsedText = decodedText ;
    
    const items = [];
    const data = localStorage.getItem('qrData');
    if (data) {
        items.push(...JSON.parse(data));
    }
    const newItem = {
        nome: parsedText,
        timestamp: new Date().toLocaleString(),
        status: 'pending'
    };
    items.push(newItem);
    localStorage.setItem('qrData', JSON.stringify(items));
    displayResults();

    // Enviar dados para o servidor
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain");

    const raw = JSON.stringify({ data: JSON.stringify(newItem) });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw
    };

    fetch("https://script.google.com/macros/s/AKfycbxVoCF12H9O3M-wCJSDvs63P-M5kGTLROeSzb0zsDlWAVa8b6oyazAh5rVikZLWNl_6dg/exec", requestOptions)
    .then(data => {
        console.log('data::: ', data);
        const updatedItem = { ...newItem, status: 'success' };
        updateResultStatus(updatedItem);
    })
    .catch (error => {
        console.error('Erro ao enviar dados para o servidor:', error);
        const updatedItem = { ...newItem, status: 'error' };
        updateResultStatus(updatedItem);
    })
}

function updateResultStatus(updatedItem) {
    const data = localStorage.getItem('qrData');
    if (data) {
        const items = JSON.parse(data);
        const updatedItems = items.map(item => 
            item.timestamp === updatedItem.timestamp ? updatedItem : item
        );
        localStorage.setItem('qrData', JSON.stringify(updatedItems));
        displayResults();
    }
}

// Função para exibir resultados na tabela
function displayResults() {
    const resultsBody = document.getElementById('results-body');
    const data = localStorage.getItem('qrData');
    if (data) {
        resultsBody.innerHTML = '';
        const items = JSON.parse(data);
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.timestamp}</td>
                <td>${item.nome}</td>
                <td>
                    <i class="fa ${item.status === 'success' ? 'fa-check-circle text-success' : item.status === 'error' ? 'fa-times-circle text-danger' : 'fa-hourglass-half text-warning'}" aria-hidden="true"></i>
                </td>
            `;
            resultsBody.appendChild(row);
        });
    }
}

window.onload = function() {
    displayResults();
}
