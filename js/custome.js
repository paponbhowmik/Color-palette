        // Theme switcher
        const toggleSwitch = document.querySelector('#checkbox');
        
        function switchTheme(e) {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        }
        
        toggleSwitch.addEventListener('change', switchTheme, false);
        
        // Check for saved theme preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            toggleSwitch.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        // Process image function with loading animation
        async function processImage() {
            const fileInput = document.getElementById('formFile');
            const file = fileInput.files[0];
            const generateBtn = document.querySelector('.all-button');
            
            if (!file) {
                alert('Please select an image file first.');
                return;
            }
            
            // Show loading animation
            generateBtn.classList.add('loading');
            
            // Use setTimeout to allow UI to update before heavy processing
            setTimeout(async () => {
                try {
                    const colors = await loadImageAndExtractColors(file);
                    displayResults(colors.solidColors, colors.gradients);
                } catch (error) {
                    console.error("Error processing image:", error);
                    alert("Error processing image. Please try another file.");
                } finally {
                    // Hide loading animation
                    generateBtn.classList.remove('loading');
                }
            }, 100);
        }
        
        function loadImageAndExtractColors(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        const colors = extractColors(img);
                        resolve(colors);
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        
        function extractColors(img) {
            // Create canvas to analyze image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 150; // Optimal size for performance
            canvas.height = 150;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Get pixel data
            const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            
            // Analyze colors
            const colorMap = {};
            const gradientRegions = [];
            
            // First pass: identify all colors
            for (let i = 0; i < pixelData.length; i += 4) {
                const r = pixelData[i];
                const g = pixelData[i + 1];
                const b = pixelData[i + 2];
                const a = pixelData[i + 3];
                
                if (a < 128) continue; // Skip transparent pixels
                
                const colorKey = `${r},${g},${b}`;
                colorMap[colorKey] = colorMap[colorKey] ? colorMap[colorKey] + 1 : 1;
            }
            
            // Convert color map to array and sort by frequency
            const solidColors = Object.entries(colorMap)
                .map(([key, count]) => {
                    const [r, g, b] = key.split(',').map(Number);
                    return { r, g, b, count };
                })
                .sort((a, b) => b.count - a.count);
            
            // Simple gradient detection (for demo purposes)
            // In a real app, you'd implement more sophisticated detection
            const gradients = [];
            if (solidColors.length >= 2) {
                // Just pair the top colors as gradients for demonstration
                for (let i = 0; i < Math.min(4, solidColors.length / 2); i++) {
                    const color1 = solidColors[i * 2];
                    const color2 = solidColors[i * 2 + 1];
                    gradients.push({
                        color1,
                        color2,
                        size: color1.count + color2.count
                    });
                }
            }
            
            return {
                solidColors,
                gradients
            };
        }
        
        function displayResults(colors, gradients) {
            const colorPalette = document.getElementById('colorPalette');
            const gradientPalette = document.getElementById('gradientPalette');
            const resultsDiv = document.getElementById('colorResults');
            
            colorPalette.innerHTML = '';
            gradientPalette.innerHTML = '';
            
            // Display solid colors (top 12)
            colors.slice(0, 12).forEach(color => {
                const hex = rgbToHex(color.r, color.g, color.b);
                const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
                const colorElement = document.createElement('div');
                colorElement.className = 'col-md-3 col-6 mb-3';
                colorElement.innerHTML = `
                    <div class="color-box" style="background-color: ${hex};"></div>
                    <div class="color-info text-center">
                        <span class="color-code" title="HEX">${hex}</span>
                        <span class="color-code" title="RGB">${rgb}</span>
                    </div>
                `;
                colorPalette.appendChild(colorElement);
            });
            
            // Display gradient colors (top 4)
            if (gradients.length > 0) {
                gradients.slice(0, 4).forEach(gradient => {
                    const hex1 = rgbToHex(gradient.color1.r, gradient.color1.g, gradient.color1.b);
                    const hex2 = rgbToHex(gradient.color2.r, gradient.color2.g, gradient.color2.b);
                    const rgb1 = `rgb(${gradient.color1.r}, ${gradient.color1.g}, ${gradient.color1.b})`;
                    const rgb2 = `rgb(${gradient.color2.r}, ${gradient.color2.g}, ${gradient.color2.b})`;
                    
                    const gradientElement = document.createElement('div');
                    gradientElement.className = 'col-md-6 col-12 mb-3';
                    gradientElement.innerHTML = `
                        <div class="gradient-box" style="background: linear-gradient(to right, ${hex1}, ${hex2});"></div>
                        <div class="color-info text-center">
                            <div>
                                <span class="color-code" title="HEX">${hex1}</span>
                                <span class="color-code" title="RGB">${rgb1}</span>
                            </div>
                            <div>
                                <span class="color-code" title="HEX">${hex2}</span>
                                <span class="color-code" title="RGB">${rgb2}</span>
                            </div>
                        </div>
                    `;
                    gradientPalette.appendChild(gradientElement);
                });
            } else {
                gradientPalette.innerHTML = '<p>No significant gradients detected.</p>';
            }
            
            resultsDiv.style.display = 'block';
        }
        
        function rgbToHex(r, g, b) {
            return '#' + [r, g, b].map(x => {
                const hex = x.toString(16).padStart(2, '0');
                return hex;
            }).join('');
        }