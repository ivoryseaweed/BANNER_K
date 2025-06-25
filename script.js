let selectedFormat = null;
let exampleImage = null;
let visualImages = [];

document.getElementById('exampleImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const img = new Image();
        img.onload = () => {
            exampleImage = img;
        };
        img.src = URL.createObjectURL(file);
    }
});

document.getElementById('visualImages').addEventListener('change', (e) => {
    visualImages = Array.from(e.target.files);
    if (selectedFormat && exampleImage && visualImages.length > 0) {
        document.getElementById('downloadBtn').disabled = false;
    }
});

function selectFormat(format) {
    selectedFormat = format;
    if (exampleImage && visualImages.length > 0) {
        document.getElementById('downloadBtn').disabled = false;
    }
}

document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!selectedFormat || !exampleImage || visualImages.length === 0) return;

    const zip = new JSZip();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const config = getFormatConfig(selectedFormat);

    Promise.all(visualImages.map(file => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                canvas.width = config.canvasWidth;
                canvas.height = config.canvasHeight;

                // 배경
                if (selectedFormat === 'mo2') {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }

                // 예시 배너 합성
                ctx.drawImage(exampleImage, 0, 0, canvas.width, canvas.height);

                // 비주얼 둥근 모서리 처리
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(config.visualX, config.visualY, config.visualWidth, config.visualHeight, config.borderRadius);
                ctx.clip();

                // 비율 유지 크롭
                const ratio = Math.max(config.visualWidth / img.width, config.visualHeight / img.height);
                const cropWidth = img.width * ratio;
                const cropHeight = img.height * ratio;
                const offsetX = (config.visualWidth - cropWidth) / 2;
                const offsetY = (config.visualHeight - cropHeight) / 2;

                ctx.drawImage(img, config.visualX + offsetX, config.visualY + offsetY, cropWidth, cropHeight);
                ctx.restore();

                canvas.toBlob((blob) => {
                    const ext = selectedFormat === 'mo2' ? 'jpg' : 'png';
                    zip.file(file.name.replace(/\.[^/.]+$/, '') + `.${ext}`, blob);
                    resolve();
                }, selectedFormat === 'mo2' ? 'image/jpeg' : 'image/png');
            };
            img.src = URL.createObjectURL(file);
        });
    })).then(() => {
        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, 'banners.zip');
        });
    });
});

document.getElementById('resetBtn').addEventListener('click', () => {
    location.reload();
});

function getFormatConfig(format) {
    if (format === 'biz2') {
        return {
            canvasWidth: 1029,
            canvasHeight: 258,
            visualX: 48,
            visualY: 36,
            visualWidth: 315,
            visualHeight: 186,
            borderRadius: 20
        };
    } else if (format === 'biz1') {
        return {
            canvasWidth: 1029,
            canvasHeight: 258,
            visualX: 260,
            visualY: 45,
            visualWidth: 163, // 1:1
            visualHeight: 163,
            borderRadius: 20
        };
    } else if (format === 'mo2') {
        return {
            canvasWidth: 1200,
            canvasHeight: 600,
            visualX: 0,
            visualY: 193,
            visualWidth: 1200,
            visualHeight: 497,
            borderRadius: 0
        };
    }
}
