(() => {
  "use strict";

  const studioLayouts = {
    "bg-1.png": { width: 1448, floor: 907 / 1086, center: 0.5, maxWidth: 0.8, maxHeight: 734 / 1086 },
    "bg-2.jpg": { width: 1920, floor: 340 / 360, center: 284 / 640, maxWidth: 1370 / 1448, maxHeight: 240 / 360 },
  };
  const stage = document.getElementById("slabCanvas");
  const els = {
    imageInput: document.getElementById("imageInput"),
    dropZone: document.getElementById("dropZone"),
    uploadMark: document.getElementById("uploadMark"),
    uploadThumb: document.getElementById("uploadThumb"),
    fileName: document.getElementById("fileName"),
    uploadHint: document.getElementById("uploadHint"),
    uploadAction: document.getElementById("uploadAction"),
    width: document.getElementById("widthInput"),
    height: document.getElementById("heightInput"),
    ratio: document.getElementById("ratioText"),
    ratioType: document.getElementById("ratioType"),
    ratioNotice: document.getElementById("ratioNotice"),
    ratioNoticeText: document.getElementById("ratioNoticeText"),
    sizeHelp: document.getElementById("sizeHelp"),
    shine: document.getElementById("shineInput"),
    shineValue: document.getElementById("shineValue"),
    position: document.getElementById("positionInput"),
    positionStart: document.getElementById("positionStart"),
    positionEnd: document.getElementById("positionEnd"),
    cropPosition: document.getElementById("cropPosition"),
    centerCrop: document.getElementById("centerCropBtn"),
    previewName: document.getElementById("previewName"),
    previewDimensions: document.getElementById("previewDimensions"),
    previewFinish: document.getElementById("previewFinish"),
    previewAspect: document.getElementById("previewAspect"),
    exportHint: document.getElementById("exportHint"),
    loading: document.getElementById("canvasLoading"),
    empty: document.getElementById("emptyState"),
    error: document.getElementById("errorState"),
    errorText: document.getElementById("errorText"),
    remove: document.getElementById("removeBtn"),
    shadow: document.getElementById("shadowInput"),
    outline: document.getElementById("outlineInput"),
    brandLink: document.getElementById("brandLink"),
    uploadView: document.getElementById("uploadView"),
    cropView: document.getElementById("cropView"),
    cropStageContainer: document.getElementById("cropStageContainer"),
    cropStage: document.getElementById("cropStage"),
    cropCanvas: document.getElementById("cropCanvas"),
    cropBox: document.getElementById("cropBox"),
    cropDimensionsBadge: document.getElementById("cropDimensionsBadge"),
    cropRotateBtn: document.getElementById("cropRotateBtn"),
    cropResetBtn: document.getElementById("cropResetBtn"),
    cropChangePhotoBtn: document.getElementById("cropChangePhotoBtn"),
    cropSkewToggleBtn: document.getElementById("cropSkewToggleBtn"),
    cropSkewToggleText: document.getElementById("cropSkewToggleText"),
    cropHelp: document.getElementById("cropHelp"),
    skewOverlay: document.getElementById("skewOverlay"),
    skewSvg: document.getElementById("skewSvg"),
    skewMaskPath: document.getElementById("skewMaskPath"),
    skewGridH1: document.getElementById("skewGridH1"),
    skewGridH2: document.getElementById("skewGridH2"),
    skewGridV1: document.getElementById("skewGridV1"),
    skewGridV2: document.getElementById("skewGridV2"),
    skewPolygon: document.getElementById("skewPolygon"),
    skewHandleTL: document.getElementById("skewHandleTL"),
    skewHandleTR: document.getElementById("skewHandleTR"),
    skewHandleBR: document.getElementById("skewHandleBR"),
    skewHandleBL: document.getElementById("skewHandleBL"),
    skewDimensionsBadge: document.getElementById("skewDimensionsBadge"),
    skipCropBtn: document.getElementById("skipCropBtn"),
    applyCropBtn: document.getElementById("applyCropBtn"),
    recropBtn: document.getElementById("recropBtn"),
    editorView: document.getElementById("editorView"),
    createAgainBtn: document.getElementById("createAgainBtn"),
    editorFileName: document.getElementById("editorFileName"),
    editorFileMeta: document.getElementById("editorFileMeta"),
    resolution: document.getElementById("resolutionInput"),
    background: document.getElementById("studioBackground"),
    download: document.getElementById("downloadBtn"),
    toast: document.getElementById("toast"),
  };

  const state = {
    width: null,
    height: null,
    name: "Belum ada foto",
    fileName: "",
    rawImage: null,
    cropRotation: 0,
    cropBox: { x: 0.04, y: 0.04, w: 0.92, h: 0.92 },
    cropMode: "standard", // "standard" or "skew"
    skewPoints: {
      tl: { x: 0.04, y: 0.04 },
      tr: { x: 0.96, y: 0.04 },
      br: { x: 0.96, y: 0.96 },
      bl: { x: 0.04, y: 0.96 },
    },
    finish: "glossy",
    shine: 70,
    mode: "cover",
    position: 0,
    shadow: true,
    outline: false,
    image: null,
    source: null,
    studio: null,
    background: "bg-1.png",
    backgroundSequence: 0,
    exporting: false,
    userPhotoUrl: null,
    status: "loading",
    pendingRender: false,
    loadSequence: 0,
  };

  const formatCm = (value) =>
    Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
  let toastTimeout = null;

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(
      () => els.toast.classList.remove("visible"),
      4000,
    );
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
      img.src = src;
    });
  }

  function imageRatio() {
    return state.source.w / state.source.h;
  }

  function slabRatio() {
    return hasDimensions()
      ? state.width / state.height
      : state.image
        ? imageRatio()
        : 1;
  }

  function hasDimensions() {
    return Number.isFinite(state.width) && Number.isFinite(state.height);
  }

  function imageCrop() {
    const original = state.source;
    const target = slabRatio();
    const available = { ...original };
    if (state.mode === "contain") return available;
    const inputRatio = imageRatio();
    const normalizedPosition = (state.position + 100) / 200;
    if (inputRatio > target) {
      available.w = original.h * target;
      available.x =
        original.x + (original.w - available.w) * normalizedPosition;
    } else if (inputRatio < target) {
      available.h = original.w / target;
      available.y =
        original.y + (original.h - available.h) * normalizedPosition;
    }
    return available;
  }

  function slabGeometry() {
    const frame = frameSize();
    const layout = studioLayouts[state.background];
    const maxW = frame.width * layout.maxWidth;
    const maxH = frame.height * layout.maxHeight;
    const ratio = slabRatio();
    let width = maxW;
    let height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }
    const margin = (frame.width - maxW) / 2;
    const x = Math.max(margin, Math.min(frame.width * layout.center - width / 2, frame.width - margin - width));
    return { x, y: frame.height * layout.floor - height, w: width, h: height };
  }

  function roundedRect(ctx, x, y, w, h, r = 4) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  let showroomReflection = null;

  function prepareReflection(image) {
    const map = document.createElement("canvas");
    map.width = image.naturalWidth;
    map.height = image.naturalHeight;
    const ctx = map.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const fade = ctx.createLinearGradient(0, 0, map.width * 0.86, map.height * 0.32);
    fade.addColorStop(0, "white");
    fade.addColorStop(0.45, "rgba(255,255,255,0.85)");
    fade.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, map.width, map.height);
    return map;
  }

  function drawLight(ctx, slab) {
    if (!showroomReflection || state.finish === "honed" || state.shine === 0) return;
    const glossy = state.finish === "glossy";
    const scale = Math.max(slab.w / showroomReflection.width, slab.h / showroomReflection.height);
    const w = showroomReflection.width * scale;
    const h = showroomReflection.height * scale;
    const x = slab.x - (w - slab.w) * 0.12;
    const y = slab.y - (h - slab.h) * 0.06;
    const strength = state.shine / 100;

    ctx.save();
    // Canvas filters use output pixels, including during high-resolution export.
    const shortSide = Math.min(slab.w, slab.h) * ctx.getTransform().a;
    ctx.filter = `blur(${shortSide * (glossy ? 0.0025 : 0.006)}px)`;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = strength * (glossy ? 0.44 : 0.29);
    ctx.drawImage(showroomReflection, x, y, w, h);
    ctx.restore();
  }

  function paintSlab(scene, bounds) {
    const scale = scene.getTransform().a;
    const layer = document.createElement("canvas");
    layer.width = Math.ceil(bounds.w * scale);
    layer.height = Math.ceil(bounds.h * scale);
    const ctx = layer.getContext("2d");
    ctx.scale(layer.width / bounds.w, layer.height / bounds.h);
    const s = { x: 0, y: 0, w: bounds.w, h: bounds.h };
    const src = imageCrop();
    let w = s.w;
    let h = s.h;
    if (state.mode === "contain") {
      const fit = Math.min(w / src.w, h / src.h);
      w = src.w * fit;
      h = src.h * fit;
    }
    const x = (s.w - w) / 2;
    const y = (s.h - h) / 2;
    const photo = [state.image, src.x, src.y, src.w, src.h, x, y, w, h];
    ctx.save();
    roundedRect(ctx, 0, 0, s.w, s.h, 4);
    ctx.clip();
    if (state.mode === "contain") {
      ctx.beginPath();
      ctx.rect(0, 0, s.w, s.h);
      ctx.rect(x, y, w, h);
      ctx.fillStyle = "#d6dad1";
      ctx.fill("evenodd");
    }
    ctx.drawImage(...photo);
    drawLight(ctx, s);

    // Garis bevel fisik di dalam slab (hanya jika outline aktif)
    if (state.outline) {
      ctx.strokeStyle = "rgba(255,255,255,.50)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + 5, s.y + 1.5);
      ctx.lineTo(s.x + s.w - 5, s.y + 1.5);
      ctx.stroke();
      const bottomEdge = ctx.createLinearGradient(0, s.y + s.h - 6, 0, s.y + s.h);
      bottomEdge.addColorStop(0, "rgba(13,24,16,0)");
      bottomEdge.addColorStop(1, "rgba(13,24,16,.20)");
      ctx.fillStyle = bottomEdge;
      ctx.fillRect(s.x, s.y + s.h - 6, s.w, 6);
    }
    ctx.restore();

    // Garis tepi luar persegi (hanya jika outline aktif)
    if (state.outline) {
      ctx.strokeStyle = "rgba(21,26,19,.21)";
      ctx.lineWidth = 1.5;
      roundedRect(ctx, s.x, s.y, s.w, s.h, 4);
      ctx.stroke();
    }

    // Mask surface effects with the photo silhouette before compositing onto the studio.
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.globalCompositeOperation = "destination-atop";
    ctx.drawImage(...photo);
    ctx.restore();

    if (state.shadow) {
      const strip = Math.min(layer.height, Math.max(1, Math.round(2 * scale)));
      scene.save();
      scene.filter = `brightness(0) blur(${3 * scale}px)`;
      scene.globalAlpha = 0.25;
      scene.drawImage(layer, 0, layer.height - strip, layer.width, strip,
        bounds.x, bounds.y + bounds.h - 1, bounds.w, 5);
      scene.restore();
    }
    scene.drawImage(layer, bounds.x, bounds.y, bounds.w, bounds.h);
  }

  function frameSize() {
    const width = studioLayouts[state.background].width;
    const height = Math.round(width * state.studio.naturalHeight / state.studio.naturalWidth);
    return { width, height };
  }

  async function selectBackground(file) {
    const sequence = ++state.backgroundSequence;
    els.background.value = file;
    syncDownloadButton();
    try {
      const image = await loadImage("./assets/" + file);
      if (sequence !== state.backgroundSequence) return;
      state.studio = image;
      state.background = file;
      const { width, height } = frameSize();
      stage.parentElement.style.aspectRatio = `${width} / ${height}`;
      for (const option of els.resolution.options) {
        option.textContent = `${width * option.value} × ${height * option.value} px`;
      }
      if (state.status === "loading" && !state.rawImage && !els.uploadView.hidden) showVisualState("empty");
      requestRender();
    } catch {
      if (sequence !== state.backgroundSequence) return;
      els.background.value = state.background;
      if (!state.studio) showVisualState("error", "Latar studio gagal dimuat.");
      toast(`Latar ${file} gagal dimuat.`);
    } finally {
      syncDownloadButton();
    }
  }

  function drawFrame(canvas, multiplier = 1) {
    const { width: W, height: H } = frameSize();
    canvas.width = Math.round(W * multiplier);
    canvas.height = Math.round(H * multiplier);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Browser tidak mendukung rendering Canvas 2D.");
    ctx.setTransform(multiplier, 0, 0, multiplier, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(state.studio, 0, 0, W, H);
    if (state.image) paintSlab(ctx, slabGeometry());
  }

  function requestRender() {
    if (state.pendingRender || !state.studio) return;
    state.pendingRender = true;
    requestAnimationFrame(() => {
      state.pendingRender = false;
      try {
        drawFrame(stage);
      } catch (error) {
        console.error(error);
        showVisualState(
          "error",
          "Browser tidak dapat menggambar foto ini. Pilih foto lain.",
        );
      }
    });
  }

  function syncDownloadButton() {
    els.download.disabled = state.exporting || state.status !== "ready" ||
      !state.studio || els.background.value !== state.background;
  }

  function showVisualState(status, message = "") {
    state.status = status;
    if (els.loading) els.loading.hidden = status !== "loading";
    if (els.empty) els.empty.hidden = status !== "empty";
    if (els.error) els.error.hidden = status !== "error";
    if (message && els.errorText) els.errorText.textContent = message;
    syncDownloadButton();
    if (els.remove) els.remove.hidden = !state.image || status === "loading";
    if (els.exportHint) {
      els.exportHint.textContent =
        status === "ready"
          ? "PNG sesuai komposisi pratinjau."
          : "Unggah foto slab untuk mengunduh PNG.";
    }
  }

  function updateStatus() {
    const ratio = slabRatio();
    els.ratio.textContent = hasDimensions()
      ? `${ratio.toFixed(3)} : 1`
      : "Belum diisi";
    els.ratioType.textContent = hasDimensions()
      ? ratio > 1.01
        ? "Landscape"
        : ratio < 0.99
          ? "Portrait"
          : "Square"
      : "";
    els.previewDimensions.textContent = hasDimensions()
      ? `${formatCm(state.width)} × ${formatCm(state.height)} cm`
      : "Ukuran belum diisi";
    els.previewFinish.textContent = `${state.finish.toUpperCase()} FINISH`;
    els.previewAspect.textContent = state.image
      ? `${hasDimensions() ? "Rasio slab" : "Rasio foto"} ${ratio.toFixed(3)} : 1`
      : "Rasio foto belum tersedia";
    els.previewName.textContent = state.name.toUpperCase();
    els.shineValue.textContent =
      state.finish === "honed" ? "Tidak berlaku" : `${state.shine}%`;
    els.shine.disabled = state.finish === "honed";

    if (!state.image) {
      els.ratioNotice.hidden = true;
      els.position.disabled = true;
      els.centerCrop.disabled = true;
      els.cropPosition.style.opacity = ".6";
      requestRender();
      return;
    }

    const inputRatio = imageRatio();
    const mismatch = hasDimensions() ? Math.abs(inputRatio / ratio - 1) : 0;

    const cropIsHorizontal = inputRatio > ratio;
    els.positionStart.textContent = cropIsHorizontal ? "Kiri" : "Atas";
    els.positionEnd.textContent = cropIsHorizontal ? "Kanan" : "Bawah";
    els.position.disabled = state.mode === "contain" || mismatch < 0.002;
    els.centerCrop.disabled = els.position.disabled;
    els.cropPosition.style.opacity = els.position.disabled ? ".52" : "1";
    if (hasDimensions() && mismatch > 0.015) {
      els.ratioNotice.hidden = false;
      els.ratioNoticeText.textContent = `Rasio foto (${inputRatio.toFixed(3)}:1) berbeda ${Math.round(mismatch * 100)}% dari ukuran slab. ${state.mode === "cover" ? "Foto akan dipotong pada sisinya, tanpa diregangkan." : "Seluruh foto ditampilkan tanpa stretch, dengan bidang kosong bila perlu."}`;
    } else {
      els.ratioNotice.hidden = true;
    }
    requestRender();
  }

  function setFinish(finish) {
    if (!["glossy", "polished", "honed"].includes(finish)) return;
    state.finish = finish;
    document.querySelectorAll(".finish-card").forEach((button) => {
      const selected = button.dataset.finish === finish;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    updateStatus();
  }

  function setMode(mode) {
    if (!["cover", "contain"].includes(mode)) return;
    state.mode = mode;
    document.querySelectorAll(".crop-option").forEach((button) => {
      const selected = button.dataset.mode === mode;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    updateStatus();
  }

  function setSize(which, rawValue, normalize = false) {
    if (String(rawValue).trim() === "") {
      state[which] = null;
      els[which].classList.remove("is-invalid");
      els[which].removeAttribute("aria-invalid");
      if (!document.querySelector(".form-control.is-invalid")) {
        els.sizeHelp.textContent =
          "Opsional. Isi jika tahu ukuran asli slab. Jika kosong, pratinjau mengikuti rasio foto.";
      }
      updateStatus();
      return;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 10 || parsed > 6000) {
      state[which] = null;
      els[which].classList.add("is-invalid");
      els[which].setAttribute("aria-invalid", "true");
      els.sizeHelp.textContent = "Isi angka antara 10 dan 6000 cm.";
      updateStatus();
      return;
    }
    els[which].classList.remove("is-invalid");
    els[which].removeAttribute("aria-invalid");
    state[which] = parsed;
    if (normalize) els[which].value = formatCm(state[which]);
    if (!document.querySelector(".form-control.is-invalid")) {
      els.sizeHelp.textContent =
        "Opsional. Isi jika tahu ukuran asli slab. Jika kosong, pratinjau mengikuti rasio foto.";
    }
    updateStatus();
  }

  function getRotatedSourceDimensions() {
    if (!state.rawImage) return { w: 1, h: 1 };
    const isPerpendicular = (state.cropRotation % 180) !== 0;
    return {
      w: isPerpendicular ? state.rawImage.naturalHeight : state.rawImage.naturalWidth,
      h: isPerpendicular ? state.rawImage.naturalWidth : state.rawImage.naturalHeight,
    };
  }

  function renderCropCanvas() {
    if (!state.rawImage || !els.cropCanvas) return;
    const isPerpendicular = (state.cropRotation % 180) !== 0;
    const origW = state.rawImage.naturalWidth;
    const origH = state.rawImage.naturalHeight;
    const targetW = isPerpendicular ? origH : origW;
    const targetH = isPerpendicular ? origW : origH;

    els.cropCanvas.width = targetW;
    els.cropCanvas.height = targetH;
    const ctx = els.cropCanvas.getContext("2d");
    ctx.save();
    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((state.cropRotation * Math.PI) / 180);
    ctx.drawImage(state.rawImage, -origW / 2, -origH / 2);
    ctx.restore();

    syncCropBoxStyle();
    syncSkewOverlayStyle();
  }

  function syncCropBoxStyle() {
    if (!els.cropBox || !state.rawImage) return;
    const b = state.cropBox;
    els.cropBox.style.left = `${(b.x * 100).toFixed(2)}%`;
    els.cropBox.style.top = `${(b.y * 100).toFixed(2)}%`;
    els.cropBox.style.width = `${(b.w * 100).toFixed(2)}%`;
    els.cropBox.style.height = `${(b.h * 100).toFixed(2)}%`;

    const dim = getRotatedSourceDimensions();
    const pxW = Math.max(1, Math.round(b.w * dim.w));
    const pxH = Math.max(1, Math.round(b.h * dim.h));
    if (els.cropDimensionsBadge) {
      els.cropDimensionsBadge.textContent = `${pxW} × ${pxH} px`;
    }
  }

  function syncSkewOverlayStyle() {
    if (!els.skewOverlay || !state.rawImage) return;
    const pts = state.skewPoints;
    const to1000 = (v) => (v * 1000).toFixed(1);

    if (els.skewHandleTL) {
      els.skewHandleTL.style.left = `${(pts.tl.x * 100).toFixed(2)}%`;
      els.skewHandleTL.style.top = `${(pts.tl.y * 100).toFixed(2)}%`;
    }
    if (els.skewHandleTR) {
      els.skewHandleTR.style.left = `${(pts.tr.x * 100).toFixed(2)}%`;
      els.skewHandleTR.style.top = `${(pts.tr.y * 100).toFixed(2)}%`;
    }
    if (els.skewHandleBR) {
      els.skewHandleBR.style.left = `${(pts.br.x * 100).toFixed(2)}%`;
      els.skewHandleBR.style.top = `${(pts.br.y * 100).toFixed(2)}%`;
    }
    if (els.skewHandleBL) {
      els.skewHandleBL.style.left = `${(pts.bl.x * 100).toFixed(2)}%`;
      els.skewHandleBL.style.top = `${(pts.bl.y * 100).toFixed(2)}%`;
    }

    if (els.skewPolygon) {
      const pStr = `${to1000(pts.tl.x)},${to1000(pts.tl.y)} ${to1000(pts.tr.x)},${to1000(pts.tr.y)} ${to1000(pts.br.x)},${to1000(pts.br.y)} ${to1000(pts.bl.x)},${to1000(pts.bl.y)}`;
      els.skewPolygon.setAttribute("points", pStr);
    }

    if (els.skewMaskPath) {
      const maskD = `M 0 0 L 1000 0 L 1000 1000 L 0 1000 Z M ${to1000(pts.tl.x)} ${to1000(pts.tl.y)} L ${to1000(pts.tr.x)} ${to1000(pts.tr.y)} L ${to1000(pts.br.x)} ${to1000(pts.br.y)} L ${to1000(pts.bl.x)} ${to1000(pts.bl.y)} Z`;
      els.skewMaskPath.setAttribute("d", maskD);
    }

    const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    const top1 = lerp(pts.tl, pts.tr, 1 / 3);
    const top2 = lerp(pts.tl, pts.tr, 2 / 3);
    const bot1 = lerp(pts.bl, pts.br, 1 / 3);
    const bot2 = lerp(pts.bl, pts.br, 2 / 3);
    const lft1 = lerp(pts.tl, pts.bl, 1 / 3);
    const lft2 = lerp(pts.tl, pts.bl, 2 / 3);
    const rgt1 = lerp(pts.tr, pts.br, 1 / 3);
    const rgt2 = lerp(pts.tr, pts.br, 2 / 3);

    if (els.skewGridV1) {
      els.skewGridV1.setAttribute("x1", to1000(top1.x));
      els.skewGridV1.setAttribute("y1", to1000(top1.y));
      els.skewGridV1.setAttribute("x2", to1000(bot1.x));
      els.skewGridV1.setAttribute("y2", to1000(bot1.y));
    }
    if (els.skewGridV2) {
      els.skewGridV2.setAttribute("x1", to1000(top2.x));
      els.skewGridV2.setAttribute("y1", to1000(top2.y));
      els.skewGridV2.setAttribute("x2", to1000(bot2.x));
      els.skewGridV2.setAttribute("y2", to1000(bot2.y));
    }
    if (els.skewGridH1) {
      els.skewGridH1.setAttribute("x1", to1000(lft1.x));
      els.skewGridH1.setAttribute("y1", to1000(lft1.y));
      els.skewGridH1.setAttribute("x2", to1000(rgt1.x));
      els.skewGridH1.setAttribute("y2", to1000(rgt1.y));
    }
    if (els.skewGridH2) {
      els.skewGridH2.setAttribute("x1", to1000(lft2.x));
      els.skewGridH2.setAttribute("y1", to1000(lft2.y));
      els.skewGridH2.setAttribute("x2", to1000(rgt2.x));
      els.skewGridH2.setAttribute("y2", to1000(rgt2.y));
    }

    const dim = getRotatedSourceDimensions();
    const topW = Math.hypot((pts.tr.x - pts.tl.x) * dim.w, (pts.tr.y - pts.tl.y) * dim.h);
    const botW = Math.hypot((pts.br.x - pts.bl.x) * dim.w, (pts.br.y - pts.bl.y) * dim.h);
    const lftH = Math.hypot((pts.bl.x - pts.tl.x) * dim.w, (pts.bl.y - pts.tl.y) * dim.h);
    const rgtH = Math.hypot((pts.br.x - pts.tr.x) * dim.w, (pts.br.y - pts.tr.y) * dim.h);
    const pxW = Math.max(1, Math.round(Math.max(topW, botW)));
    const pxH = Math.max(1, Math.round(Math.max(lftH, rgtH)));
    if (els.skewDimensionsBadge) {
      els.skewDimensionsBadge.textContent = `${pxW} × ${pxH} px (Skew)`;
    }
  }

  let activeCropAction = null;

  function arrowDelta(e) {
    const dim = getRotatedSourceDimensions();
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case "ArrowLeft": return { x: -step / dim.w, y: 0 };
      case "ArrowRight": return { x: step / dim.w, y: 0 };
      case "ArrowUp": return { x: 0, y: -step / dim.h };
      case "ArrowDown": return { x: 0, y: step / dim.h };
      default: return null;
    }
  }

  function adjustCropBox(sb, handle, dx, dy, stageW, stageH) {
    const minW = Math.max(0.04, 24 / stageW);
    const minH = Math.max(0.04, 24 / stageH);

    if (!handle) {
      let newX = sb.x + dx;
      let newY = sb.y + dy;
      newX = Math.max(0, Math.min(1 - sb.w, newX));
      newY = Math.max(0, Math.min(1 - sb.h, newY));
      state.cropBox.x = newX;
      state.cropBox.y = newY;
    } else {
      let x1 = sb.x;
      let y1 = sb.y;
      let x2 = sb.x + sb.w;
      let y2 = sb.y + sb.h;

      if (handle.includes("w")) {
        x1 = Math.min(sb.x + dx, x2 - minW);
        x1 = Math.max(0, x1);
      }
      if (handle.includes("e")) {
        x2 = Math.max(sb.x + sb.w + dx, x1 + minW);
        x2 = Math.min(1, x2);
      }
      if (handle.includes("n")) {
        y1 = Math.min(sb.y + dy, y2 - minH);
        y1 = Math.max(0, y1);
      }
      if (handle.includes("s")) {
        y2 = Math.max(sb.y + sb.h + dy, y1 + minH);
        y2 = Math.min(1, y2);
      }

      state.cropBox = {
        x: x1,
        y: y1,
        w: x2 - x1,
        h: y2 - y1,
      };
    }
  }

  function initCropInteractions() {
    const stage = els.cropStage;
    const box = els.cropBox;
    if (!stage || !box) return;

    box.addEventListener("pointerdown", (e) => {
      if (activeCropAction || e.button !== 0) return;
      const handleEl = e.target.closest(".crop-handle");
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      e.preventDefault();
      e.stopPropagation();

      const handle = handleEl ? handleEl.dataset.handle : null;
      activeCropAction = {
        handleEl,
        handle: handle,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startBox: { ...state.cropBox },
        stageW: rect.width,
        stageH: rect.height,
      };

      (handleEl?.tabIndex === 0 ? handleEl : box).focus({ preventScroll: true });
      handleEl?.classList.add("active");
      box.setPointerCapture(e.pointerId);
    });

    box.addEventListener("pointermove", (e) => {
      if (!activeCropAction || activeCropAction.pointerId !== e.pointerId) return;
      e.preventDefault();

      const dx = (e.clientX - activeCropAction.startX) / activeCropAction.stageW;
      const dy = (e.clientY - activeCropAction.startY) / activeCropAction.stageH;
      const sb = activeCropAction.startBox;
      adjustCropBox(sb, activeCropAction.handle, dx, dy, activeCropAction.stageW, activeCropAction.stageH);
      syncCropBoxStyle();
    });

    const stopDrag = (e) => {
      if (activeCropAction && activeCropAction.pointerId === e.pointerId) {
        if (box.hasPointerCapture(e.pointerId)) {
          box.releasePointerCapture(e.pointerId);
        }
        activeCropAction.handleEl?.classList.remove("active");
        activeCropAction = null;
      }
    };

    box.addEventListener("pointerup", stopDrag);
    box.addEventListener("pointercancel", stopDrag);
    box.addEventListener("lostpointercapture", stopDrag);

    box.addEventListener("keydown", (e) => {
      const delta = arrowDelta(e);
      if (!delta) return;
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      adjustCropBox(state.cropBox, e.target.dataset.handle, delta.x, delta.y, rect.width, rect.height);
      syncCropBoxStyle();
    });

    window.addEventListener("resize", () => {
      if (els.cropView && !els.cropView.hidden) {
        syncCropBoxStyle();
        syncSkewOverlayStyle();
      }
    });
  }

  let activeSkewAction = null;

  function positionSkewCorner(corner, x, y) {
    const candidate = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    const points = ["tl", "tr", "br", "bl"].map(key => key === corner ? candidate : state.skewPoints[key]);
    // Preserve clockwise winding at every corner to prevent a folded perspective transform.
    const convex = points.every((a, index) => {
      const b = points[(index + 1) % 4];
      const c = points[(index + 2) % 4];
      return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) > 0.000001;
    });
    if (convex) {
      state.skewPoints[corner] = candidate;
      syncSkewOverlayStyle();
    }
  }

  function initSkewInteractions() {
    const stage = els.cropStage;
    const overlay = els.skewOverlay;
    if (!stage || !overlay) return;

    overlay.querySelectorAll(".skew-handle").forEach((handleEl) => {
      handleEl.addEventListener("pointerdown", (e) => {
        const corner = handleEl.dataset.corner;
        if (!corner || activeSkewAction || e.button !== 0) return;
        const rect = stage.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        e.preventDefault();
        e.stopPropagation();

        activeSkewAction = {
          type: "corner",
          corner: corner,
          pointerId: e.pointerId,
          handleEl: handleEl,
          startPoint: { ...state.skewPoints[corner] },
          startX: e.clientX,
          startY: e.clientY,
          stageW: rect.width,
          stageH: rect.height,
        };

        handleEl.focus({ preventScroll: true });
        handleEl.classList.add("active");
        handleEl.setPointerCapture(e.pointerId);
      });
    });

    if (els.skewPolygon) {
      els.skewPolygon.addEventListener("pointerdown", (e) => {
        if (activeSkewAction || e.button !== 0) return;
        const rect = stage.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        e.preventDefault();
        e.stopPropagation();

        activeSkewAction = {
          type: "move",
          pointerId: e.pointerId,
          targetEl: els.skewPolygon,
          startX: e.clientX,
          startY: e.clientY,
          startPoints: JSON.parse(JSON.stringify(state.skewPoints)),
          stageW: rect.width,
          stageH: rect.height,
        };

        els.skewPolygon.setPointerCapture(e.pointerId);
      });
    }

    const onPointerMove = (e) => {
      if (!activeSkewAction || activeSkewAction.pointerId !== e.pointerId) return;
      e.preventDefault();

      if (activeSkewAction.type === "corner") {
        const { corner, startPoint, startX, startY, stageW, stageH } = activeSkewAction;
        positionSkewCorner(corner, startPoint.x + (e.clientX - startX) / stageW,
          startPoint.y + (e.clientY - startY) / stageH);
      } else if (activeSkewAction.type === "move") {
        const dx = (e.clientX - activeSkewAction.startX) / activeSkewAction.stageW;
        const dy = (e.clientY - activeSkewAction.startY) / activeSkewAction.stageH;
        const sp = activeSkewAction.startPoints;

        const corners = ["tl", "tr", "br", "bl"];
        let valid = true;
        for (const c of corners) {
          const testX = sp[c].x + dx;
          const testY = sp[c].y + dy;
          if (testX < 0 || testX > 1 || testY < 0 || testY > 1) {
            valid = false;
            break;
          }
        }
        if (valid) {
          for (const c of corners) {
            state.skewPoints[c].x = sp[c].x + dx;
            state.skewPoints[c].y = sp[c].y + dy;
          }
          syncSkewOverlayStyle();
        }
      }
    };

    const onPointerUp = (e) => {
      if (!activeSkewAction || activeSkewAction.pointerId !== e.pointerId) return;
      if (activeSkewAction.handleEl && activeSkewAction.handleEl.hasPointerCapture(e.pointerId)) {
        activeSkewAction.handleEl.releasePointerCapture(e.pointerId);
      }
      if (activeSkewAction.targetEl && activeSkewAction.targetEl.hasPointerCapture(e.pointerId)) {
        activeSkewAction.targetEl.releasePointerCapture(e.pointerId);
      }
      activeSkewAction.handleEl?.classList.remove("active");
      activeSkewAction = null;
    };

    overlay.addEventListener("pointermove", onPointerMove);
    overlay.addEventListener("pointerup", onPointerUp);
    overlay.addEventListener("pointercancel", onPointerUp);
    overlay.addEventListener("lostpointercapture", onPointerUp);

    overlay.querySelectorAll(".skew-handle").forEach((handleEl) => {
      handleEl.addEventListener("keydown", (e) => {
        const corner = handleEl.dataset.corner;
        if (!corner) return;
        const delta = arrowDelta(e);
        if (!delta) return;
        e.preventDefault();
        const point = state.skewPoints[corner];
        positionSkewCorner(corner, point.x + delta.x, point.y + delta.y);
      });
    });
  }

  function toggleCropMode(targetMode) {
    const nextMode = targetMode || (state.cropMode === "standard" ? "skew" : "standard");
    state.cropMode = nextMode;

    if (nextMode === "skew") {
      const b = state.cropBox;
      state.skewPoints = {
        tl: { x: b.x, y: b.y },
        tr: { x: b.x + b.w, y: b.y },
        br: { x: b.x + b.w, y: b.y + b.h },
        bl: { x: b.x, y: b.y + b.h },
      };

      if (els.cropBox) els.cropBox.hidden = true;
      if (els.skewOverlay) els.skewOverlay.hidden = false;

      if (els.cropSkewToggleBtn) {
        els.cropSkewToggleBtn.classList.add("active", "btn-primary");
        els.cropSkewToggleBtn.classList.remove("btn-outline-secondary");
        els.cropSkewToggleBtn.setAttribute("aria-pressed", "true");
      }
      if (els.cropSkewToggleText) {
        els.cropSkewToggleText.textContent = "Mode Skew (Aktif)";
      }
      if (els.cropHelp) {
        els.cropHelp.textContent = "Tarik 4 sudut secara bebas ke sudut marmer. Foto yang miring atau difoto menyerong akan diluruskan otomatis.";
      }

      syncSkewOverlayStyle();
      toast("Mode Skew aktif. Tarik 4 sudut untuk meluruskan bidang marmer.");
    } else {
      const pts = state.skewPoints;
      const minX = Math.min(pts.tl.x, pts.tr.x, pts.br.x, pts.bl.x);
      const maxX = Math.max(pts.tl.x, pts.tr.x, pts.br.x, pts.bl.x);
      const minY = Math.min(pts.tl.y, pts.tr.y, pts.br.y, pts.bl.y);
      const maxY = Math.max(pts.tl.y, pts.tr.y, pts.br.y, pts.bl.y);
      state.cropBox = {
        x: Math.max(0, minX),
        y: Math.max(0, minY),
        w: Math.max(0.04, maxX - minX),
        h: Math.max(0.04, maxY - minY),
      };

      if (els.skewOverlay) els.skewOverlay.hidden = true;
      if (els.cropBox) els.cropBox.hidden = false;

      if (els.cropSkewToggleBtn) {
        els.cropSkewToggleBtn.classList.remove("active", "btn-primary");
        els.cropSkewToggleBtn.classList.add("btn-outline-secondary");
        els.cropSkewToggleBtn.setAttribute("aria-pressed", "false");
      }
      if (els.cropSkewToggleText) {
        els.cropSkewToggleText.textContent = "Mode Skew";
      }
      if (els.cropHelp) {
        els.cropHelp.textContent = "Tarik sudut atau tepi untuk memangkas foto. Geser bagian tengah untuk memindahkan bingkai.";
      }

      syncCropBoxStyle();
      toast("Kembali ke mode kotak standar.");
    }
  }

  function rotateCrop() {
    state.cropRotation = (state.cropRotation + 90) % 360;

    const oldBox = { ...state.cropBox };
    state.cropBox = {
      x: 1 - (oldBox.y + oldBox.h),
      y: oldBox.x,
      w: oldBox.h,
      h: oldBox.w,
    };

    const oldPts = JSON.parse(JSON.stringify(state.skewPoints));
    state.skewPoints = {
      tl: { x: 1 - oldPts.bl.y, y: oldPts.bl.x },
      tr: { x: 1 - oldPts.tl.y, y: oldPts.tl.x },
      br: { x: 1 - oldPts.tr.y, y: oldPts.tr.x },
      bl: { x: 1 - oldPts.br.y, y: oldPts.br.x },
    };

    renderCropCanvas();
    toast(`Foto diputar ke ${state.cropRotation}°.`);
  }

  function resetCropBox() {
    state.cropBox = { x: 0, y: 0, w: 1, h: 1 };
    state.skewPoints = {
      tl: { x: 0.02, y: 0.02 },
      tr: { x: 0.98, y: 0.02 },
      br: { x: 0.98, y: 0.98 },
      bl: { x: 0.02, y: 0.98 },
    };
    syncCropBoxStyle();
    syncSkewOverlayStyle();
    toast("Seluruh area foto dipilih.");
  }

  function warpPerspective(srcCanvas, p0, p1, p2, p3, outW, outH) {
    const srcW = srcCanvas.width;
    const srcH = srcCanvas.height;
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    const srcImgData = srcCtx.getImageData(0, 0, srcW, srcH);
    const srcBytes = srcImgData.data;

    const outCanvas = document.createElement("canvas");
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext("2d");
    const outImgData = outCtx.createImageData(outW, outH);
    const outBytes = outImgData.data;

    const x0 = p0.x, y0 = p0.y;
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;

    const dx1 = x1 - x2, dx2 = x3 - x2;
    const dy1 = y1 - y2, dy2 = y3 - y2;
    const sx = x0 - x1 + x2 - x3;
    const sy = y0 - y1 + y2 - y3;

    let g = 0, h = 0;
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) > 1e-7) {
      g = (sx * dy2 - sy * dx2) / det;
      h = (dx1 * sy - dy1 * sx) / det;
    }
    const a = x1 - x0 + g * x1;
    const b = x3 - x0 + h * x3;
    const c = x0;
    const d = y1 - y0 + g * y1;
    const e = y3 - y0 + h * y3;
    const f = y0;

    for (let v = 0; v < outH; v++) {
      const t = v / outH;
      const dstRowOffset = v * outW * 4;
      for (let u = 0; u < outW; u++) {
        const s = u / outW;
        const w = g * s + h * t + 1;
        const x = (a * s + b * t + c) / w;
        const y = (d * s + e * t + f) / w;

        const xFloor = Math.floor(x);
        const yFloor = Math.floor(y);

        if (xFloor >= 0 && xFloor < srcW - 1 && yFloor >= 0 && yFloor < srcH - 1) {
          const fx = x - xFloor;
          const fy = y - yFloor;
          const fx1 = 1 - fx;
          const fy1 = 1 - fy;
          const w00 = fx1 * fy1;
          const w10 = fx * fy1;
          const w01 = fx1 * fy;
          const w11 = fx * fy;

          const i00 = (yFloor * srcW + xFloor) * 4;
          const i10 = i00 + 4;
          const i01 = ((yFloor + 1) * srcW + xFloor) * 4;
          const i11 = i01 + 4;

          const dIdx = dstRowOffset + u * 4;
          const a00 = w00 * srcBytes[i00 + 3], a10 = w10 * srcBytes[i10 + 3];
          const a01 = w01 * srcBytes[i01 + 3], a11 = w11 * srcBytes[i11 + 3];
          const alpha = a00 + a10 + a01 + a11;
          if (alpha > 0) {
            for (let channel = 0; channel < 3; channel++) {
              outBytes[dIdx + channel] = (a00 * srcBytes[i00 + channel] + a10 * srcBytes[i10 + channel]
                + a01 * srcBytes[i01 + channel] + a11 * srcBytes[i11 + channel]) / alpha;
            }
            outBytes[dIdx + 3] = alpha;
          }
        } else if (xFloor >= 0 && xFloor < srcW && yFloor >= 0 && yFloor < srcH) {
          const sIdx = (yFloor * srcW + xFloor) * 4;
          const dIdx = dstRowOffset + u * 4;
          outBytes[dIdx]     = srcBytes[sIdx];
          outBytes[dIdx + 1] = srcBytes[sIdx + 1];
          outBytes[dIdx + 2] = srcBytes[sIdx + 2];
          outBytes[dIdx + 3] = srcBytes[sIdx + 3];
        }
      }
    }

    outCtx.putImageData(outImgData, 0, 0);
    return outCanvas;
  }

  function applyCrop() {
    if (!state.rawImage) return;
    const dim = getRotatedSourceDimensions();

    let offscreen;
    let cropW, cropH;
    let label;

    if (state.cropMode === "skew") {
      const p0 = { x: state.skewPoints.tl.x * dim.w, y: state.skewPoints.tl.y * dim.h };
      const p1 = { x: state.skewPoints.tr.x * dim.w, y: state.skewPoints.tr.y * dim.h };
      const p2 = { x: state.skewPoints.br.x * dim.w, y: state.skewPoints.br.y * dim.h };
      const p3 = { x: state.skewPoints.bl.x * dim.w, y: state.skewPoints.bl.y * dim.h };

      const topW = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const botW = Math.hypot(p2.x - p3.x, p2.y - p3.y);
      const leftH = Math.hypot(p3.x - p0.x, p3.y - p0.y);
      const rightH = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      cropW = Math.max(20, Math.round(Math.max(topW, botW)));
      cropH = Math.max(20, Math.round(Math.max(leftH, rightH)));

      offscreen = warpPerspective(els.cropCanvas, p0, p1, p2, p3, cropW, cropH);
      label = `${cropW} × ${cropH} px (Diluruskan)`;
    } else {
      const cropX = Math.round(state.cropBox.x * dim.w);
      const cropY = Math.round(state.cropBox.y * dim.h);
      cropW = Math.max(10, Math.round(state.cropBox.w * dim.w));
      cropH = Math.max(10, Math.round(state.cropBox.h * dim.h));

      offscreen = document.createElement("canvas");
      offscreen.width = cropW;
      offscreen.height = cropH;
      const ctx = offscreen.getContext("2d");
      ctx.drawImage(
        els.cropCanvas,
        cropX, cropY, cropW, cropH,
        0, 0, cropW, cropH,
      );
      label = `${cropW} × ${cropH} px (Dipangkas)`;
    }

    state.image = offscreen;
    state.source = { x: 0, y: 0, w: cropW, h: cropH };

    try {
      const thumbUrl = offscreen.toDataURL("image/jpeg", 0.85);
      if (els.uploadThumb) {
        els.uploadThumb.src = thumbUrl;
        els.uploadThumb.hidden = false;
      }
    } catch (_) {}

    if (els.editorFileName) els.editorFileName.textContent = state.fileName;
    if (els.editorFileMeta) els.editorFileMeta.textContent = label;

    clearDimensions();
    state.position = 0;
    els.position.value = "0";

    els.cropView.hidden = true;
    els.editorView.hidden = false;
    showVisualState("ready");
    updateStatus();
    toast(state.cropMode === "skew" ? "Foto berhasil diluruskan dan dipangkas." : "Potongan foto diterapkan. Silakan atur slab Anda.");

    if (window.matchMedia("(max-width: 991.98px)").matches) {
      document
        .getElementById("previewTitle")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function skipCrop() {
    if (!state.rawImage) return;
    const dim = getRotatedSourceDimensions();

    let workingImg;
    if (state.cropRotation !== 0) {
      const offscreen = document.createElement("canvas");
      offscreen.width = dim.w;
      offscreen.height = dim.h;
      const ctx = offscreen.getContext("2d");
      ctx.drawImage(els.cropCanvas, 0, 0);
      workingImg = offscreen;
    } else {
      workingImg = state.rawImage;
    }

    state.image = workingImg;
    state.source = { x: 0, y: 0, w: dim.w, h: dim.h };

    try {
      const thumbUrl = (state.cropRotation !== 0 && workingImg.toDataURL)
        ? workingImg.toDataURL("image/jpeg", 0.85)
        : state.userPhotoUrl;
      if (els.uploadThumb) {
        els.uploadThumb.src = thumbUrl;
        els.uploadThumb.hidden = false;
      }
    } catch (_) {}

    if (els.editorFileName) els.editorFileName.textContent = state.fileName;
    if (els.editorFileMeta) els.editorFileMeta.textContent = `${dim.w} × ${dim.h} px (Foto penuh)`;

    clearDimensions();
    state.position = 0;
    els.position.value = "0";

    els.cropView.hidden = true;
    els.editorView.hidden = false;
    showVisualState("ready");
    updateStatus();
    toast("Menggunakan foto penuh tanpa potongan.");

    if (window.matchMedia("(max-width: 991.98px)").matches) {
      document
        .getElementById("previewTitle")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function reopenCrop() {
    if (!state.rawImage) return;
    els.editorView.hidden = true;
    els.cropView.hidden = false;

    if (state.cropMode === "skew") {
      if (els.cropBox) els.cropBox.hidden = true;
      if (els.skewOverlay) els.skewOverlay.hidden = false;
      syncSkewOverlayStyle();
    } else {
      if (els.skewOverlay) els.skewOverlay.hidden = true;
      if (els.cropBox) els.cropBox.hidden = false;
      syncCropBoxStyle();
    }

    renderCropCanvas();
    toast("Sesuaikan kembali area pangkas.");
    if (window.matchMedia("(max-width: 991.98px)").matches) {
      document
        .getElementById("cropTitle")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  async function acceptFile(file) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(
        file.type,
      )
    ) {
      toast("Pilih foto PNG, JPG, WEBP, atau AVIF.");
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      toast("Ukuran file maksimum 40 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const sequence = ++state.loadSequence;
    els.loading.textContent = "Membaca foto slab...";
    showVisualState("loading");
    try {
      const image = await loadImage(url);
      if (sequence !== state.loadSequence) {
        URL.revokeObjectURL(url);
        return;
      }
      if (state.userPhotoUrl) URL.revokeObjectURL(state.userPhotoUrl);
      state.userPhotoUrl = url;
      state.rawImage = image;
      state.fileName = file.name;
      state.name = file.name.replace(/\.[^.]+$/, "").trim() || "Slab";
      state.cropRotation = 0;
      state.cropBox = { x: 0.04, y: 0.04, w: 0.92, h: 0.92 };
      toggleCropMode("standard");

      // Masuk ke Tahap 2: Crop View
      if (els.uploadView) els.uploadView.hidden = true;
      if (els.editorView) els.editorView.hidden = true;
      if (els.cropView) els.cropView.hidden = false;

      renderCropCanvas();
      toast("Foto dimuat. Silakan pangkas jika perlu, atau lewati.");

      if (window.matchMedia("(max-width: 991.98px)").matches) {
        document
          .getElementById("cropTitle")
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    } catch (error) {
      URL.revokeObjectURL(url);
      if (sequence !== state.loadSequence) return;
      showVisualState(
        "error",
        "File tidak berhasil dibaca. Gunakan PNG, JPG, WEBP, atau AVIF yang valid.",
      );
      toast("Format foto tidak dapat dibaca oleh browser.");
    }
  }

  function removePhoto() {
    state.loadSequence++;
    if (state.userPhotoUrl) URL.revokeObjectURL(state.userPhotoUrl);
    state.userPhotoUrl = null;
    state.rawImage = null;
    state.image = null;
    state.source = null;
    state.name = "Belum ada foto";
    state.fileName = "";
    clearDimensions();
    els.fileName.textContent = "Tarik & lepas foto slab ke sini";
    els.uploadHint.textContent = "JPG, PNG, WEBP, AVIF hingga 40 MB";
    els.uploadAction.textContent = "Pilih foto slab";
    if (els.uploadThumb) {
      els.uploadThumb.hidden = true;
      els.uploadThumb.removeAttribute("src");
    }
    if (els.imageInput) els.imageInput.value = "";
    if (els.cropView) els.cropView.hidden = true;
    if (els.editorView) els.editorView.hidden = true;
    if (els.uploadView) els.uploadView.hidden = false;
    showVisualState("empty");
    updateStatus();
  }

  function clearDimensions() {
    state.width = null;
    state.height = null;
    els.width.value = "";
    els.height.value = "";
    for (const input of [els.width, els.height]) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
    }
    els.sizeHelp.textContent =
      "Opsional. Isi jika tahu ukuran asli slab. Jika kosong, pratinjau mengikuti rasio foto.";
  }

  function reset() {
    if (els.background.value !== "bg-1.png") void selectBackground("bg-1.png");
    clearDimensions();
    state.shine = 70;
    state.position = 0;
    state.shadow = true;
    state.outline = false;
    els.shine.value = "70";
    els.position.value = "0";
    if (els.shadow) els.shadow.checked = true;
    if (els.outline) els.outline.checked = false;
    setFinish("glossy");
    setMode("cover");
    toast("Pengaturan direset. Foto tetap ada.");
  }

  async function downloadImage() {
    if (!state.image || !state.studio || state.status !== "ready" || els.background.value !== state.background) return;
    state.exporting = true;
    syncDownloadButton();
    const originalContent = els.download.innerHTML;
    els.download.textContent = "Mengekspor...";
    try {
      const factor = Number(els.resolution.value) || 2;
      const output = document.createElement("canvas");
      drawFrame(output, factor);
      const { width, height } = output;
      const blob = await new Promise((resolve, reject) => {
        output.toBlob(
          (file) =>
            file ? resolve(file) : reject(new Error("PNG gagal dibuat")),
          "image/png",
        );
      });
      output.width = 0;
      output.height = 0;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName =
        state.name
          .normalize("NFKD")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase() || "marble-slab";
      a.href = objectUrl;
      const sizeLabel = hasDimensions()
        ? `${formatCm(state.width)}x${formatCm(state.height)}cm`
        : "rasio-foto";
      a.download = `${safeName}-${sizeLabel}-${state.finish}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 20000);
      toast(`PNG ${width} × ${height} berhasil dibuat.`);
    } catch (error) {
      console.error(error);
      toast("Gagal mengekspor gambar. Coba resolusi yang lebih rendah.");
    } finally {
      state.exporting = false;
      syncDownloadButton();
      els.download.innerHTML = originalContent;
    }
  }

  function arrowSelection(selector, handler) {
    const choices = Array.from(document.querySelectorAll(selector));
    choices.forEach((button, index) =>
      button.addEventListener("keydown", (event) => {
        const move = ["ArrowRight", "ArrowDown"].includes(event.key)
          ? 1
          : ["ArrowLeft", "ArrowUp"].includes(event.key)
            ? -1
            : 0;
        if (!move) return;
        event.preventDefault();
        const next = choices[(index + move + choices.length) % choices.length];
        next.focus();
        handler(next);
      }),
    );
  }

  function attachEvents() {
    els.background.addEventListener("change", () => {
      void selectBackground(els.background.value);
    });
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    const syncScrollTop = () => {
      scrollTopBtn?.classList.toggle("is-visible", window.scrollY > 320);
    };
    window.addEventListener("scroll", syncScrollTop, { passive: true });
    syncScrollTop();
    scrollTopBtn?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    els.dropZone.addEventListener("click", () => els.imageInput.click());
    els.imageInput.addEventListener("change", (e) => {
      void acceptFile(e.target.files[0]);
      e.target.value = "";
    });
    ["dragenter", "dragover"].forEach((event) =>
      els.dropZone.addEventListener(event, (e) => {
        e.preventDefault();
        els.dropZone.classList.add("dragover");
      }),
    );
    ["dragleave", "drop"].forEach((event) =>
      els.dropZone.addEventListener(event, (e) => {
        e.preventDefault();
        els.dropZone.classList.remove("dragover");
      }),
    );
    els.dropZone.addEventListener("drop", (e) => {
      void acceptFile(e.dataTransfer.files[0]);
    });
    for (const which of ["width", "height"]) {
      els[which].addEventListener("input", (e) =>
        setSize(which, e.target.value),
      );
      els[which].addEventListener("change", (e) =>
        setSize(which, e.target.value, true),
      );
    }
    document
      .querySelectorAll(".finish-card")
      .forEach((button) =>
        button.addEventListener("click", () =>
          setFinish(button.dataset.finish),
        ),
      );
    document
      .querySelectorAll(".crop-option")
      .forEach((button) =>
        button.addEventListener("click", () => setMode(button.dataset.mode)),
      );
    arrowSelection(".finish-card", (button) =>
      setFinish(button.dataset.finish),
    );
    arrowSelection(".crop-option", (button) => setMode(button.dataset.mode));
    els.shine.addEventListener("input", (e) => {
      state.shine = Number(e.target.value);
      updateStatus();
    });
    els.position.addEventListener("input", (e) => {
      state.position = Number(e.target.value);
      requestRender();
    });
    els.centerCrop.addEventListener("click", () => {
      state.position = 0;
      els.position.value = "0";
      requestRender();
    });
    els.shadow?.addEventListener("change", (e) => {
      state.shadow = Boolean(e.target.checked);
      requestRender();
    });
    els.outline?.addEventListener("change", (e) => {
      state.outline = Boolean(e.target.checked);
      requestRender();
    });
    const canvasDropZone = document.getElementById("canvasDropZone");
    const canvasSurface = document.querySelector(".canvas-surface");
    [canvasDropZone, canvasSurface].filter(Boolean).forEach((zone) => {
      ["dragenter", "dragover"].forEach((event) =>
        zone.addEventListener(event, (e) => {
          e.preventDefault();
          canvasDropZone?.classList.add("dragover");
          canvasSurface?.classList.add("dragover");
        }),
      );
      ["dragleave", "drop"].forEach((event) =>
        zone.addEventListener(event, (e) => {
          e.preventDefault();
          canvasDropZone?.classList.remove("dragover");
          canvasSurface?.classList.remove("dragover");
        }),
      );
      zone.addEventListener("drop", (e) => {
        void acceptFile(e.dataTransfer.files[0]);
      });
      zone.addEventListener("click", (e) => {
        // Jika klik pada dropzone di kanvas (dan bukan tombol lain), buka picker
        if (state.status === "empty" && e.target !== els.emptyUploadBtn) {
          els.imageInput.click();
        }
      });
    });

    document
      .getElementById("emptyUploadBtn")
      .addEventListener("click", () => els.imageInput.click());
    document
      .getElementById("retryBtn")
      .addEventListener("click", () => els.imageInput.click());
    els.remove?.addEventListener("click", removePhoto);
    els.createAgainBtn?.addEventListener("click", removePhoto);
    els.brandLink?.addEventListener("click", (e) => {
      e.preventDefault();
      if (state.image || state.rawImage) {
        removePhoto();
      }
    });
    document.getElementById("resetBtn").addEventListener("click", reset);
    els.download.addEventListener("click", () => {
      void downloadImage();
    });

    initCropInteractions();
    initSkewInteractions();
    els.cropSkewToggleBtn?.addEventListener("click", () => toggleCropMode());
    els.cropRotateBtn?.addEventListener("click", rotateCrop);
    els.cropResetBtn?.addEventListener("click", resetCropBox);
    els.cropChangePhotoBtn?.addEventListener("click", () => els.imageInput.click());
    els.skipCropBtn?.addEventListener("click", skipCrop);
    els.applyCropBtn?.addEventListener("click", applyCrop);
    els.recropBtn?.addEventListener("click", reopenCrop);
  }

  async function init() {
    attachEvents();
    setFinish("glossy");
    setMode("cover");
    if (els.uploadView) els.uploadView.hidden = false;
    if (els.cropView) els.cropView.hidden = true;
    if (els.editorView) els.editorView.hidden = true;
    showVisualState("loading");
    try {
      showroomReflection = prepareReflection(await loadImage("./assets/showroom-reflection.jpg"));
    } catch {
      toast("Foto pantulan showroom gagal dimuat.");
    }
    await selectBackground(els.background.value);
    updateStatus();
  }

  void init();
})();
