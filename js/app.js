/**
 * 主应用逻辑
 */
(function() {
    'use strict';

    // 状态管理
    const state = {
        currentStep: 'sign',
        signatureImage: null,
        signatureSize: { width: 300, height: 120 },
        documentImage: null,
        signaturePosition: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        }
    };

    // 模块实例
    let signaturePad = null;
    let documentUpload = null;
    let exporter = null;

    // DOM 元素
    const steps = ['sign', 'upload', 'place', 'export'];
    const stepElements = {};

    // 初始化
    function init() {
        // 缓存 DOM 元素
        steps.forEach(step => {
            stepElements[step] = document.getElementById('step-' + step);
        });

        // 初始化签名画布
        const canvas = document.getElementById('signatureCanvas');
        if (canvas) {
            signaturePad = new SignaturePad();
            signaturePad.init(canvas);
        }

        // 初始化上传
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            documentUpload = new DocumentUpload();
            documentUpload.init(uploadArea);
        }

        // 初始化导出器
        exporter = new Exporter();
        exporter.init('documentCanvas', 'exportCanvas');

        // 绑定事件
        bindEvents();

        // 更新UI
        updateStepUI();
    }

    function bindEvents() {
        // 颜色选择
        document.getElementById('colorBlack')?.addEventListener('click', () => {
            if (signaturePad) {
                signaturePad.setColor('#1a1a1a');
                document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById('colorBlack')?.classList.add('active');
            }
        });

        document.getElementById('colorBlue')?.addEventListener('click', () => {
            if (signaturePad) {
                signaturePad.setColor('#2563eb');
                document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById('colorBlue')?.classList.add('active');
            }
        });

        // 清除签名
        document.getElementById('clearBtn')?.addEventListener('click', () => {
            if (signaturePad) {
                signaturePad.clear();
            }
        });

        // 签名粗细调节
        document.getElementById('thicknessSlider')?.addEventListener('input', (e) => {
            const thickness = parseFloat(e.target.value);
            if (signaturePad) {
                signaturePad.setThickness(thickness);
            }
        });

        // 确认签名
        document.getElementById('confirmSignBtn')?.addEventListener('click', () => {
            if (signaturePad && !signaturePad.isEmpty()) {
                state.signatureImage = signaturePad.getImage();
                signaturePad.saveSignature();
                goToStep('upload');
            }
        });

        // 确认上传
        document.getElementById('confirmUploadBtn')?.addEventListener('click', async () => {
            if (documentUpload && documentUpload.getImage()) {
                state.documentImage = documentUpload.getImage();
                goToStep('place');
                // 等待页面渲染完成后再初始化
                await new Promise(r => setTimeout(r, 100));
                await initPlacement();
            }
        });

        // 更换图片
        document.getElementById('changeImageBtn')?.addEventListener('click', () => {
            documentUpload.reset();
        });

        // 选择图片按钮 - 触发文件输入
        document.getElementById('selectImageBtn')?.addEventListener('click', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            }
        });

        // 重置位置
        document.getElementById('resetPositionBtn')?.addEventListener('click', () => {
            resetSignaturePosition();
        });

        // 确认位置
        document.getElementById('confirmPlaceBtn')?.addEventListener('click', () => {
            goToStep('export');
            setTimeout(() => {
                renderExport();
            }, 100);
        });

        // 缩放滑块
        document.getElementById('scaleSlider')?.addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            state.signaturePosition.scale = scale;
            exporter.setSignaturePosition(
                state.signaturePosition.x,
                state.signaturePosition.y,
                state.signaturePosition.scale,
                state.signaturePosition.rotation
            );
            updateSignatureOverlay();
            const valueEl = document.getElementById('scaleValue');
            if (valueEl) {
                valueEl.textContent = Math.round(scale * 100) + '%';
            }
        });

        // 下载
        document.getElementById('downloadBtn')?.addEventListener('click', () => {
            if (exporter) {
                exporter.download('signed_contract_' + Date.now() + '.png');
            }
        });

        // 分享
        document.getElementById('shareBtn')?.addEventListener('click', async () => {
            if (exporter && navigator.share) {
                try {
                    const blob = await dataURLtoBlob(exporter.getImageData());
                    const file = new File([blob], 'signed_contract.png', { type: 'image/png' });
                    await navigator.share({
                        files: [file],
                        title: '已签署的合同'
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        alert('分享失败，请尝试下载图片');
                    }
                }
            } else {
                alert('您的设备不支持分享功能，请尝试下载图片');
            }
        });

        // 重新开始
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            restart();
        });

        // 签名画布触摸监听 - 更新确认按钮状态
        const canvas = document.getElementById('signatureCanvas');
        if (canvas) {
            canvas.addEventListener('touchstart', updateConfirmButtonState);
            canvas.addEventListener('touchmove', updateConfirmButtonState);
            canvas.addEventListener('mousedown', updateConfirmButtonState);
            canvas.addEventListener('mousemove', updateConfirmButtonState);
        }

        // PWA 安装提示
        let deferredPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showInstallBanner();
        });

        document.getElementById('installBtn')?.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    hideInstallBanner();
                }
                deferredPrompt = null;
            }
        });

        window.addEventListener('appinstalled', () => {
            hideInstallBanner();
            deferredPrompt = null;
        });
    }

    function updateConfirmButtonState() {
        const btn = document.getElementById('confirmSignBtn');
        if (btn && signaturePad) {
            btn.disabled = signaturePad.isEmpty();
        }
    }

    function showInstallBanner() {
        const banner = document.getElementById('installBanner');
        if (banner && !localStorage.getItem('installDismissed')) {
            banner.style.display = 'block';
        }
    }

    function hideInstallBanner() {
        const banner = document.getElementById('installBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    async function initPlacement() {
        if (!state.documentImage || !state.signatureImage) {
            console.warn('缺少图片数据', { document: !!state.documentImage, signature: !!state.signatureImage });
            return;
        }

        try {
            // 设置文档图片
            await exporter.setDocumentImage(state.documentImage);

            // 设置签名图片并获取实际尺寸
            await exporter.setSignatureImage(state.signatureImage);
            
            // 获取签名图片实际尺寸
            const sigImg = new Image();
            await new Promise((resolve, reject) => {
                sigImg.onload = resolve;
                sigImg.onerror = reject;
                sigImg.src = state.signatureImage;
            });
            state.signatureSize = { width: sigImg.width, height: sigImg.height };

            // 显示签名预览
            const signaturePreview = document.getElementById('signaturePreview');
            if (signaturePreview) {
                signaturePreview.src = state.signatureImage;
            }

            // 计算默认位置（文档底部中央）
            const container = document.getElementById('placeContainer');
            if (!container) return;
            const containerRect = container.getBoundingClientRect();

            // 以宽度 200px 为基准，高度按比例
            const baseWidth = 200;
            const ratio = state.signatureSize.height / state.signatureSize.width;
            const defaultScale = 1.0;
            const overlayWidth = baseWidth * defaultScale;
            const overlayHeight = baseWidth * ratio * defaultScale;

            state.signaturePosition = {
                x: containerRect.width / 2 - overlayWidth / 2,
                y: containerRect.height - overlayHeight - 40,
                scale: defaultScale,
                rotation: 0
            };

            // 更新滑块
            const slider = document.getElementById('scaleSlider');
            const scaleValue = document.getElementById('scaleValue');
            if (slider) slider.value = defaultScale;
            if (scaleValue) scaleValue.textContent = Math.round(defaultScale * 100) + '%';

            // 设置位置
            exporter.setSignaturePosition(
                state.signaturePosition.x,
                state.signaturePosition.y,
                state.signaturePosition.scale,
                state.signaturePosition.rotation
            );

            // 更新签名覆盖层位置
            updateSignatureOverlay();

            // 绑定拖拽事件
            bindDragEvents();
        } catch (err) {
            console.error('初始化位置失败:', err);
        }
    }

    function updateSignatureOverlay() {
        const overlay = document.getElementById('signatureOverlay');
        if (!overlay) return;

        const baseWidth = 200;
        const ratio = state.signatureSize.height / state.signatureSize.width;
        overlay.style.left = state.signaturePosition.x + 'px';
        overlay.style.top = state.signaturePosition.y + 'px';
        overlay.style.transformOrigin = 'top left';
        overlay.style.transform = `scale(${state.signaturePosition.scale}) rotate(${state.signaturePosition.rotation}deg)`;
        overlay.style.width = baseWidth + 'px';
        overlay.style.height = (baseWidth * ratio) + 'px';
    }

    function resetSignaturePosition() {
        const container = document.getElementById('placeContainer');
        const containerRect = container.getBoundingClientRect();

        const baseWidth = 200;
        const ratio = state.signatureSize.height / state.signatureSize.width;
        const defaultScale = 1.0;
        const overlayWidth = baseWidth * defaultScale;
        const overlayHeight = baseWidth * ratio * defaultScale;

        state.signaturePosition = {
            x: containerRect.width / 2 - overlayWidth / 2,
            y: containerRect.height - overlayHeight - 40,
            scale: defaultScale,
            rotation: 0
        };

        exporter.setSignaturePosition(
            state.signaturePosition.x,
            state.signaturePosition.y,
            state.signaturePosition.scale,
            state.signaturePosition.rotation
        );

        // 更新滑块
        const slider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');
        if (slider) slider.value = defaultScale;
        if (scaleValue) scaleValue.textContent = Math.round(defaultScale * 100) + '%';

        updateSignatureOverlay();
    }

    function bindDragEvents() {
        const overlay = document.getElementById('signatureOverlay');
        const container = document.getElementById('placeContainer');
        if (!overlay || !container) return;

        let isDragging = false;
        let isResizing = false;
        let startX, startY, startPosX, startPosY, startScale;

        // 单指拖拽
        overlay.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                startScale = state.signaturePosition.scale;
            } else {
                isDragging = true;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                startPosX = state.signaturePosition.x;
                startPosY = state.signaturePosition.y;
            }
            e.preventDefault();
        }, { passive: false });

        overlay.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            if (isDragging) {
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                
                // 计算签名当前尺寸
                const baseWidth = 200;
                const ratio = state.signatureSize.height / state.signatureSize.width;
                const sigWidth = baseWidth * state.signaturePosition.scale;
                const sigHeight = baseWidth * ratio * state.signaturePosition.scale;
                
                // 计算容器尺寸
                const containerRect = container.getBoundingClientRect();
                
                // 计算新位置
                let newX = startPosX + dx;
                let newY = startPosY + dy;
                
                // 边界限制：签名不能完全拖出容器
                // 左边限制
                if (newX < -sigWidth + 20) newX = -sigWidth + 20;
                // 右边限制
                if (newX > containerRect.width - 20) newX = containerRect.width - 20;
                // 上边限制
                if (newY < -sigHeight + 20) newY = -sigHeight + 20;
                // 下边限制
                if (newY > containerRect.height - 20) newY = containerRect.height - 20;
                
                state.signaturePosition.x = newX;
                state.signaturePosition.y = newY;
                exporter.setSignaturePosition(
                    state.signaturePosition.x,
                    state.signaturePosition.y,
                    state.signaturePosition.scale,
                    state.signaturePosition.rotation
                );
                updateSignatureOverlay();
            } else if (isResizing) {
                const dy = startY - touch.clientY;
                const scaleChange = dy / 100;
                state.signaturePosition.scale = Math.max(0.5, Math.min(3, startScale + scaleChange));
                exporter.setSignaturePosition(
                    state.signaturePosition.x,
                    state.signaturePosition.y,
                    state.signaturePosition.scale,
                    state.signaturePosition.rotation
                );
                updateSignatureOverlay();
            }
            e.preventDefault();
        }, { passive: false });

        overlay.addEventListener('touchend', () => {
            isDragging = false;
            isResizing = false;
        });

        // 双指缩放
        let initialDistance = 0;
        let initialScale = 1;

        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches[0], e.touches[1]);
                initialScale = state.signaturePosition.scale;
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const currentDistance = getDistance(e.touches[0], e.touches[1]);
                const scale = (currentDistance / initialDistance) * initialScale;
                state.signaturePosition.scale = Math.max(0.5, Math.min(3, scale));
                exporter.setSignaturePosition(
                    state.signaturePosition.x,
                    state.signaturePosition.y,
                    state.signaturePosition.scale,
                    state.signaturePosition.rotation
                );
                updateSignatureOverlay();
            }
        }, { passive: true });

        function getDistance(touch1, touch2) {
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        // 鼠标支持（用于测试）
        let isMouseDragging = false;
        let mouseStartX, mouseStartY, mouseStartPosX, mouseStartPosY;

        overlay.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                mouseStartY = e.clientY;
                startScale = state.signaturePosition.scale;
            } else {
                isMouseDragging = true;
                mouseStartX = e.clientX;
                mouseStartY = e.clientY;
                mouseStartPosX = state.signaturePosition.x;
                mouseStartPosY = state.signaturePosition.y;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isMouseDragging) {
                const dx = e.clientX - mouseStartX;
                const dy = e.clientY - mouseStartY;
                
                // 计算签名当前尺寸
                const baseWidth = 200;
                const ratio = state.signatureSize.height / state.signatureSize.width;
                const sigWidth = baseWidth * state.signaturePosition.scale;
                const sigHeight = baseWidth * ratio * state.signaturePosition.scale;
                
                // 计算容器尺寸
                const containerRect = container.getBoundingClientRect();
                
                // 计算新位置
                let newX = mouseStartPosX + dx;
                let newY = mouseStartPosY + dy;
                
                // 边界限制：签名不能完全拖出容器
                // 左边限制
                if (newX < -sigWidth + 20) newX = -sigWidth + 20;
                // 右边限制
                if (newX > containerRect.width - 20) newX = containerRect.width - 20;
                // 上边限制
                if (newY < -sigHeight + 20) newY = -sigHeight + 20;
                // 下边限制
                if (newY > containerRect.height - 20) newY = containerRect.height - 20;
                
                state.signaturePosition.x = newX;
                state.signaturePosition.y = newY;
                exporter.setSignaturePosition(
                    state.signaturePosition.x,
                    state.signaturePosition.y,
                    state.signaturePosition.scale,
                    state.signaturePosition.rotation
                );
                updateSignatureOverlay();
            } else if (isResizing) {
                const dy = mouseStartY - e.clientY;
                const scaleChange = dy / 100;
                state.signaturePosition.scale = Math.max(0.5, Math.min(3, startScale + scaleChange));
                exporter.setSignaturePosition(
                    state.signaturePosition.x,
                    state.signaturePosition.y,
                    state.signaturePosition.scale,
                    state.signaturePosition.rotation
                );
                updateSignatureOverlay();
            }
        });

        document.addEventListener('mouseup', () => {
            isMouseDragging = false;
            isResizing = false;
        });
    }

    function renderExport() {
        if (exporter) {
            exporter.renderExportPreview();
        }
    }

    function goToStep(stepName) {
        state.currentStep = stepName;
        updateStepUI();
    }

    function updateStepUI() {
        // 更新步骤指示器
        const stepIndex = steps.indexOf(state.currentStep);
        document.querySelectorAll('.step').forEach((el, i) => {
            const stepName = el.dataset.step;
            const stepIdx = steps.indexOf(stepName);
            el.classList.remove('active', 'completed');
            if (stepIdx < stepIndex) {
                el.classList.add('completed');
            } else if (stepName === state.currentStep) {
                el.classList.add('active');
            }
        });

        // 显示当前步骤
        steps.forEach(step => {
            const el = stepElements[step];
            if (el) {
                el.classList.remove('active');
                if (step === state.currentStep) {
                    el.classList.add('active');
                }
            }
        });
    }

    function restart() {
        // 重置状态
        state.signatureImage = null;
        state.documentImage = null;
        state.signaturePosition = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        };

        // 重置上传
        if (documentUpload) {
            documentUpload.reset();
        }

        // 清除签名
        if (signaturePad) {
            signaturePad.clear();
            signaturePad.loadSignature();
        }

        // 返回第一步
        goToStep('sign');
    }

    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
