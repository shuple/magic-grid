window.addEventListener('load', function () {
  const elementIds = [
    'grid-container', 'grid-file-drop', 'grid-canvas',
    'grid-range', 'alpha-range',
    'grid-value', 'alpha-value',
    'file-upload'
  ];
  const elements = {}
  for (const id of elementIds)
    elements[id] = document.getElementById(id);

  // display slider value in real-time
  for (const element of [ 'grid', 'alpha' ]) {
    const slider = elements[`${element}-range`];
    slider.addEventListener('input', function() {
      elements[`${element}-value`].innerText = this.value;
    });
  }

  document.querySelectorAll('.file-drop').forEach(function(element) {
    toggleFileDrop(element);

    // emulate file upload click
    element.addEventListener('click', function(event) {
      elements['file-upload'].click();
    });
  });

  function toggleFileDrop(element) {
    element.addEventListener('dragover', function(event) {
      event.preventDefault();
      element.classList.add('dragover');
    });

    element.addEventListener('dragenter', function(event) {
      event.preventDefault();
      element.classList.add('dragover');
    });

    element.addEventListener('dragleave', function(event) {
      event.preventDefault();
      element.classList.remove('dragover');
    });

    element.addEventListener('drop', function(event) {
      event.preventDefault();
      element.classList.remove('dragover');
      const file = event.dataTransfer.files[0];
      if (/^image\//.test(file.type)) {
        const reader = new FileReader();
        reader.onload = () => {
          const blob = new Blob([reader.result], { type: file.type });
          const url = URL.createObjectURL(blob);
          const image = new Image();
          image.src = url;
          drawCanvas(image);
        }
        reader.readAsArrayBuffer(file);
      }
    });
  }

  elements['file-upload'].addEventListener('change', function(event) {
    if (event.target.files.length) {
      const file = event.target.files[0];
      if (/^image\//.test(file.type)) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const image = new Image();
          image.src = event.target.result;
          drawCanvas(image);
        }
        reader.readAsDataURL(file);
      }
    }
  });

  const [ canvas, context ] = [ {}, {} ];
  document.querySelectorAll('canvas').forEach(element => {
    canvas[element.id] = element;
    context[element.id] = canvas[element.id].getContext('2d');
  });

  // draw binary image on canvas
  function drawCanvas(image) {
    image.onload = function() {
      resizeCanvas(...canvasSize(image));

      // draw layer0
      const [ width, height ] = imageSize(canvas['layer0'], image);
      drawImage(context['layer0'], image, width, height,
        parseFloat(elements['alpha-range'].value));
      changeAlpha(context['layer0'], image, width, height);

      // draw layer1
      drawGrid(context['layer1'],
        parseInt(elements['grid-range'].value));
      changeGrid(context['layer1'], image, width, height);

      elements['grid-file-drop'].style.display = 'none';
      elements['grid-canvas'].style.display = 'block';
    }
  }

  // return canvas width, height that fits the element
  function canvasSize(image) {
    const gridContainer = elements['grid-container'];
    const gridGap = parseInt(getComputedStyle(gridContainer).getPropertyValue('grid-gap'));
    const [ MAX_WIDTH, MAX_HEIGHT ] = [ gridContainer.offsetWidth - gridGap, 1000 ];

    // calculate canvas dimensions to preserve aspect ratio
    let [ width, height ] = [ image.width, image.height ];

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = width / height;
      if (width > MAX_WIDTH && height > MAX_HEIGHT) {
        if (width / MAX_WIDTH > height / MAX_HEIGHT) {
          width = MAX_WIDTH;
          height = width / ratio;
        } else {
          height = MAX_HEIGHT;
          width = height * ratio;
        }
      } else if (width > MAX_WIDTH) {
        width = MAX_WIDTH;
        height = width / ratio;
      } else {
        height = MAX_HEIGHT;
        width = height * ratio;
      }
    }

    return [ width, height ];
  }

  // return image width, height that fits the element
  function imageSize(image, canvas) {
    const [ canvasWidth, canvasHeight ] = [ canvas.width, canvas.height ];
    const [ imageWidth, imageHeight ] = [ image.width, image.height ];
    let [ width, height ] = [ imageWidth, imageHeight ];

    // check if image needs to be resized
    if (imageWidth > canvasWidth) {
      width = canvasWidth;
      height = (imageHeight / imageWidth) * width;
    }

    if (height > canvasHeight) {
      height = canvasHeight;
      width = (imageWidth / imageHeight) * height;
    }

    return [ width, height ];
  }

  function resizeCanvas(width, height) {
    [ ...[elements['grid-canvas']], ...Object.values(canvas)].forEach((object) => {
      if (object instanceof HTMLCanvasElement) {
        object.width = width;
        object.height = height;
      } else {
        object.style.width = `${width}px`;
        object.style.height = `${height}px`;
      }
    });
  }

  function drawImage(context, image, width, height, alpha) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.globalAlpha = parseFloat(alpha);
    context.drawImage(image, 0, 0, width, height);
  }

  function changeAlpha(context, image, width, height) {
    elements['alpha-range'].addEventListener('input', function() {
      drawImage(context, image, width, height, parseFloat(this.value));
    });
  }

  function drawGrid(context, gridSize) {
    const [ width, height ] = [ context.canvas.width, context.canvas.height ];
    context.strokeStyle = "#888";
    context.lineWidth = 1;
    context.clearRect(0, 0, width, height);

    // vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    // horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }

  function changeGrid(context, image, width, height) {
    elements['grid-range'].addEventListener('input', function() {
      drawGrid(context, parseInt(this.value));
    });
  }
});
