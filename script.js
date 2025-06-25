document.addEventListener('DOMContentLoaded', () => {
    let selectedFormat = null;
    let exampleImage = null;
    let visualImages = [];

    const exampleImageInput = document.getElementById('exampleImage');
    const visualImagesInput = document.getElementById('visualImages');
    const downloadBtn = document.getElementById('downloadBtn');

    function updateDownloadButtonState() {
        if (selectedFormat && exampleImage && visualImages.length > 0) {
            downloadBtn.disabled = false;
        } else {
            downloadBtn.disabled = true;
        }
    }

    exampleImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                exampleImage = img;
                updateDownloadButtonState();
            };
            img.src = URL.createObjectURL(file);
        } else {
            exampleImage = null;
            updateDownloadButtonState();
        }
    });

    visualImagesInput.addEventListener('change', (e) => {
        visualImages = Array.from(e.target.files);
        updateDownloadButtonState();
    });

    function selectFormat(format) {
        selectedFormat = format;
        updateDownloadButtonState();
    }

    downloadBtn.addEventListener('click', () => {
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

                    // 비주얼 둥근 모서리 처리 및 위치 조정
                    const x = config.visualX;
                    const y = config.visualY;
                    const width = config.visualWidth;
                    const height = config.visualHeight;
                    const radius = config.borderRadius;

                    if (selectedFormat === 'biz2' || selectedFormat === 'biz1') {
                        ctx.save();

                        // 둥근 모서리 그리기 (ctx.arcTo 사용)
                        ctx.beginPath();
                        ctx.moveTo(x + radius, y);
                        ctx.arcTo(x + width, y, x + width, y + height, radius);
                        ctx.arcTo(x + width, y + height, x, y + height, radius);
                        ctx.arcTo(x, y + height, x, y, radius);
                        ctx.arcTo(x, y, x + width, y, radius);
                        ctx.closePath();
                        ctx.clip();

                        // 비율 유지 크롭
                        const ratio = Math.max(width / img.width, height / img.height);
                        const cropWidth = img.width * ratio;
                        const cropHeight = img.height * ratio;
                        const offsetX = (width - cropWidth) / 2;
                        const offsetY = (height - cropHeight) / 2;

                        ctx.drawImage(img, x + offsetX, y + offsetY, cropWidth, cropHeight);
                        ctx.restore();
                    } else {
                        // 둥근 모서리 적용 안 함
                        // 비율 유지 크롭
                        const ratio = Math.max(width / img.width, height / img.height);
                        const cropWidth = img.width * ratio;
                        const cropHeight = img.height * ratio;
                        const offsetX = (width - cropWidth) / 2;
                        const offsetY = (height - cropHeight) / 2;

                        ctx.drawImage(img, x + offsetX, y + offsetY, cropWidth, cropHeight);
                    }

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
                borderRadius: 5
            };
        } else if (format === 'biz1') {
            return {
                canvasWidth: 1029,
                canvasHeight: 258,
                visualX: 260,
                visualY: 48,
                visualWidth: 163,
                visualHeight: 163,
                borderRadius: 5
            };
        } else if (format === 'mo2') {
            return {
                canvasWidth: 1200,
                canvasHeight: 600,
                visualX: 0,
                visualY: 103,
                visualWidth: 1200,
                visualHeight: 497,
                borderRadius: 0
            };
        }
    }
});
