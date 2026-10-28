/**
 * Plant Disease Detection System — Frontend JavaScript
 * =====================================================
 * Handles file upload, drag-and-drop, API communication,
 * and dynamic result rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------
  // DOM References
  // -------------------------------------------------------
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const dropZonePrompt = document.getElementById('drop-zone-prompt');
  const previewArea = document.getElementById('preview-area');
  const previewImage = document.getElementById('preview-image');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const fileMeta = document.getElementById('file-meta');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const analyzeBtn = document.getElementById('analyze-btn');
  const loadingOverlay = document.getElementById('loading-overlay');
  const resultsSection = document.getElementById('results-section');
  const resultImage = document.getElementById('result-image');
  const resultPlantName = document.getElementById('result-plant-name');
  const resultStatusBadge = document.getElementById('result-status-badge');
  const resultDiseaseName = document.getElementById('result-disease-name');
  const resultConfidencePercent = document.getElementById('result-confidence-percent');
  const resultConfidenceBar = document.getElementById('result-confidence-bar');
  const topPredictionsList = document.getElementById('top-predictions-list');
  const diseaseDescription = document.getElementById('disease-description');
  const diseasePreventionList = document.getElementById('disease-prevention-list');
  const tryAnotherBtn = document.getElementById('try-another-btn');
  const toastContainer = document.getElementById('toast-container');

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  let selectedFile = null;

  // -------------------------------------------------------
  // Constants
  // -------------------------------------------------------
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

  // -------------------------------------------------------
  // 1. Navigation
  // -------------------------------------------------------

  // Mobile toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Smooth scroll + active state
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navMenu.classList.remove('open');

      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Update active nav on scroll
  const sections = document.querySelectorAll('section[id], header[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // -------------------------------------------------------
  // 2. Drag & Drop
  // -------------------------------------------------------

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // -------------------------------------------------------
  // 3. File Input
  // -------------------------------------------------------

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  // -------------------------------------------------------
  // 4. File Validation
  // -------------------------------------------------------

  function validateFile(file) {
    if (!file) {
      showToast('No file selected. Please choose an image.', 'error');
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Invalid file type. Please upload a JPG, JPEG, or PNG image.', 'error');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      showToast(`File is too large (${sizeMB} MB). Maximum allowed size is 10 MB.`, 'error');
      return false;
    }

    return true;
  }

  // -------------------------------------------------------
  // 5. File Handling & Preview
  // -------------------------------------------------------

  function handleFile(file) {
    if (!validateFile(file)) {
      return;
    }

    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      dropZonePrompt.classList.add('hidden');
      previewArea.classList.remove('hidden');
      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);
      analyzeBtn.disabled = false;

      // Hide results if showing from previous run
      resultsSection.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Remove image button
  removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetUpload();
  });

  // Sample chips quick-select handler
  const sampleChips = document.querySelectorAll('.sample-chip');
  sampleChips.forEach(chip => {
    chip.addEventListener('click', async () => {
      const sampleFile = chip.getAttribute('data-sample');
      try {
        const response = await fetch(`/static/samples/${sampleFile}`);
        if (!response.ok) throw new Error('Could not load sample image');
        const blob = await response.blob();
        const file = new File([blob], sampleFile, { type: 'image/jpeg' });
        handleFile(file);
        showToast('Sample leaf loaded! Click "Analyze Leaf" to diagnose.', 'success');
      } catch (err) {
        showToast('Error loading sample image. Please try uploading a file.', 'error');
      }
    });
  });

  // -------------------------------------------------------
  // Gemini Vision Key Modal & Storage Handlers
  // -------------------------------------------------------
  const geminiKeyBtn = document.getElementById('gemini-key-btn');
  const geminiModal = document.getElementById('gemini-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const geminiApiKeyInput = document.getElementById('gemini-api-key-input');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const clearKeyBtn = document.getElementById('clear-key-btn');
  const keySavedAlert = document.getElementById('key-saved-alert');
  const geminiStatusDot = document.getElementById('gemini-status-dot');

  function updateGeminiStatus() {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    if (savedKey) {
      if (geminiApiKeyInput) geminiApiKeyInput.value = savedKey;
      if (geminiStatusDot) geminiStatusDot.classList.add('active');
    } else {
      fetch('/api/status')
        .then(r => r.json())
        .then(st => {
          if (st.gemini_vision_active && geminiStatusDot) {
            geminiStatusDot.classList.add('active');
          }
        })
        .catch(() => {});
    }
  }
  updateGeminiStatus();

  if (geminiKeyBtn && geminiModal) {
    geminiKeyBtn.addEventListener('click', () => {
      geminiModal.classList.remove('hidden');
      if (keySavedAlert) keySavedAlert.classList.add('hidden');
    });
  }

  if (modalCloseBtn && geminiModal) {
    modalCloseBtn.addEventListener('click', () => {
      geminiModal.classList.add('hidden');
    });
  }

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      const keyVal = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';
      if (keyVal) {
        localStorage.setItem('gemini_api_key', keyVal);
        if (geminiStatusDot) geminiStatusDot.classList.add('active');
        if (keySavedAlert) keySavedAlert.classList.remove('hidden');
        showToast('Gemini API Key saved! Universal leaf detection is active.', 'success');
        setTimeout(() => geminiModal.classList.add('hidden'), 1200);
      } else {
        showToast('Please paste a valid Gemini API key.', 'error');
      }
    });
  }

  if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', () => {
      localStorage.removeItem('gemini_api_key');
      if (geminiApiKeyInput) geminiApiKeyInput.value = '';
      if (geminiStatusDot) geminiStatusDot.classList.remove('active');
      showToast('Gemini API Key removed.', 'warning');
      geminiModal.classList.add('hidden');
    });
  }

  // -------------------------------------------------------
  // 6. Analyze Button → API Call
  // -------------------------------------------------------

  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showToast('Please select an image first.', 'error');
      return;
    }

    // Show loading
    analyzeBtn.disabled = true;
    loadingOverlay.classList.remove('hidden');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const headers = {};
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) {
        headers['X-Gemini-Key'] = storedKey;
      }

      const response = await fetch('/predict', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        displayResults(data);
      } else {
        showToast(data.error || 'Prediction failed. Please try again.', 'error');
      }

    } catch (err) {
      console.error('Prediction error:', err);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      loadingOverlay.classList.add('hidden');
      analyzeBtn.disabled = false;
    }
  });

  // -------------------------------------------------------
  // 7. Display Results
  // -------------------------------------------------------

  function displayResults(data) {
    const { predictions, disease_info, image_url, warning, engine, model_name } = data;
    const top = predictions[0];

    // Engine badge update
    const resultEngineBadge = document.getElementById('result-engine-badge');
    if (resultEngineBadge) {
      if (engine === 'gemini_vision') {
        resultEngineBadge.textContent = `✨ ${model_name || 'Gemini Vision AI'} (Universal)`;
        resultEngineBadge.className = 'engine-badge gemini';
      } else {
        resultEngineBadge.textContent = '⚡ Local Model (5 Crops)';
        resultEngineBadge.className = 'engine-badge';
      }
    }

    // Set image
    resultImage.src = image_url;
    resultImage.alt = `Analyzed leaf: ${top.disease_name}`;

    // Plant name and status badge handling
    if (engine === 'local_cnn' && (data.is_uncertain || conf < 50)) {
      resultPlantName.textContent = `Plant: Untrained Leaf (e.g. Paddy / Rice / Wheat)`;
      resultStatusBadge.textContent = 'Uncertain (कम सटीकता)';
      resultStatusBadge.className = 'status-badge warning';
      resultDiseaseName.textContent = `Nearest visual match: ${top.plant_name}`;
    } else {
      resultPlantName.textContent = `Plant: ${top.plant_name}`;
      resultStatusBadge.textContent = top.is_healthy ? 'Healthy' : 'Diseased';
      resultStatusBadge.className = `status-badge ${top.is_healthy ? 'healthy' : 'diseased'}`;
      resultDiseaseName.textContent = top.disease_name;
    }

    // Confidence bar (animate)
    const conf = top.confidence;
    resultConfidencePercent.textContent = `${conf.toFixed(1)}%`;
    resultConfidenceBar.style.width = '0%';
    resultConfidenceBar.className = 'confidence-fill';

    if (conf < 40) {
      resultConfidenceBar.classList.add('low');
    } else if (conf < 70) {
      resultConfidenceBar.classList.add('medium');
    }

    // Trigger the animation after a small delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resultConfidenceBar.style.width = `${conf}%`;
      });
    });

    // Top predictions list
    topPredictionsList.innerHTML = '';
    predictions.forEach((pred, index) => {
      const item = document.createElement('div');
      item.className = 'prediction-item';
      item.innerHTML = `
        <span class="prediction-rank">${index + 1}</span>
        <span class="prediction-name" title="${pred.plant_name} — ${pred.disease_name}">
          ${pred.plant_name} — ${pred.disease_name}
        </span>
        <div class="prediction-bar-track">
          <div class="prediction-bar-fill" style="width: 0%;"></div>
        </div>
        <span class="prediction-conf">${pred.confidence.toFixed(1)}%</span>
      `;
      topPredictionsList.appendChild(item);

      // Animate prediction bars
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const barFill = item.querySelector('.prediction-bar-fill');
          barFill.style.width = `${pred.confidence}%`;
        });
      });
    });

    // Disease info
    if (disease_info) {
      diseaseDescription.textContent = disease_info.description || 'No additional information available.';

      diseasePreventionList.innerHTML = '';
      if (disease_info.prevention && disease_info.prevention.length > 0) {
        disease_info.prevention.forEach(tip => {
          const li = document.createElement('li');
          li.textContent = tip;
          diseasePreventionList.appendChild(li);
        });
      }
    }

    // Show warning alert banner & toast if confidence is low
    const lowConfAlert = document.getElementById('low-confidence-alert');
    if (lowConfAlert) {
      if (warning || conf < 60) {
        const alertMsg = warning || `Low confidence (${conf.toFixed(1)}%). If this leaf is Paddy (Rice / धान), Wheat, or another unlisted crop, note that the model only knows 5 crops (Apple, Corn, Grape, Potato, Tomato). '${top.plant_name}' was selected only as the closest visual match.`;
        lowConfAlert.innerHTML = `
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>Notice / ध्यान दें:</strong> ${alertMsg}
            <div style="margin-top: 0.6rem;">
              <button type="button" class="btn btn-sm btn-primary" onclick="document.getElementById('gemini-key-btn').click()" style="padding: 0.35rem 0.9rem; font-size: 0.8rem; border-radius: var(--radius-pill); cursor: pointer;">
                ✨ Connect Free Gemini API Key for Exact Diagnosis
              </button>
            </div>
          </div>
        `;
        lowConfAlert.classList.remove('hidden');
      } else {
        lowConfAlert.classList.add('hidden');
      }
    }

    if (warning) {
      showToast(warning, 'warning');
    }

    // Show results section
    resultsSection.classList.remove('hidden');

    // Smooth scroll to results
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // -------------------------------------------------------
  // 8. Try Another Image
  // -------------------------------------------------------

  tryAnotherBtn.addEventListener('click', () => {
    resetUpload();
    resultsSection.classList.add('hidden');

    // Scroll to upload section
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  function resetUpload() {
    selectedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    previewArea.classList.add('hidden');
    dropZonePrompt.classList.remove('hidden');
    analyzeBtn.disabled = true;
  }

  // -------------------------------------------------------
  // 9. Toast Notifications
  // -------------------------------------------------------

  function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Auto-remove after animation finishes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  }
});