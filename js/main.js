// Flyer flip functionality
const flyer = document.querySelector('.flyer');
const scene = document.querySelector('.scene');

flyer.addEventListener('click', (e) => {
  // Don't flip if we're in edit mode
  if (document.body.classList.contains('edit-mode')) {
    return;
  }
  
  flyer.classList.toggle('flipped');
});

// 3D tilt effect on mouse move
scene.addEventListener('mousemove', (e) => {
  // Don't apply tilt effect in edit mode
  if (document.body.classList.contains('edit-mode')) {
    return;
  }
  
  const { left, top, width, height } = scene.getBoundingClientRect();
  const x = (e.clientX - left) / width;
  const y = (e.clientY - top) / height;
  
  const tiltX = (y - 0.5) * 20; // Tilt up/down
  const tiltY = (0.5 - x) * 20; // Tilt left/right
  
  if (!flyer.classList.contains('flipped')) {
    flyer.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  } else {
    flyer.style.transform = `rotateX(${tiltX}deg) rotateY(${180 + tiltY}deg)`;
  }
});

// Reset transform when mouse leaves
scene.addEventListener('mouseleave', () => {
  if (document.body.classList.contains('edit-mode')) {
    return;
  }
  
  if (!flyer.classList.contains('flipped')) {
    flyer.style.transform = 'rotateX(0) rotateY(0)';
  } else {
    flyer.style.transform = 'rotateY(180deg)';
  }
});

// Theme selector functionality
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const primary = btn.getAttribute('data-primary');
    const secondary = btn.getAttribute('data-secondary');
    const accent = btn.getAttribute('data-accent');
    
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--secondary', secondary);
    document.documentElement.style.setProperty('--accent', accent);
  });
});

// Layout selector functionality
const layoutButtons = document.querySelectorAll('.layout-btn');
const layoutTemplates = {
  1: null, // Default layout is already in the DOM
  2: document.querySelector('.layout-2-template'),
  3: document.querySelector('.layout-3-template'),
  4: document.querySelector('.layout-4-template')
};

// Store the current content for each layout
const layoutContents = {
  1: { images: [] },
  2: { images: [] },
  3: { images: [] },
  4: { images: [] }
};

// Initialize with the content from layout 1
const editableElements = document.querySelectorAll('[contenteditable]');
editableElements.forEach(el => {
  const content = el.innerHTML;
  const className = el.className;
  
  // Store for all layouts
  for (let i = 1; i <= 4; i++) {
    if (!layoutContents[i][className]) {
      layoutContents[i][className] = content;
    }
  }
});

layoutButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons
    layoutButtons.forEach(b => b.classList.remove('active'));
    // Add active class to clicked button
    btn.classList.add('active');
    
    const layoutNumber = btn.getAttribute('data-layout');
    
    // Save current content if we're switching layouts
    if (flyer.classList.contains(`layout-${layoutNumber}`)) {
      return; // Already on this layout
    }
    
    // Save current content
    const currentLayout = Array.from(flyer.classList)
      .find(cls => cls.startsWith('layout-'))
      ?.replace('layout-', '') || '1';
      
    // Save text content
    editableElements.forEach(el => {
      const className = el.className;
      layoutContents[currentLayout][className] = el.innerHTML;
      
      // Save style attributes
      layoutContents[currentLayout][`${className}_style`] = el.style.cssText;
    });
    
    // Save images
    const currentImages = document.querySelectorAll('.custom-image');
    layoutContents[currentLayout].images = Array.from(currentImages).map(img => {
      return {
        src: img.src,
        style: img.style.cssText,
        zIndex: img.style.zIndex || 10
      };
    });
    
    // Remove current images
    currentImages.forEach(img => {
      const controls = img.nextElementSibling;
      if (controls && controls.classList.contains('image-controls')) {
        controls.remove();
      }
      img.remove();
    });
    
    // Remove all layout classes
    flyer.classList.remove('layout-1', 'layout-2', 'layout-3', 'layout-4');
    // Add the selected layout class
    flyer.classList.add(`layout-${layoutNumber}`);
    
    // If we have a template for this layout, use it
    if (layoutNumber !== '1' && layoutTemplates[layoutNumber]) {
      // Clone the template
      const template = layoutTemplates[layoutNumber].cloneNode(true);
      template.style.display = 'flex';
      template.classList.remove(`layout-${layoutNumber}-template`);
      
      // Replace the current front face
      const currentFront = document.querySelector('.flyer-front:not([style*="display: none"])');
      if (currentFront) {
        flyer.replaceChild(template, currentFront);
      }
      
      // Update the editable elements reference
      const newEditableElements = document.querySelectorAll('[contenteditable]');
      newEditableElements.forEach(el => {
        const className = el.className;
        if (layoutContents[layoutNumber][className]) {
          el.innerHTML = layoutContents[layoutNumber][className];
        }
        
        // Restore style attributes
        if (layoutContents[layoutNumber][`${className}_style`]) {
          el.style.cssText = layoutContents[layoutNumber][`${className}_style`];
        }
      });
    }
    
    // Restore images for this layout
    const flyerFront = document.querySelector('.flyer-front:not([style*="display: none"])');
    if (layoutContents[layoutNumber].images && layoutContents[layoutNumber].images.length > 0) {
      layoutContents[layoutNumber].images.forEach(imgData => {
        addImageToFlyer(imgData.src, flyerFront, imgData.style, imgData.zIndex);
      });
    }
  });
});

// Orientation selector functionality
const orientationButtons = document.querySelectorAll('.orientation-btn');
orientationButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons
    orientationButtons.forEach(b => b.classList.remove('active'));
    // Add active class to clicked button
    btn.classList.add('active');
    
    const orientation = btn.getAttribute('data-orientation');
    
    // Remove all orientation classes
    scene.classList.remove('portrait', 'landscape', 'square');
    // Add the selected orientation class
    scene.classList.add(orientation);
  });
});

// Font selector functionality
const fontSelector = document.getElementById('font-family');
const fontSizeInput = document.getElementById('font-size');
const fontWeightSelect = document.getElementById('font-weight');
let currentEditElement = null;

// Listen for focus on editable elements
document.addEventListener('focusin', (e) => {
  if (e.target.hasAttribute('contenteditable') && 
      e.target.getAttribute('contenteditable') === 'true') {
    currentEditElement = e.target;
    
    // Reset the font selector to match the current element
    const fontClass = Array.from(currentEditElement.classList)
      .find(cls => cls.startsWith('font-')) || 'font-sans-serif';
    
    fontSelector.value = fontClass;
    
    // Reset the color picker to match the current element
    const textColor = window.getComputedStyle(currentEditElement).color;
    document.getElementById('text-color').value = rgbToHex(textColor);
    
    // Reset font size input
    const fontSize = parseInt(window.getComputedStyle(currentEditElement).fontSize);
    fontSizeInput.value = fontSize;
    
    // Reset font weight select
    const fontWeight = window.getComputedStyle(currentEditElement).fontWeight;
    fontWeightSelect.value = fontWeight;
  }
});

// Font change handler
fontSelector.addEventListener('change', () => {
  const selectedFont = fontSelector.value;
  
  if (currentEditElement) {
    // Remove any existing font classes
    currentEditElement.classList.remove(
      'font-sans-serif', 
      'font-serif', 
      'font-monospace', 
      'font-display', 
      'font-handwriting'
    );
    
    // Add the selected font class
    currentEditElement.classList.add(selectedFont);
  }
});

// Text color change handler
const colorPicker = document.getElementById('text-color');
colorPicker.addEventListener('input', () => {
  if (currentEditElement) {
    currentEditElement.style.color = colorPicker.value;
  }
});

// Font size change handler
fontSizeInput.addEventListener('input', () => {
  if (currentEditElement) {
    currentEditElement.style.fontSize = `${fontSizeInput.value}px`;
  }
});

// Font weight change handler
fontWeightSelect.addEventListener('change', () => {
  if (currentEditElement) {
    currentEditElement.style.fontWeight = fontWeightSelect.value;
  }
});

// Convert RGB to HEX for color picker
function rgbToHex(rgb) {
  // Default to white if no color is set
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
  
  // Handle rgb/rgba format
  const rgbMatch = rgb.match(/^rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+\.\d+)?$$$/);
  if (rgbMatch) {
    return '#' + 
      ('0' + parseInt(rgbMatch[1], 10).toString(16)).slice(-2) +
      ('0' + parseInt(rgbMatch[2], 10).toString(16)).slice(-2) +
      ('0' + parseInt(rgbMatch[3], 10).toString(16)).slice(-2);
  }
  
  return rgb;
}

// Image upload functionality
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-image-btn');

uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      const flyerFront = document.querySelector('.flyer-front:not([style*="display: none"])');
      addImageToFlyer(event.target.result, flyerFront);
    };
    
    reader.readAsDataURL(e.target.files[0]);
  }
});

// Function to add image to flyer
function addImageToFlyer(src, container, style = '', zIndex = 10) {
  // Create image element
  const img = document.createElement('img');
  img.src = src;
  img.className = 'custom-image';
  img.style.zIndex = zIndex;
  
  if (style) {
    img.style.cssText = style;
  } else {
    // Default position in the center
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transform = 'translate(-50%, -50%)';
  }
  
  // Create image controls
  const controls = document.createElement('div');
  controls.className = 'image-controls';
  controls.style.top = img.style.top;
  controls.style.left = img.style.left;
  
  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-control-btn';
  deleteBtn.innerHTML = '❌';
  deleteBtn.title = 'Delete Image';
  deleteBtn.addEventListener('click', () => {
    controls.remove();
    img.remove();
  });
  
  // Forward button
  const forwardBtn = document.createElement('button');
  forwardBtn.className = 'image-control-btn';
  forwardBtn.innerHTML = '↑';
  forwardBtn.title = 'Bring Forward';
  forwardBtn.addEventListener('click', () => {
    const currentZ = parseInt(img.style.zIndex) || 10;
    img.style.zIndex = currentZ + 1;
  });
  
  // Backward button
  const backwardBtn = document.createElement('button');
  backwardBtn.className = 'image-control-btn';
  backwardBtn.innerHTML = '↓';
  backwardBtn.title = 'Send Backward';
  backwardBtn.addEventListener('click', () => {
    const currentZ = parseInt(img.style.zIndex) || 10;
    if (currentZ > 1) {
      img.style.zIndex = currentZ - 1;
    }
  });
  
  // Add buttons to controls
  controls.appendChild(deleteBtn);
  controls.appendChild(forwardBtn);
  controls.appendChild(backwardBtn);
  
  // Make image draggable
  img.addEventListener('mousedown', startDrag);
  
  // Add image and controls to container
  container.appendChild(img);
  container.appendChild(controls);
  
  // Update controls position when image moves
  function updateControlsPosition() {
    const rect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    controls.style.top = (rect.top - containerRect.top + rect.height) + 'px';
    controls.style.left = (rect.left - containerRect.left) + 'px';
  }
  
  // Drag functionality
  function startDrag(e) {
    e.preventDefault();
    
    // Only allow dragging in edit mode
    if (!document.body.classList.contains('edit-mode')) {
      return;
    }
    
    const rect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calculate offset from mouse position to image corner
    const offsetX = e.clientX - imgRect.left;
    const offsetY = e.clientY - imgRect.top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    function drag(e) {
      // Calculate new position relative to container
      const x = e.clientX - rect.left - offsetX;
      const y = e.clientY - rect.top - offsetY;
      
      // Apply new position
      img.style.left = x + 'px';
      img.style.top = y + 'px';
      img.style.transform = 'none'; // Remove any transform
      
      // Update controls position
      updateControlsPosition();
    }
    
    function stopDrag() {
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
  }
  
  // Initial positioning of controls
  setTimeout(updateControlsPosition, 100);
}

// Z-index control buttons
const bringForwardBtn = document.getElementById('bring-forward-btn');
const sendBackwardBtn = document.getElementById('send-backward-btn');

bringForwardBtn.addEventListener('click', () => {
  const selectedImage = document.querySelector('.custom-image:hover');
  if (selectedImage) {
    const currentZ = parseInt(selectedImage.style.zIndex) || 10;
    selectedImage.style.zIndex = currentZ + 1;
  }
});

sendBackwardBtn.addEventListener('click', () => {
  const selectedImage = document.querySelector('.custom-image:hover');
  if (selectedImage) {
    const currentZ = parseInt(selectedImage.style.zIndex) || 10;
    if (currentZ > 1) {
      selectedImage.style.zIndex = currentZ - 1;
    }
  }
});

// Edit mode toggle
const editButton = document.querySelector('.edit-btn');

editButton.addEventListener('click', () => {
  const isEditMode = document.body.classList.toggle('edit-mode');
  editButton.classList.toggle('active');
  
  // Get all editable elements (they might have changed due to layout switch)
  const allEditableElements = document.querySelectorAll('[contenteditable]');
  
  if (isEditMode) {
    editButton.textContent = 'Exit Edit Mode';
    // Enable contenteditable
    allEditableElements.forEach(el => {
      el.setAttribute('contenteditable', 'true');
    });
    
    // Reset transform when entering edit mode
    if (!flyer.classList.contains('flipped')) {
      flyer.style.transform = 'rotateX(0) rotateY(0)';
    }
  } else {
    editButton.textContent = 'Edit Text';
    // Disable contenteditable
    allEditableElements.forEach(el => {
      el.setAttribute('contenteditable', 'false');
    });
    
    // Save content for current layout
    const currentLayout = Array.from(flyer.classList)
      .find(cls => cls.startsWith('layout-'))
      ?.replace('layout-', '') || '1';
      
    allEditableElements.forEach(el => {
      const className = el.className;
      layoutContents[currentLayout][className] = el.innerHTML;
      
      // Save style attributes
      layoutContents[currentLayout][`${className}_style`] = el.style.cssText;
    });
    
    // Save images
    const currentImages = document.querySelectorAll('.custom-image');
    layoutContents[currentLayout].images = Array.from(currentImages).map(img => {
      return {
        src: img.src,
        style: img.style.cssText,
        zIndex: img.style.zIndex || 10
      };
    });
  }
});

// Export functionality
const exportJpgBtn = document.querySelector('.export-jpg-btn');
const exportPngBtn = document.querySelector('.export-png-btn');
const shareBtn = document.querySelector('.share-btn');
const toast = document.getElementById('toast');

// Export as JPG
exportJpgBtn.addEventListener('click', () => {
  exportFlyer('jpg');
});

// Export as PNG
exportPngBtn.addEventListener('click', () => {
  exportFlyer('png');
});

// Share functionality
shareBtn.addEventListener('click', () => {
  // For demo purposes, we'll just copy a dummy link
  const dummyLink = "https://example.com/flyer/share/12345";
  
  // Copy to clipboard
  navigator.clipboard.writeText(dummyLink).then(() => {
    // Show toast notification
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  });
});

// Function to export flyer
function exportFlyer(format) {
  // Make sure we're showing the front face
  if (flyer.classList.contains('flipped')) {
    flyer.classList.remove('flipped');
  }
  
  // Temporarily hide flip instruction
  const flipInstruction = document.querySelector('.flip-instruction');
  flipInstruction.style.display = 'none';
  
  // Use html2canvas to capture the flyer
  html2canvas(document.querySelector('.flyer-front'), {
    backgroundColor: null,
    scale: 2, // Higher quality
    logging: false
  }).then(canvas => {
    // Convert canvas to data URL
    let dataURL;
    if (format === 'jpg') {
      dataURL = canvas.toDataURL('image/jpeg', 0.9);
    } else {
      dataURL = canvas.toDataURL('image/png');
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `flyer.${format}`;
    link.click();
    
    // Restore flip instruction
    flipInstruction.style.display = 'block';
  });
}

// Add touch support for mobile devices
let touchStartX = 0;
let touchEndX = 0;

flyer.addEventListener('touchstart', (e) => {
  // Don't handle touch events in edit mode
  if (document.body.classList.contains('edit-mode')) {
    return;
  }
  
  touchStartX = e.changedTouches[0].screenX;
});

flyer.addEventListener('touchend', (e) => {
  // Don't handle touch events in edit mode
  if (document.body.classList.contains('edit-mode')) {
    return;
  }
  
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  if (touchEndX < touchStartX - swipeThreshold) {
    // Swipe left
    if (!flyer.classList.contains('flipped')) {
      flyer.classList.add('flipped');
    }
  }
  
  if (touchEndX > touchStartX + swipeThreshold) {
    // Swipe right
    if (flyer.classList.contains('flipped')) {
      flyer.classList.remove('flipped');
    }
  }
}

// Add some random floating elements for more 3D effect
function createFloatingElements() {
  const flyerFront = document.querySelector('.flyer-front');
  const colors = ['var(--accent)', 'var(--primary)', 'var(--secondary)'];
  const shapes = ['50%', '10px'];
  
  for (let i = 0; i < 5; i++) {
    const element = document.createElement('div');
    element.classList.add('floating-element');
    
    const size = Math.random() * 20 + 10;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.background = color;
    element.style.borderRadius = shape;
    element.style.top = `${Math.random() * 80 + 10}%`;
    element.style.left = `${Math.random() * 80 + 10}%`;
    element.style.transform = `translateZ(${Math.random() * 50 + 10}px)`;
    element.style.animationDelay = `${Math.random() * 2}s`;
    
    flyerFront.appendChild(element);
  }
}

createFloatingElements();

// Import html2canvas
// import html2canvas from 'html2canvas';