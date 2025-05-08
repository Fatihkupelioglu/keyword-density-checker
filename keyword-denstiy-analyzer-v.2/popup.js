document.addEventListener("DOMContentLoaded", function() {
    // Sayfa yüklendiğinde boş durum mesajlarını göster
    document.querySelectorAll('table').forEach(table => {
        if (table.rows.length <= 1) {
            let emptyRow = table.insertRow();
            emptyRow.className = "empty-state";
            let cell = emptyRow.insertCell();
            cell.colSpan = 3;
            cell.textContent = "Henüz analiz yapılmadı";
        }
    });

    // Analiz et butonuna tıklama olayı
    document.getElementById("analyze").addEventListener("click", async () => {
        // Yükleniyor göstergesi
        document.getElementById("loader").style.display = "block";
        
        // Boş durum mesajlarını temizle
        document.querySelectorAll('.empty-state').forEach(row => {
            row.parentNode.removeChild(row);
        });
        
        // Tabloları temizle
        document.getElementById("single-word-table").innerHTML = "<tr><th>Kelime</th><th>% Yoğunluk</th><th>Kullanım Yeri</th></tr>";
        document.getElementById("two-word-table").innerHTML = "<tr><th>Kelime Grubu</th><th>% Yoğunluk</th><th>Kullanım Yeri</th></tr>";
        document.getElementById("three-word-table").innerHTML = "<tr><th>Kelime Grubu</th><th>% Yoğunluk</th><th>Kullanım Yeri</th></tr>";
        
        // Aktif sekmeyi al
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Content script'i çalıştır
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
        });
    });

    // Keyword density verilerini dinle
    chrome.runtime.onMessage.addListener((message) => {
        if (message.density) {
            // Yükleniyor göstergesini kapat
            document.getElementById("loader").style.display = "none";
            
            // Tabloları güncelle
            updateTable("single-word-table", message.density["1-word"]);
            updateTable("two-word-table", message.density["2-word"]);
            updateTable("three-word-table", message.density["3-word"]);
            
            // Başarı mesajını göster
            showAlert("success-alert");
        }
    });

    // Tabloları güncelleme fonksiyonu
    function updateTable(tableId, data) {
        let table = document.getElementById(tableId);
        
        // Tablo başlıklarını koru, diğer satırları temizle
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }

        // Verileri yoğunluğa göre sırala ve ilk 10'u al
        let sortedData = Object.entries(data)
            .sort((a, b) => parseFloat(b[1].density) - parseFloat(a[1].density))
            .slice(0, 10);

        if (sortedData.length === 0) {
            let emptyRow = table.insertRow();
            emptyRow.className = "empty-state";
            let cell = emptyRow.insertCell();
            cell.colSpan = 3;
            cell.textContent = "Sonuç bulunamadı";
            return;
        }

        sortedData.forEach(([word, details]) => {
            let row = table.insertRow();
            let density = parseFloat(details.density);
            
            // Yoğunluğa göre renk sınıfı ekle
            if (density > 3) {
                row.className = "high-density";
            } else if (density > 1) {
                row.className = "medium-density";
            }
            
            // Kelime hücresi
            row.insertCell(0).textContent = word;
            
            // Yoğunluk hücresi
            row.insertCell(1).textContent = details.density;
            
            // Kullanım yeri hücresi
            let positionCell = row.insertCell(2);
            if (details.positions && details.positions.length > 0) {
                details.positions.forEach(position => {
                    let badge = document.createElement("span");
                    badge.className = "position-badge";
                    badge.textContent = position;
                    positionCell.appendChild(badge);
                });
            } else {
                positionCell.textContent = "-";
            }
        });
    }

    // Kopyalama butonu olayı
    document.getElementById("copy").addEventListener("click", () => {
        let text = "";
        ["single-word-table", "two-word-table", "three-word-table"].forEach((id) => {
            let table = document.getElementById(id);
            let tableTitle = "";
            
            if (id === "single-word-table") tableTitle = "1-KELİMELİK ANAHTAR KELİMELER:";
            else if (id === "two-word-table") tableTitle = "2-KELİMELİK ANAHTAR KELİMELER:";
            else if (id === "three-word-table") tableTitle = "3-KELİMELİK ANAHTAR KELİMELER:";
            
            text += tableTitle + "\n";
            
            let rows = table.getElementsByTagName("tr");
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].classList.contains("empty-state")) {
                    text += rows[i].cells[0].textContent + " (" + rows[i].cells[1].textContent + ")\n";
                }
            }
            text += "\n";
        });
        
        navigator.clipboard.writeText(text).then(() => {
            showAlert("success-alert", "Anahtar kelimeler kopyalandı!");
        });
    });
    
    // Uyarı mesajlarını gösterme fonksiyonu
    function showAlert(alertId, message) {
        const alert = document.getElementById(alertId);
        if (message) {
            alert.textContent = message;
        }
        alert.style.display = "block";
        
        setTimeout(() => {
            alert.style.display = "none";
        }, 2000);
    }
});
