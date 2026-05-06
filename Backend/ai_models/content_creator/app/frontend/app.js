const form = document.getElementById('generatorForm');
const promptInput = document.getElementById('prompt');
const businessTypeInput = document.getElementById('business_type');
const useCaseInput = document.getElementById('use_case');
const styleInput = document.getElementById('style');
const modelInput = document.getElementById('model');
const useContentCreatorInput = document.getElementById('use_content_creator');
const filenamePreview = document.getElementById('filenamePreview');
const submitButton = document.getElementById('submitButton');
const sampleButton = document.getElementById('sampleButton');
const statusEl = document.getElementById('status');
const responseModel = document.getElementById('responseModel');
const responsePath = document.getElementById('responsePath');
const responseUrl = document.getElementById('responseUrl');
const generatedPromptEl = document.getElementById('generatedPrompt');
const generatedCaptionEl = document.getElementById('generatedCaption');
const payloadPreview = document.getElementById('payloadPreview');
const previewImage = document.getElementById('previewImage');
const previewFrame = document.getElementById('previewFrame');
const previewPlaceholder = document.querySelector('.preview-placeholder');

const sample = {
  prompt: 'luxury salon promotion with warm light and glossy finish',
  business_type: 'salon',
  use_case: 'poster',
  style: 'premium',
  model: 'flux',
  use_content_creator: true,
};

function setStatus(message, variant) {
  statusEl.textContent = message;
  statusEl.className = `status status--${variant}`;
}

function updateFilenamePreview() {
  const business = businessTypeInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_') || 'image';
  filenamePreview.value = `${business}_timestamp.png`;
}

function updatePayloadPreview() {
  const payload = {
    prompt: promptInput.value,
    business_type: businessTypeInput.value,
    use_case: useCaseInput.value,
    style: styleInput.value,
    model: modelInput.value,
    use_content_creator: useContentCreatorInput.checked,
  };
  payloadPreview.textContent = JSON.stringify(payload, null, 2);
}

function syncUi() {
  updateFilenamePreview();
  updatePayloadPreview();
}

function loadSample() {
  promptInput.value = sample.prompt;
  businessTypeInput.value = sample.business_type;
  useCaseInput.value = sample.use_case;
  styleInput.value = sample.style;
  modelInput.value = sample.model;
  useContentCreatorInput.checked = sample.use_content_creator;
  syncUi();
  setStatus('Sample loaded', 'idle');
}

async function generateImage(event) {
  event.preventDefault();

  const payload = {
    prompt: promptInput.value.trim(),
    business_type: businessTypeInput.value.trim(),
    use_case: useCaseInput.value,
    style: styleInput.value,
    model: modelInput.value,
    use_content_creator: useContentCreatorInput.checked,
  };

  submitButton.disabled = true;
  setStatus('Generating image...', 'loading');
  responseModel.textContent = '-';
  responsePath.textContent = 'Waiting for response...';
  responseUrl.textContent = 'Waiting for response...';
  generatedPromptEl.textContent = '-';
  generatedCaptionEl.textContent = '-';
  previewImage.hidden = true;
  previewPlaceholder.hidden = false;
  payloadPreview.textContent = JSON.stringify(payload, null, 2);
  setStatus('Sending brief to Mistral first...', 'loading');

  try {
    const response = await fetch('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Image generation failed');
    }

    responseModel.textContent = data.model_used;
    responsePath.textContent = data.image_path;
    responseUrl.textContent = data.image_url;
    generatedPromptEl.textContent = data.generated_prompt || '(content creator disabled or unavailable)';
    generatedCaptionEl.textContent = data.generated_caption || '(content creator disabled or unavailable)';
    previewImage.src = data.image_url;
    previewImage.hidden = false;
    previewPlaceholder.hidden = true;
    setStatus('Image generated successfully', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

form.addEventListener('submit', generateImage);
sampleButton.addEventListener('click', loadSample);
[promptInput, businessTypeInput, useCaseInput, styleInput, modelInput].forEach((element) => {
  element.addEventListener('input', syncUi);
  element.addEventListener('change', syncUi);
});
useContentCreatorInput.addEventListener('change', syncUi);

syncUi();
