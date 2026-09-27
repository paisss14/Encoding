/**
 * EncodeX - Open-Source Data Encoding & Decoding Tool
 * JavaScript Logic
 */

// Global State / Output Buffer
let currentEncodedStream = "";
let currentDecodedText = "";

// Initialize Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Clear alerts on tab change or user action
    clearAlert();
});

/* ==========================================================================
   NAVIGATION & UI HELPERS
   ========================================================================== */

function switchTab(tabName) {
    clearAlert();

    // Remove active class from all tabs and section
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.add("hidden"));

    // Activate target tab
    const targetBtn = document.getElementById(`tab-btn-${tabName}`);
    const targetSection = document.getElementById(`section-${tabName}`);
    
    if (targetBtn) targetBtn.classList.add("active");
    if (targetSection) targetSection.classList.remove("active", "hidden");

    // Update navbar active link
    const navLinks = document.querySelectorAll(".nav-link");
    if (tabName === "encoding" && navLinks[0]) navLinks[0].classList.add("active");
    if (tabName === "decoding" && navLinks[1]) navLinks[1].classList.add("active");
    if (tabName === "about" && navLinks[2]) navLinks[2].classList.add("active");
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
    if (alertBox) {
        alertBox.classList.add("hidden");
    }
}

/* ==========================================================================
   CORE CORE ENCODING & PARITY LOGIC
   ========================================================================== */

/**
 * Calculates parity bit based on rule:
 * Format: [PARITY BIT][DATA BITS]
 * Parity bit is placed at the FRONT (MSB position).
 */
function calculateParityBit(dataBits, parityType) {
    if (parityType === "None") return "";

    // Count number of '1's in data bits
    let onesCount = 0;
    for (let i = 0; i < dataBits.length; i++) {
        if (dataBits[i] === "1") onesCount++;
    }

    if (parityType === "Even") {
        // Total '1's including parity bit must be EVEN
        return (onesCount % 2 === 0) ? "0" : "1";
    } else if (parityType === "Odd") {
        // Total '1's including parity bit must be ODD
        return (onesCount % 2 !== 0) ? "0" : "1";
    }

    return "";
}

/**
 * Performs parity check on full block bit stream [PARITY BIT][DATA BITS]
 */
function checkParity(fullBlockBits, parityType) {
    if (parityType === "None") {
        return { pass: true, parityBit: "-", dataBits: fullBlockBits };
    }

    const parityBit = fullBlockBits.charAt(0);
    const dataBits = fullBlockBits.substring(1);

    let totalOnes = 0;
    for (let i = 0; i < fullBlockBits.length; i++) {
        if (fullBlockBits[i] === "1") totalOnes++;
    }

    let pass = false;
    if (parityType === "Even") {
        pass = (totalOnes % 2 === 0);
    } else if (parityType === "Odd") {
        pass = (totalOnes % 2 !== 0);
    }

    return { pass, parityBit, dataBits };
}

/* ==========================================================================
   ENCODING PROCESSOR
   ========================================================================== */

function processEncoding() {
    clearAlert();

    const textInput = document.getElementById("encoding-input").value;
    if (!textInput) {
        showAlert("Please enter text to encode.");
        return;
    }

    const encType = document.querySelector('input[name="enc-type"]:checked').value;
    const parityType = document.querySelector('input[name="enc-parity"]:checked').value;

    const results = [];
    const finalBitsList = [];

    for (let i = 0; i < textInput.length; i++) {
        const char = textInput[i];
        const codePoint = char.codePointAt(0);

        let binaryData = "";

        if (encType === "ASCII") {
            // Check ASCII 7-bit validity
            if (codePoint > 127) {
                showAlert(`Character '${char}' (code point ${codePoint}) is outside ASCII 7-bit range (0–127). Please use Unicode mode.`);
                return;
            }
            binaryData = codePoint.toString(2).padStart(7, "0");
        } else {
            // Unicode Mode: pad to standard 8-bit or minimum required
            binaryData = codePoint.toString(2);
            if (binaryData.length < 8) {
                binaryData = binaryData.padStart(8, "0");
            }
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

    // Header label adjustment
    tableHeader.children[1].textContent = encType === "Unicode" ? "Unicode Code Point" : "Decimal Value";

    tableBody.innerHTML = "";
    results.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.char}</strong></td>
            <td>${item.codeDisplay}</td>
            <td><code>${item.binaryData}</code></td>
            <td><code>${item.parityBit}</code></td>
            <td><code><strong>${item.finalBit}</strong></code></td>
        `;
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
        const block = document.createElement("div");
        block.className = "bit-char-block";

        const label = document.createElement("div");
        label.className = "bit-char-label";
        label.textContent = item.char;

        const table = document.createElement("table");
        table.className = "bit-table";

        const headerRow = document.createElement("tr");
        const dataRow = document.createElement("tr");

        let bitIndex = 0;
        if (item.parityBit !== "-") {
            const th = document.createElement("th");
            th.className = "bit-header-parity";
            th.textContent = "P";
            headerRow.appendChild(th);

            const td = document.createElement("td");
            td.textContent = item.parityBit;
            dataRow.appendChild(td);
        }

        for (let i = 0; i < item.binaryData.length; i++) {
            const th = document.createElement("th");
            th.className = "bit-header-data";
            th.textContent = "D";
            headerRow.appendChild(th);

            const td = document.createElement("td");
            td.textContent = item.binaryData[i];
            dataRow.appendChild(td);
        }

        table.appendChild(headerRow);
        table.appendChild(dataRow);

        block.appendChild(label);
        block.appendChild(table);
        grid.appendChild(block);
    });
}

function clearEncoding() {
    document.getElementById("encoding-input").value = "";
    document.getElementById("encoding-result-container").classList.add("hidden");
    clearAlert();
}

/* ==========================================================================
   DECODING PROCESSOR
   ========================================================================== */

function processDecoding() {
    clearAlert();

    const rawInput = document.getElementById("decoding-input").value.trim();
    if (!rawInput) {
        showAlert("Please enter binary data to decode.");
        return;
    }

    // Input Validation: Only allow 0, 1, spaces, newlines
    const invalidCharRegex = /[^01\s]/;
    if (invalidCharRegex.test(rawInput)) {
        showAlert("Invalid binary input. Only 0 and 1 are allowed.");
        return;
    }

    const encType = document.querySelector('input[name="dec-type"]:checked').value;
    const parityType = document.querySelector('input[name="dec-parity"]:checked').value;

    // Split blocks by whitespace
    const blocks = rawInput.split(/\s+/).filter(b => b.length > 0);
    if (blocks.length === 0) {
        showAlert("Please enter binary data to decode.");
        return;
    }

    // Verify all blocks have equal length
    const expectedLength = blocks[0].length;
    for (let i = 1; i < blocks.length; i++) {
        if (blocks[i].length !== expectedLength) {
            showAlert("Invalid bit length. All binary blocks must have the exact same bit length.");
            return;
        }
    }

    // Validate bit length against selected configuration
    if (encType === "ASCII") {
        const requiredLen = (parityType === "None") ? 7 : 8;
        if (expectedLength !== requiredLen) {
            showAlert(`Invalid bit length for ASCII mode with ${parityType} parity. Expected ${requiredLen} bits per block, but got ${expectedLength} bits.`);
            return;
        }
    } else {
        // Unicode validation
        const minLen = (parityType === "None") ? 1 : 2;
        if (expectedLength < minLen) {
            showAlert("Invalid bit length for the selected Unicode configuration.");
            return;
        }
    }

    const results = [];
    let decodedChars = [];
    let hasParityError = false;

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const parityResult = checkParity(block, parityType);

        if (!parityResult.pass) {
            hasParityError = true;
            results.push({
                block: block,
                parityBit: parityResult.parityBit,
                dataBits: parityResult.dataBits,
                status: "ERROR",
                decimalDisplay: "-----",
                charDisplay: "*"
            });
            decodedChars.push("*");
        } else {
            const decimalVal = parseInt(parityResult.dataBits, 2);

            if (isNaN(decimalVal)) {
                showAlert("Failed to parse binary data.");
                return;
            }

            if (encType === "ASCII") {
                if (decimalVal < 0 || decimalVal > 127) {
                    showAlert(`Invalid ASCII value (${decimalVal}). ASCII 7-bit supports values from 0 to 127.`);
                    return;
                }
                const charStr = String.fromCharCode(decimalVal);
                results.push({
                    block: block,
                    parityBit: parityResult.parityBit,
                    dataBits: parityResult.dataBits,
                    status: "PASS",
                    decimalDisplay: decimalVal,
                    charDisplay: charStr === " " ? "Space" : charStr
                });
                decodedChars.push(charStr);
            } else {
                // Unicode
                let charStr = "";
                try {
                    charStr = String.fromCodePoint(decimalVal);
                } catch (e) {
                    showAlert(`Invalid Unicode code point (${decimalVal}).`);
                    return;
                }
                const codeHex = `U+${decimalVal.toString(16).toUpperCase().padStart(4, "0")}`;
                results.push({
                    block: block,
                    parityBit: parityResult.parityBit,
                    dataBits: parityResult.dataBits,
                    status: "PASS",
                    decimalDisplay: codeHex,
                    charDisplay: charStr === " " ? "Space" : charStr
                });
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
        banner.innerHTML = `
            <div>⚠ Parity Error Detected</div>
            <div class="status-detail">Jumlah bit 1 tidak sesuai dengan aturan parity yang dipilih. Data kemungkinan mengalami perubahan bit saat transmisi.</div>
        `;
    } else {
        banner.className = "status-banner pass";
        banner.innerHTML = `
            <div>✓ Parity Check Passed</div>
            <div class="status-detail">Semua blok bit memenuhi pemeriksaan aturan parity.</div>
        `;
    }

    tableBody.innerHTML = "";
    results.forEach(item => {
        const tr = document.createElement("tr");
        const badgeClass = item.status === "PASS" ? "badge-pass" : "badge-error";

        tr.innerHTML = `
            <td><code>${item.block}</code></td>
            <td><code>${item.parityBit}</code></td>
            <td><code>${item.dataBits}</code></td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td>${item.decimalDisplay}</td>
            <td><strong>${item.charDisplay}</strong></td>
        `;
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

/* ==========================================================================
   CLIPBOARD UTILITIES
   ========================================================================== */

function copyBitStream() {
    copyToClipboard(currentEncodedStream, "btn-copy-stream", "📋 COPY BIT STREAM");
}

function copyDecodedText() {
    copyToClipboard(currentDecodedText, "btn-copy-decoded", "📋 COPY RESULT");
}

function copyToClipboard(text, buttonId, originalText) {
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess(buttonId, originalText);
        }).catch(() => {
            fallbackCopy(text, buttonId, originalText);
        });
    } else {
        fallbackCopy(text, buttonId, originalText);
    }
}

function fallbackCopy(text, buttonId, originalText) {
    try {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = text;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
        showCopySuccess(buttonId, originalText);
    } catch (err) {
        showAlert("Unable to copy automatically. Please copy the bit stream manually.");
    }
}

function showCopySuccess(buttonId, originalText) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.textContent = "✓ Copied!";
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }
}