document.addEventListener('DOMContentLoaded', () => {
    let selectedFormat = null;
    let exampleImage = null;
    let visualImages = [];

    const exampleImageInput = document.getElementById('exampleImage');
    const visualImagesInput = document.getElementById('visualImages');
    const downloadBtn = document.getElementById('downloadBtn');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    function updateDownloadButtonState() {
        const isReady = selectedFormat && exampleImage && visualImages.length > 0;
        downloadBtn.disabled = !isReady;
        console.log('Download button state:', isReady); // 디버깅
    }

    exampleImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                exampleImage = img;
                updateDownloadButtonState();
            };
            img.onerror = () => {
                alert('예시 이미지 로딩 실패!');
                exampleImage = null;
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
        if (!selectedFormat || !exampleImage || visualImages.length === 0) {
            alert('이미지, 비주얼, 포맷을 모두 선택해주세요.');
            return;
        }

        const zip = new JSZip();
        const config = getFormatConfig(selectedFormat);

        canvas.width = config.canvasWidth;
        canvas.height = config.canvasHeight;

        Promise.all(visualImages.map(file => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
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
                        ctx.beginPath();
                        ctx.moveTo(x + radius, y);
                        ctx.arcTo(x + width, y, x + width, y + height, radius);
                        ctx.arcTo(x + width, y + height, x, y + height, radius);
                        ctx.arcTo(x, y + height, x, y, radius);
                        ctx.arcTo(x, y, x + width, y, radius);
                        ctx.closePath();
                        ctx.clip();

                        const ratio = Math.max(width / img.width, height / img.height);
                        const cropWidth = img.width * ratio;
                        const cropHeight = img.height * ratio;
                        const offsetX = (width - cropWidth) / 2;
                        const offsetY = (height - cropHeight) / 2;

                        ctx.drawImage(img, x + offsetX, y + offsetY, cropWidth, cropHeight);
                        ctx.restore();
                    } else {
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
                    }, selectedFormat === 'mo2' ? 'image/jpeg' : 'image/png', 0.8); // JPEG 품질 설정
                };
                img.onerror = () => {
                    reject(new Error(`비주얼 이미지 ${file.name} 로딩 실패!`));
                };
                img.src = URL.createObjectURL(file);
            });
        })).then(() => {
            console.log('ZIP 파일 생성 시작...'); // 디버깅
            zip.generateAsync({ type: 'blob' })
            .then(content => {
                console.log('ZIP 파일 생성 완료:', content); // 디버깅
                saveAs(content, 'banners.zip');
            })
            .catch(error => {
                console.error('ZIP 파일 생성 실패:', error); // 디버깅
                alert('ZIP 파일 생성 실패!');
            });
        })
        .catch(error => {
            console.error('이미지 처리 중 오류 발생:', error); // 디버깅
            alert(error.message);
        });
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        location.reload();
    });

    function getFormatConfig(format) {
         // 둥근 모서리 값 조정 (biz2, biz1)
        const borderRadius = 7;

        if (format === 'biz2') {
            return {
                canvasWidth: 1029,
                canvasHeight: 258,
                visualX: 48,
                visualY: 36,
                visualWidth: 315,
                visualHeight: 186,
                borderRadius: borderRadius
            };
        } else if (format === 'biz1') {
            return {
                canvasWidth: 1029,
                canvasHeight: 258,
                visualX: 260,
                visualY: 48,
                visualWidth: 163, // 1:1
                visualHeight: 163,
                borderRadius: borderRadius
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
