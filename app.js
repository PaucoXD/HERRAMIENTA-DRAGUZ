// --- SISTEMA DE PESTAÑAS ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

// --- VARIABLES GLOBALES ---
let originalImage = new Image();
let cleanedImage = new Image(); // La imagen procesada lista para el mockup
let tshirtImage = new Image();

// Cargamos una playera genérica para el Mockup (puedes reemplazar la URL por tu propia foto de playera limpia)
tshirtImage.src = 'https://raw.githubusercontent.com/joshuajansen/T-Shirt-Mockup/master/img/tshirt-white.png';

// --- LOGICA PESTAÑA 1: QUITAR FONDO ---
const dropzoneBg = document.getElementById('dropzone-bg');
const fileBg = document.getElementById('file-bg');
const canvasBg = document.getElementById('canvas-bg');
const ctxBg = canvasBg.getContext('2d', { willReadFrequently: true });
const controlsBg = document.getElementById('bg-controls');
const inputTolerance = document.getElementById('tolerance');

// Manejo de carga de archivo
dropzoneBg.addEventListener('click', () => fileBg.click());
dropzoneBg.addEventListener('dragover', (e) => { e.preventDefault(); dropzoneBg.style.borderColor = 'var(--accent)'; });
dropzoneBg.addEventListener('dragleave', () => dropzoneBg.style.borderColor = 'var(--border)');
dropzoneBg.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneBg.style.borderColor = 'var(--border)';
    if(e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
});

fileBg.addEventListener('change', (e) => {
    if(e.target.files.length > 0) processFile(e.target.files[0]);
});

function processFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage.onload = () => {
            canvasBg.width = originalImage.width;
            canvasBg.height = originalImage.height;
            ctxBg.drawImage(originalImage, 0, 0);
            controlsBg.style.display = 'flex';
            
            // Guardar copia para el mockup inicial
            cleanedImage.src = canvasBg.toDataURL();
            renderMockup();
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Lógica para quitar fondo (Convierte colores cercanos al blanco en transparentes)
document.getElementById('btn-remove-bg').addEventListener('click', () => {
    ctxBg.drawImage(originalImage, 0, 0); // Restaurar original
    const imageData = ctxBg.getImageData(0, 0, canvasBg.width, canvasBg.height);
    const data = imageData.data;
    const tol = parseInt(inputTolerance.value);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        // Si el pixel es más claro que la tolerancia, hacerlo transparente
        if (r >= tol && g >= tol && b >= tol) {
            data[i + 3] = 0; // Alpha = 0 (Transparente)
        }
    }
    
    ctxBg.putImageData(imageData, 0, 0);
    // Actualizar la imagen que pasará al mockup
    cleanedImage.src = canvasBg.toDataURL();
    cleanedImage.onload = renderMockup;
});

// Actualizar texto de tolerancia
inputTolerance.addEventListener('input', (e) => {
    document.getElementById('tol-val').innerText = e.target.value;
});

// Descargar archivo preparado
document.getElementById('btn-download-clean').addEventListener('click', () => {
    downloadCanvas(canvasBg, 'arte_preparado_dtf.png');
});


// --- LOGICA PESTAÑA 2: MOCKUP ---
const canvasMock = document.getElementById('canvas-mockup');
const ctxMock = canvasMock.getContext('2d');
const scaleInput = document.getElementById('mock-scale');
const xInput = document.getElementById('mock-x');
const yInput = document.getElementById('mock-y');

function renderMockup() {
    // 1. Limpiar lienzo y dibujar la playera de fondo
    ctxMock.clearRect(0, 0, canvasMock.width, canvasMock.height);
    
    // Si la playera base aún no carga, esperar
    if(!tshirtImage.complete) {
        tshirtImage.onload = renderMockup;
        return;
    }
    
    // Centrar la playera en el canvas
    const tWidth = canvasMock.width;
    const tHeight = (tshirtImage.height / tshirtImage.width) * tWidth;
    ctxMock.drawImage(tshirtImage, 0, 0, tWidth, tHeight);

    // 2. Dibujar el arte encima si existe
    if (cleanedImage.src && cleanedImage.src.length > 10) {
        const scale = parseInt(scaleInput.value) / 100;
        const artWidth = (cleanedImage.width * scale) * (canvasMock.width / 1000); // Ajuste relativo
        const artHeight = (cleanedImage.height * scale) * (canvasMock.width / 1000);
        
        // Posiciones
        const offsetX = parseInt(xInput.value);
        const offsetY = parseInt(yInput.value);
        
        // Centrado matemático + los controles del usuario
        const drawX = (canvasMock.width / 2) - (artWidth / 2) + offsetX;
        const drawY = (canvasMock.height / 3) - (artHeight / 2) + offsetY; // Un tercio hacia abajo (pecho)

        ctxMock.drawImage(cleanedImage, drawX, drawY, artWidth, artHeight);
    }
}

// Escuchar los controles del mockup
[scaleInput, xInput, yInput].forEach(input => {
    input.addEventListener('input', renderMockup);
});

// Descargar Mockup Final
document.getElementById('btn-download-mockup').addEventListener('click', () => {
    downloadCanvas(canvasMock, 'mockup_final.png');
});

// Función de ayuda para descargar
function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}