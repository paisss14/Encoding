/**
 * EncodeX - Open-Source Data Encoding & Decoding Tool + Manchester Messenger
 * JavaScript Logic
 */

// Global State / Output Buffer
let currentEncodedStream = "";
let currentDecodedText = "";

document.addEventListener("DOMContentLoaded", () => {
    clearAlert();
});

/* ==========================================================================
   NAVIGATION & UI HELPERS (LAMA)
   ========================================================================== */
function switchTab(tabName) {
    clearAlert();
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.add("hidden"));

    const targetBtn = document.getElementById(`tab-btn-${tabName}`);
    const targetSection = document.getElementById(`section-${tabName}`);
    
    if (targetBtn) targetBtn.classList.add("active");
    if (targetSection) targetSection.classList.remove("active", "hidden");

    const navLinks = document.querySelectorAll(".nav-link");
    if (tabName === "encoding" && navLinks[0]) navLinks[0].classList.add("active");
    if (tabName === "decoding" && navLinks[1]) navLinks[1].classList.add("active");
    if (tabName === "messenger" && navLinks[2]) navLinks[2].classList.add("active");
    if (tabName === "about" && navLinks[3]) navLinks[3].classList.add("active");
}

function showAlert(message) {
    const alertBox = document.getElementById("global-alert");
    const alertMessage = document.getElementById("alert-message");
    if (alertBox && alertMessage) {
        alertMessage.textContent = message;
        alertBox.classList.remove("hidden");
        window.scrollTo({ top: alertBox.offsetTop - 80, behavior: "smooth" });
    }
}

function clearAlert() {
    const alertBox = document.getElementById("global-alert");
    if (alertBox) alertBox.classList.add("hidden");
}

/* ==========================================================================
   CORE ENCODING & PARITY LOGIC (LAMA - TIDAK DIUBAH)
   ========================================================================== */
function calculateParityBit(dataBits, parityType) {
    if (parityType === "None") return "";
    let onesCount = 0;
    for (let i = 0; i < dataBits.length; i++) {
        if (dataBits[i] === "1") onesCount++;
    }
    if (parityType === "Even") return (onesCount % 2 === 0) ? "0" : "1";
    if (parityType === "Odd") return (onesCount % 2 !== 0) ? "0" : "1";
    return "";
}

function checkParity(fullBlockBits, parityType) {
    if (parityType === "None") return { pass: true, parityBit: "-", dataBits: fullBlockBits };
    const parityBit = fullBlockBits.charAt(0);
    const dataBits = fullBlockBits.substring(1);
    let totalOnes = 0;
    for (let i = 0; i < fullBlockBits.length; i++) {
        if (fullBlockBits[i] === "1") totalOnes++;
    }
    let pass = false;
    if (parityType === "Even") pass = (totalOnes % 2 === 0);
    else if (parityType === "Odd") pass = (totalOnes % 2 !== 0);
    return { pass, parityBit, dataBits };
}

/* ==========================================================================
   ENCODING PROCESSOR (LAMA - TIDAK DIUBAH)
   ========================================================================== */
function processEncoding() {
    clearAlert();
    const textInput = document.getElementById("encoding-input").value;
    if (!textInput) return showAlert("Please enter text to encode.");

    const encType = document.querySelector('input[name="enc-type"]:checked').value;
    const parityType = document.querySelector('input[name="enc-parity"]:checked').value;
    const results = [];
    const finalBitsList = [];

    for (let i = 0; i < textInput.length; i++) {
        const char = textInput[i];
        const codePoint = char.codePointAt(0);
        let binaryData = "";

        if (encType === "ASCII") {
            if (codePoint > 127) return showAlert(`Character '${char}' is outside ASCII 7-bit range.`);
            binaryData = codePoint.toString(2).padStart(7, "0");
        } else {
            binaryData = codePoint.toString(2);
            if (binaryData.length < 8) binaryData = binaryData.padStart(8, "0");
        }

        const parityBit = calculateParityBit(binaryData, parityType);
        const finalBit = parityBit + binaryData;

        results.push({
            char: char === " " ? "Space" : char,
            codeDisplay: encType === "Unicode" ? `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}` : codePoint,
            binaryData: binaryData,
            parityBit: parityBit || "-",
            finalBit: finalBit
        });
        finalBitsList.push(finalBit);
    }
    currentEncodedStream = finalBitsList.join(" ");
    renderEncodingResults(results, currentEncodedStream, encType);
}

function renderEncodingResults(results, bitStream, encType) {
    const tableHeader = document.getElementById("encoding-table-header");
    const tableBody = document.getElementById("encoding-table-body");
    const streamBox = document.getElementById("final-bit-stream");
    const container = document.getElementById("encoding-result-container");

    tableHeader.children[1].textContent = encType === "Unicode" ? "Unicode Code Point" : "Decimal Value";
    tableBody.innerHTML = "";
    results.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><strong>${item.char}</strong></td><td>${item.codeDisplay}</td><td><code>${item.binaryData}</code></td><td><code>${item.parityBit}</code></td><td><code><strong>${item.finalBit}</strong></code></td>`;
        tableBody.appendChild(tr);
    });
    streamBox.textContent = bitStream;
    renderBitVisualization(results);
    container.classList.remove("hidden");
}

function renderBitVisualization(results) {
    const grid = document.getElementById("bit-visualization-grid");
    grid.innerHTML = "";
    results.forEach(item => {
        const block = document.createElement("div"); block.className = "bit-char-block";
        const label = document.createElement("div"); label.className = "bit-char-label"; label.textContent = item.char;
        const table = document.createElement("table"); table.className = "bit-table";
        const headerRow = document.createElement("tr"); const dataRow = document.createElement("tr");

        if (item.parityBit !== "-") {
            const th = document.createElement("th"); th.className = "bit-header-parity"; th.textContent = "P"; headerRow.appendChild(th);
            const td = document.createElement("td"); td.textContent = item.parityBit; dataRow.appendChild(td);
        }
        for (let i = 0; i < item.binaryData.length; i++) {
            const th = document.createElement("th"); th.className = "bit-header-data"; th.textContent = "D"; headerRow.appendChild(th);
            const td = document.createElement("td"); td.textContent = item.binaryData[i]; dataRow.appendChild(td);
        }
        table.appendChild(headerRow); table.appendChild(dataRow);
        block.appendChild(label); block.appendChild(table); grid.appendChild(block);
    });
}

function clearEncoding() {
    document.getElementById("encoding-input").value = "";
    document.getElementById("encoding-result-container").classList.add("hidden");
    clearAlert();
}

/* ==========================================================================
   DECODING PROCESSOR (LAMA - TIDAK DIUBAH)
   ========================================================================== */
function processDecoding() {
    clearAlert();
    const rawInput = document.getElementById("decoding-input").value.trim();
    if (!rawInput) return showAlert("Please enter binary data to decode.");
    if (/[^01\s]/.test(rawInput)) return showAlert("Invalid binary input. Only 0 and 1 allowed.");

    const encType = document.querySelector('input[name="dec-type"]:checked').value;
    const parityType = document.querySelector('input[name="dec-parity"]:checked').value;
    const blocks = rawInput.split(/\s+/).filter(b => b.length > 0);
    if (blocks.length === 0) return showAlert("Please enter binary data to decode.");

    const expectedLength = blocks[0].length;
    for (let i = 1; i < blocks.length; i++) {
        if (blocks[i].length !== expectedLength) return showAlert("Invalid bit length. All blocks must match.");
    }

    if (encType === "ASCII") {
        const requiredLen = (parityType === "None") ? 7 : 8;
        if (expectedLength !== requiredLen) return showAlert(`Invalid bit length for ASCII with ${parityType} parity. Expected ${requiredLen}.`);
    } else {
        const minLen = (parityType === "None") ? 1 : 2;
        if (expectedLength < minLen) return showAlert("Invalid bit length for Unicode.");
    }

    const results = [];
    let decodedChars = [];
    let hasParityError = false;

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const parityResult = checkParity(block, parityType);

        if (!parityResult.pass) {
            hasParityError = true;
            results.push({ block, parityBit: parityResult.parityBit, dataBits: parityResult.dataBits, status: "ERROR", decimalDisplay: "-----", charDisplay: "*" });
            decodedChars.push("*");
        } else {
            const decimalVal = parseInt(parityResult.dataBits, 2);
            if (encType === "ASCII") {
                if (decimalVal < 0 || decimalVal > 127) return showAlert(`Invalid ASCII value (${decimalVal}).`);
                const charStr = String.fromCharCode(decimalVal);
                results.push({ block, parityBit: parityResult.parityBit, dataBits: parityResult.dataBits, status: "PASS", decimalDisplay: decimalVal, charDisplay: charStr === " " ? "Space" : charStr });
                decodedChars.push(charStr);
            } else {
                let charStr = "";
                try { charStr = String.fromCodePoint(decimalVal); } catch (e) { return showAlert(`Invalid Unicode (${decimalVal}).`); }
                results.push({ block, parityBit: parityResult.parityBit, dataBits: parityResult.dataBits, status: "PASS", decimalDisplay: `U+${decimalVal.toString(16).toUpperCase().padStart(4, "0")}`, charDisplay: charStr === " " ? "Space" : charStr });
                decodedChars.push(charStr);
            }
        }
    }
    currentDecodedText = decodedChars.join("");
    renderDecodingResults(results, currentDecodedText, hasParityError);
}

function renderDecodingResults(results, decodedText, hasError) {
    const banner = document.getElementById("parity-status-banner");
    const tableBody = document.getElementById("decoding-table-body");
    const outputDisplay = document.getElementById("decoded-text-output");
    const container = document.getElementById("decoding-result-container");

    if (hasError) {
        banner.className = "status-banner error";
        banner.innerHTML = `<div>⚠ Parity Error Detected</div><div class="status-detail">Jumlah bit 1 tidak sesuai dengan aturan parity.</div>`;
    } else {
        banner.className = "status-banner pass";
        banner.innerHTML = `<div>✓ Parity Check Passed</div><div class="status-detail">Semua blok bit memenuhi pemeriksaan aturan parity.</div>`;
    }
    tableBody.innerHTML = "";
    results.forEach(item => {
        const tr = document.createElement("tr");
        const badgeClass = item.status === "PASS" ? "badge-pass" : "badge-error";
        tr.innerHTML = `<td><code>${item.block}</code></td><td><code>${item.parityBit}</code></td><td><code>${item.dataBits}</code></td><td><span class="badge ${badgeClass}">${item.status}</span></td><td>${item.decimalDisplay}</td><td><strong>${item.charDisplay}</strong></td>`;
        tableBody.appendChild(tr);
    });
    outputDisplay.textContent = decodedText;
    container.classList.remove("hidden");
}

function clearDecoding() {
    document.getElementById("decoding-input").value = "";
    document.getElementById("decoding-result-container").classList.add("hidden");
    clearAlert();
}

function copyBitStream() { copyToClipboard(currentEncodedStream, "btn-copy-stream", "📋 COPY BIT STREAM"); }
function copyDecodedText() { copyToClipboard(currentDecodedText, "btn-copy-decoded", "📋 COPY RESULT"); }

function copyToClipboard(text, buttonId, originalText) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showCopySuccess(buttonId, originalText)).catch(() => fallbackCopy(text, buttonId, originalText));
    } else fallbackCopy(text, buttonId, originalText);
}
function fallbackCopy(text, buttonId, originalText) {
    try {
        const tempTextArea = document.createElement("textarea"); tempTextArea.value = text; document.body.appendChild(tempTextArea);
        tempTextArea.select(); document.execCommand("copy"); document.body.removeChild(tempTextArea);
        showCopySuccess(buttonId, originalText);
    } catch (err) { showAlert("Unable to copy automatically."); }
}
function showCopySuccess(buttonId, originalText) {
    const btn = document.getElementById(buttonId);
    if (btn) { btn.textContent = "✓ Copied!"; setTimeout(() => { btn.textContent = originalText; }, 2000); }
}


/* ==========================================================================
   BAGIAN BARU: LOCAL MANCHESTER MESSENGER
   ========================================================================== */

let socket = null;
let currentRoomId = null;
let currentSenderId = null;
const displayedMessages = new Set(); // Mencegah duplikasi pesan

// Inisialisasi koneksi Socket.IO
function initSocket() {
    if (socket) return;
    // Cek apakah socket.io dimuat
    if (typeof io !== 'undefined') {
        socket = io();

        socket.on('connect', () => {
            showConnectionStatus('Terhubung', 'connected');
        });

        socket.on('disconnect', () => {
            showConnectionStatus('Terputus', 'disconnected');
        });

        socket.on('connect_error', () => {
            showConnectionStatus('Menghubungkan kembali...', 'connecting');
        });

        socket.on('receiveMessage', (msgObj) => {
            receiveMessage(msgObj);
        });
    } else {
        console.warn("Socket.IO tidak ditemukan. Pastikan menjalankan via server.js.");
    }
}

// Panggil initSocket saat dokumen siap
document.addEventListener("DOMContentLoaded", () => {
    initSocket();
});

function showConnectionStatus(text, statusClass) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.textContent = `● ${text}`;
        statusEl.className = `conn-status ${statusClass}`;
    }
}

function handleMessengerError(msg) {
    showAlert(msg);
}

// 1. Buat Room
function createRoom() {
    clearAlert();
    const senderInput = document.getElementById('sender-id-input').value.trim();
    if (!senderInput) return handleMessengerError("Silakan masukkan Sender ID.");
    if (!socket || !socket.connected) return handleMessengerError("Gagal terhubung ke server. Pastikan server Node.js berjalan.");

    socket.emit('createRoom', {}, (response) => {
        if (response.success) {
            document.getElementById('room-id-input').value = response.roomId;
            document.getElementById('room-token-input').value = response.token;
            document.getElementById('room-status-text').textContent = "Room aktif; bagikan ID dan token.";
            document.getElementById('room-status-text').style.color = "#10b981";
            
            // Otomatis join room setelah dibuat
            joinRoom();
        } else {
            handleMessengerError("Gagal membuat room.");
        }
    });
}

// 2. Gabung Room
function joinRoom() {
    clearAlert();
    const roomId = document.getElementById('room-id-input').value.trim();
    const token = document.getElementById('room-token-input').value.trim();
    const senderId = document.getElementById('sender-id-input').value.trim();

    if (!roomId) return handleMessengerError("Silakan masukkan Room ID.");
    if (!token) return handleMessengerError("Silakan masukkan Token sesi.");
    if (!senderId) return handleMessengerError("Silakan masukkan Sender ID.");
    if (!socket || !socket.connected) return handleMessengerError("Gagal terhubung ke server.");

    socket.emit('joinRoom', { roomId, token, senderId }, (response) => {
        if (response.success) {
            currentRoomId = roomId;
            currentSenderId = senderId;
            document.getElementById('room-status-text').textContent = "Room aktif; kamu berhasil bergabung.";
            document.getElementById('room-status-text').style.color = "#10b981";
            document.getElementById('chat-container').classList.remove('hidden');
            
            // Render history pesan jika ada
            const history = response.messages || [];
            history.forEach(msg => receiveMessage(msg));
        } else {
            handleMessengerError(response.message || "Gagal bergabung ke room.");
        }
    });
}

// 3. Konversi ASCII ke 8-bit Binary
function asciiToBinary(text) {
    let binaryStr = "";
    for (let i = 0; i < text.length; i++) {
        // Hanya mendukung ASCII valid
        let code = text.charCodeAt(i);
        if (code > 127) code = 63; // ubah karakter non-ASCII menjadi '?'
        binaryStr += code.toString(2).padStart(8, '0');
    }
    return binaryStr;
}

// 4. Konversi Binary ke Manchester (0=10, 1=01)
function binaryToManchester(binaryStr) {
    let manchester = "";
    for (let i = 0; i < binaryStr.length; i++) {
        if (binaryStr[i] === '0') manchester += "10";
        else manchester += "01";
    }
    return manchester;
}

// 5. CRC32 Checksum Sederhana
function calculateChecksum(str) {
    let crcTable = window.crcTable || (window.crcTable = (function() {
        let c;
        let crcTable = [];
        for(let n = 0; n < 256; n++){
            c = n;
            for(let k = 0; k < 8; k++){
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
    })());

    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

// 6. Handle Kirim Pesan (Enter key)
function handleChatEnter(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

// 7. Kirim Pesan
function sendMessage() {
    clearAlert();
    const inputEl = document.getElementById('chat-input');
    let text = inputEl.value.trim();
    
    if (!text) return handleMessengerError("Pesan tidak boleh kosong.");
    if (text.length > 500) return handleMessengerError("Pesan terlalu panjang (max 500 karakter).");
    if (!currentRoomId || !currentSenderId) return handleMessengerError("Silakan gabung ke room terlebih dahulu.");

    // Sanitasi sangat dasar untuk proteksi
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const asciiBinary = asciiToBinary(text);
    const manchester = binaryToManchester(asciiBinary);
    // Hitung checksum dari teks asli yang dikirim (dikonversi ke hex string)
    const checksum = calculateChecksum(text).toString(16).padStart(8, '0');

    socket.emit('sendMessage', {
        roomId: currentRoomId,
        senderId: currentSenderId,
        text: text,
        asciiBinary: asciiBinary,
        manchester: manchester,
        checksum: checksum
    }, (response) => {
        if (response && !response.success) {
            handleMessengerError(response.message);
        } else {
            inputEl.value = ""; // Bersihkan input
        }
    });
}

// 8. Terima Pesan (dari Server / Broadcast)
function receiveMessage(msgObj) {
    const msgId = `${currentRoomId}-${msgObj.sequence}`;
    
    // MENCEGAH DUPLIKASI PESAN
    if (displayedMessages.has(msgId)) return;
    displayedMessages.add(msgId);

    renderMessage(msgObj);
    updateMessageInfo(msgObj);
    renderManchesterWaveform(msgObj.asciiBinary, msgObj.manchester);
}

// 9. Render Daftar Pesan di UI
function renderMessage(msgObj) {
    const listEl = document.getElementById('message-list');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-item';
    
    // Format: [sequence] SenderID: pesan
    msgDiv.innerHTML = `[${msgObj.sequence}] <strong>${msgObj.senderId}</strong>: ${msgObj.text}`;
    listEl.appendChild(msgDiv);

    // Auto scroll ke bawah
    listEl.scrollTop = listEl.scrollHeight;
}

// 10. Update Info di bawah waveform
function updateMessageInfo(msgObj) {
    document.getElementById('info-text').innerHTML = msgObj.text;
    document.getElementById('info-manchester').textContent = msgObj.manchester;
    document.getElementById('info-checksum').textContent = msgObj.checksum;
    
    // Verifikasi Checksum lokal
    const localChecksum = calculateChecksum(msgObj.text).toString(16).padStart(8, '0');
    const statusEl = document.getElementById('info-status');
    
    if (localChecksum === msgObj.checksum) {
        statusEl.textContent = 'valid';
        statusEl.className = 'badge badge-pass';
    } else {
        statusEl.textContent = 'invalid';
        statusEl.className = 'badge badge-error';
    }
}

// 11. Render Waveform (SVG Dinamis)
function renderManchesterWaveform(binary, manchester) {
    const wrapper = document.getElementById('waveform-display');
    wrapper.innerHTML = ""; // Bersihkan
    
    // Ukuran konfigurasi SVG
    const BIT_WIDTH = 40; 
    const HALF_BIT = BIT_WIDTH / 2;
    const HEIGHT = 100;
    const HIGH_Y = 20;
    const LOW_Y = 80;
    const TOTAL_WIDTH = binary.length * BIT_WIDTH + 40; // padding
    
    let svgContent = `<svg width="${TOTAL_WIDTH}" height="${HEIGHT}" class="waveform-svg">`;
    
    // Gambar label HIGH / LOW
    svgContent += `
        <text x="5" y="${HIGH_Y + 4}" class="wave-label">HIGH</text>
        <text x="5" y="${LOW_Y + 4}" class="wave-label">LOW</text>
    `;

    // Awal garis (Start offset 40px)
    let currentX = 40;
    let pathD = "";
    let isFirst = true;

    for (let i = 0; i < binary.length; i++) {
        const bit = binary[i]; // '0' atau '1'
        const mCode = manchester.substr(i*2, 2); // '10' atau '01'
        
        // Gambar batas vertikal bit
        svgContent += `<line x1="${currentX}" y1="10" x2="${currentX}" y2="90" class="wave-grid" />`;
        // Gambar label teks (0 atau 1) di atas
        svgContent += `<text x="${currentX + HALF_BIT}" y="12" class="wave-text">${bit}</text>`;

        // Logika path waveform
        if (bit === '0') {
            // 0 = 10 (HIGH ke LOW)
            let startY = HIGH_Y;
            if (isFirst) {
                pathD += `M ${currentX} ${startY} `;
                isFirst = false;
            } else {
                pathD += `L ${currentX} ${startY} `;
            }
            pathD += `L ${currentX + HALF_BIT} ${HIGH_Y} `;
            pathD += `L ${currentX + HALF_BIT} ${LOW_Y} `;
            pathD += `L ${currentX + BIT_WIDTH} ${LOW_Y} `;
        } else {
            // 1 = 01 (LOW ke HIGH)
            let startY = LOW_Y;
            if (isFirst) {
                pathD += `M ${currentX} ${startY} `;
                isFirst = false;
            } else {
                pathD += `L ${currentX} ${startY} `;
            }
            pathD += `L ${currentX + HALF_BIT} ${LOW_Y} `;
            pathD += `L ${currentX + HALF_BIT} ${HIGH_Y} `;
            pathD += `L ${currentX + BIT_WIDTH} ${HIGH_Y} `;
        }
        
        currentX += BIT_WIDTH;
    }

    // Akhiri garis akhir grid
    svgContent += `<line x1="${currentX}" y1="10" x2="${currentX}" y2="90" class="wave-grid" />`;
    
    // Tambahkan path ke SVG
    svgContent += `<path d="${pathD}" class="wave-line" />`;
    svgContent += `</svg>`;

    wrapper.innerHTML = svgContent;
}
