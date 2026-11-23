(() => {
  "use strict";

  const W = 1448;
  const H = 1086;
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
    editorView: document.getElementById("editorView"),
    createAgainBtn: document.getElementById("createAgainBtn"),
    editorFileName: document.getElementById("editorFileName"),
    editorFileMeta: document.getElementById("editorFileMeta"),
    resolution: document.getElementById("resolutionInput"),
    download: document.getElementById("downloadBtn"),
    toast: document.getElementById("toast"),
  };

  const state = {
    width: null,
    height: null,
    name: "Belum ada foto",
    finish: "glossy",
    shine: 70,
    mode: "cover",
    position: 0,
    shadow: true,
    outline: false,
    image: null,
    source: null,
    studio: null,
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
    const maxW = 1370;
    const maxH = 734;
    const ratio = slabRatio();
    let width = maxW;
    let height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }
    return { x: (W - width) / 2, y: 907 - height, w: width, h: height };
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

  function drawLight(ctx, slab) {
    if (state.finish === "honed" || state.shine === 0) return;
    const s = slab;
    const strength = state.shine / 100;
    const amount = (state.finish === "glossy" ? 1 : 0.42) * strength;

    // A simulated reflection. The photograph's stone pixels are never recolored,
    // stretched, rotated, or regenerated; this draws light over the source.
    const broad = ctx.createLinearGradient(
      s.x + s.w * 0.48,
      0,
      s.x + s.w * 0.97,
      0,
    );
    broad.addColorStop(0, "rgba(255,255,255,0)");
    broad.addColorStop(0.35, `rgba(247,252,253,${0.036 * amount})`);
    broad.addColorStop(0.66, `rgba(255,255,255,${0.105 * amount})`);
    broad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = broad;
    ctx.fillRect(s.x + s.w * 0.48, s.y, s.w * 0.52, s.h);

    // Softly defined studio light on the upper-right area.
    const centerX = s.x + s.w * 0.86;
    const centerY = s.y + s.h * 0.29;
    const radius = Math.max(30, s.w * 0.21);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(1, 0.34);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    glow.addColorStop(0, `rgba(255,255,255,${0.3 * amount})`);
    glow.addColorStop(0.35, `rgba(255,255,255,${0.12 * amount})`);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (state.finish === "glossy") {
      // Fine, diffuse window-like reflections. Their boundaries are feathered.
      for (const [offset, opacity, thickness] of [
        [0.235, 0.17, 0.015],
        [0.275, 0.1, 0.01],
      ]) {
        const yy = s.y + s.h * offset;
        const xStart = s.x + s.w * 0.78;
        const ww = s.w * 0.165;
        const grad = ctx.createLinearGradient(xStart, 0, xStart + ww, 0);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.2, `rgba(255,255,255,${opacity * amount})`);
        grad.addColorStop(0.7, `rgba(255,255,255,${opacity * amount})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(xStart, yy, ww, Math.max(2, s.h * thickness));
      }
    }
  }

  function paintSlab(ctx, s) {
    // Bayangan kontak lembut di dasar tatakan (Ambient Occlusion)
    if (state.shadow) {
      ctx.save();
      const bottom = s.y + s.h;
      const inset = Math.min(8, s.w * 0.02);
      // Lapisan 1: bayangan lembut menyebar
      ctx.filter = "blur(8px)";
      ctx.fillStyle = "rgba(12, 16, 14, 0.22)";
      ctx.fillRect(s.x + inset, bottom - 2, s.w - inset * 2, 10);
      // Lapisan 2: bayangan kontak intim tepat di garis tumpuan
      ctx.filter = "blur(2px)";
      ctx.fillStyle = "rgba(10, 14, 12, 0.32)";
      ctx.fillRect(s.x + inset * 1.5, bottom - 1, s.w - inset * 3, 3);
      ctx.restore();
    }

    ctx.save();
    roundedRect(ctx, s.x, s.y, s.w, s.h, 4);
    ctx.clip();

    if (state.mode === "cover") {
      const src = imageCrop();
      ctx.drawImage(
        state.image,
        src.x,
        src.y,
        src.w,
        src.h,
        s.x,
        s.y,
        s.w,
        s.h,
      );
    } else {
      // Contain preserves all image pixels while maintaining physical slab bounds.
      ctx.fillStyle = "#d6dad1";
      ctx.fillRect(s.x, s.y, s.w, s.h);
      const source = state.source;
      const naturalRatio = imageRatio();
      let drawWidth = s.w;
      let drawHeight = drawWidth / naturalRatio;
      if (drawHeight > s.h) {
        drawHeight = s.h;
        drawWidth = drawHeight * naturalRatio;
      }
      ctx.drawImage(
        state.image,
        source.x,
        source.y,
        source.w,
        source.h,
        s.x + (s.w - drawWidth) / 2,
        s.y + (s.h - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
    }

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
  }

  function drawFrame(canvas, multiplier = 1) {
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

  function showVisualState(status, message = "") {
    state.status = status;
    if (els.loading) els.loading.hidden = status !== "loading";
    if (els.empty) els.empty.hidden = status !== "empty";
    if (els.error) els.error.hidden = status !== "error";
    if (message && els.errorText) els.errorText.textContent = message;
    if (els.download) els.download.disabled = status !== "ready";
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
      state.image = image;
      state.source = {
        x: 0,
        y: 0,
        w: image.naturalWidth,
        h: image.naturalHeight,
      };
      state.name = file.name.replace(/\.[^.]+$/, "").trim() || "Slab";
      clearDimensions();
      state.position = 0;
      els.position.value = "0";
      els.fileName.textContent = file.name;
      els.uploadHint.textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
      if (els.editorFileName) els.editorFileName.textContent = file.name;
      if (els.editorFileMeta) els.editorFileMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
      if (els.uploadThumb) {
        els.uploadThumb.src = url;
        els.uploadThumb.hidden = false;
      }
      if (els.uploadView) els.uploadView.hidden = true;
      if (els.editorView) els.editorView.hidden = false;
      showVisualState("ready");
      updateStatus();
      toast("Foto siap. Anda dapat mengatur ukuran dan finishing.");
      if (window.matchMedia("(max-width: 991.98px)").matches) {
        document
          .getElementById("previewTitle")
          ?.scrollIntoView({ block: "start" });
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
    state.image = null;
    state.source = null;
    state.name = "Belum ada foto";
    clearDimensions();
    els.fileName.textContent = "Tarik & lepas foto slab ke sini";
    els.uploadHint.textContent = "JPG, PNG, WEBP, AVIF hingga 40 MB";
    els.uploadAction.textContent = "Pilih foto slab";
    if (els.uploadThumb) {
      els.uploadThumb.hidden = true;
      els.uploadThumb.removeAttribute("src");
    }
    if (els.imageInput) els.imageInput.value = "";
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
    if (!state.image || !state.studio || state.status !== "ready") return;
    els.download.disabled = true;
    const originalContent = els.download.innerHTML;
    els.download.textContent = "Mengekspor...";
    try {
      const factor = Number(els.resolution.value) || 2;
      const output = document.createElement("canvas");
      drawFrame(output, factor);
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
      toast(`PNG ${W * factor} × ${H * factor} berhasil dibuat.`);
    } catch (error) {
      console.error(error);
      toast("Gagal mengekspor gambar. Coba resolusi yang lebih rendah.");
    } finally {
      els.download.disabled = state.status !== "ready";
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
      if (state.image) {
        removePhoto();
      }
    });
    document.getElementById("resetBtn").addEventListener("click", reset);
    els.download.addEventListener("click", () => {
      void downloadImage();
    });
  }

  async function init() {
    attachEvents();
    setFinish("glossy");
    setMode("cover");
    if (els.uploadView) els.uploadView.hidden = false;
    if (els.editorView) els.editorView.hidden = true;
    showVisualState("loading");
    try {
      state.studio = await loadImage("./assets/studio.png");
      showVisualState("empty");
      updateStatus();
    } catch (error) {
      showVisualState(
        "error",
        "Foto latar studio tidak tersedia. Periksa folder assets lalu muat ulang.",
      );
      toast("Studio tidak dapat dimuat.");
    }
  }

  void init();
})();
