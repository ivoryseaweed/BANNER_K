let format = '';
let exampleImg = null;
let visualFiles = [];

function selectFormat(fmt) {
    format = fmt;
    document.getElementById('downloadBtn').disabled = true;
    alert(`선택 포맷: ${fmt}`);
}

document.getElementById('exampleImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => exampleImg = reader.result;
        reader.readAsDataURL(file);
    }
});

document.getElementById('visualImages').addEventListener('change', (e) => {
    visualFiles = Array.from(e.target.files);
    if (format && exampleImg && visualFiles.length > 0) {
        processImages();
    } else {
        alert("포맷 선택, 예시 배너, 합성 비주얼을 모두 업로드하세요.");
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    window.location.reload();
});

function processImages() {
    const zip = new JSZip();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    visualFiles.forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
            const {cw, ch, vx, vy, vw, vh, round, outputFormat, maxSize} = getFormatValues(format);

            canvas.width = cw;
            canvas.height = ch;

            const example = new Image();
            example.onload = () => {
                ctx.clearRect(0, 0, cw, ch);
                ctx.drawImage(example, 0, 0, cw, ch);

                ctx.save();
                if (round) {
                    ctx.beginPath();
                    ctx.roundRect(vx, vy, vw, vh, 10);
                    ctx.clip();
                }
                const ratio = Math.min(vw / img.width, vh / img.height);
                const iw = img.width * ratio;
                const ih = img.height * ratio;
                const ix = vx + (vw - iw) / 2;
                const iy = vy + (vh - ih) / 2;
                ctx.drawImage(img, ix, iy, iw, ih);
                ctx.restore();

                canvas.toBlob(blob => {
                    if (blob.size <= maxSize) {
                        zip.file(`banner_${index + 1}.${outputFormat === 'png' ? 'png' : 'jpg'}`, blob);
                    }
                    if (index === visualFiles.length - 1) {
                        zip.generateAsync({type: "blob"}).then(content => {
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(content);
                            link.download = "banners.zip";
                            link.click();
                        });
                        document.getElementById('downloadBtn').disabled = false;
                    }
                }, outputFormat === 'png' ? 'image/png' : 'image/jpeg');
            };
            example.src = exampleImg;
        };
        const reader = new FileReader();
        reader.onload = () => img.src = reader.result;
        reader.readAsDataURL(file);
    });
}

function getFormatValues(fmt) {
    if (fmt === 'biz2') {
        return { cw: 1029, ch: 258, vx: 48, vy: 36, vw: 315, vh: 186, round: true, outputFormat: 'png', maxSize: 300000 };
    } else if (fmt === 'biz1') {
        return { cw: 1029, ch: 258, vx: 260, vy: 36, vw: 186, vh: 186, round: true, outputFormat: 'png', maxSize: 300000 };
    } else if (fmt === 'mo2') {
        return { cw: 1200, ch: 600, vx: 0, vy: 193, vw: 1200, vh: 497, round: false, outputFormat: 'jpeg', maxSize: 500000 };
    }
}
