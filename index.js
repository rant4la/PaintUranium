var tileSize = 32;
var tilesX = 16;
var tilesY = 16;

var mouseX;
var mouseY;

var paintColor;

var targetFps = 30;
var frameTimer;

var mouseTimer;
var mouseUpdatesPerSecond = 30;

function load() {
	updateColorPicker();
	$.post("index.php", "Action=getImage", loadImage); 
	
	frameTimer = setInterval(updatePage, 1000 / targetFps);
}

function updatePage() {
	$.post("index.php", "Action=getImage", loadImage); 
}

function loadImage(imageData) {
	
	var paintImage = new Image();
	paintImage.src = 'data:image/png;base64,' + imageData;
	
	paintImage.onload = function() {
		
		
		
	
		var tempCanvas = document.getElementById('tempCanvas');
		var imageContext = tempCanvas.getContext('2d');
		tempCanvas.width = paintImage.width;
		tempCanvas.height = paintImage.height;
		imageContext.drawImage(paintImage, 0, 0 );

		var canvas = document.getElementById("paintCanvas");
		var canvasContext = canvas.getContext("2d");

		for(y = 0; y < tilesY; y++) {
			for(x = 0; x < tilesX; x++) {
				var tileRed = imageContext.getImageData(x, y, 1, 1).data[0];
				var tileGreen = imageContext.getImageData(x, y, 1, 1).data[1];
				var tileBlue = imageContext.getImageData(x, y, 1, 1).data[2];
				canvasContext.fillStyle = rgb(tileRed, tileGreen, tileBlue);

				canvasContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
			}
		}
	
	}
	
}



function setTile(locX, locY) {
	var canvas = document.getElementById("paintCanvas");
	var context = canvas.getContext("2d");
	
	for(y = 0; y < tilesY; y++) {
		for(x = 0; x < tilesX; x++) {
			if(locX >= x * tileSize && locX <= x * tileSize + tileSize && locY >= y * tileSize && locY <= y * tileSize + tileSize) {
				
				console.log(x + " " + y);
				
				//ADDS THE TILE TO THE SERVERS DATABASE			
				$.ajax({
					type: "POST",
					url: "index.php",
					data: {Action: "setTile", x: x, y: y, color: redSlider.value + " " + greenSlider.value + " " + blueSlider.value},
					datatype: "html",
					success: function(result) {
						//$.post("index.php", "Action=getImage", loadImage); 
					}
					
					
				});
				
				return true;
			}
		}
	}
	return false;
}



function updateColorPicker() {
	var redSlider = document.getElementById("redSlider");
	var blueSlider = document.getElementById("blueSlider");
	var greenSlider = document.getElementById("greenSlider");

	paintColor = rgb(redSlider.value, greenSlider.value, blueSlider.value);
	
	redSlider.style.backgroundColor = rgb(redSlider.value, 0, 0);
	blueSlider.style.backgroundColor = rgb(0, blueSlider.value, 0);
	greenSlider.style.backgroundColor = rgb(0, 0, greenSlider.value);

	var colorPreview = document.getElementById("colorPreview");
	var context = colorPreview.getContext("2d");
	
	context.fillStyle = paintColor;
	context.fillRect(0, 0, colorPreview.width, colorPreview.height);
}

function rgb(r, g, b){
	return "rgb("+r+","+g+","+b+")";
}

function mouseUpdateTimer() {
	updateColorPicker();
	
	$.post("index.php", "Action=getImage", loadImage); 
	setTile(mouseX, mouseY);
}

function MouseDown(event) {
	mouseTimer = setInterval(mouseUpdateTimer, 1000 / mouseUpdatesPerSecond);
}

function MouseUp(event) {
	clearInterval(mouseTimer);
}

function updateMouse(event) {
	var canvas = document.getElementById("paintCanvas");
	mouseX = event.clientX - canvas.offsetLeft;
	mouseY = event.clientY - canvas.offsetTop;
}

document.addEventListener("mousedown", MouseDown);
document.addEventListener("mousemove", updateMouse);
document.addEventListener("mouseup", MouseUp);
