<?php
$paintImagePath = "paintImage.png";

function initImage() {
	if(!is_file($GLOBALS['paintImagePath'])) {
		$image = imagecreate(16,16);
		$background_color = imagecolorallocate($image, 255, 255, 255);
		
		imagefilledrectangle($image, 0, 0, 16, 16, $background_color);
		
		imagepng($image, $GLOBALS['paintImagePath'], 9);
		
		imagedestroy($image);
	}
}
//IF IMAGE NOT FOUND CREATES PAINT IMAGE
initImage();

function getImage() {
	$imagedata = file_get_contents($GLOBALS['paintImagePath']);
	echo base64_encode($imagedata); 
}

function setPixel($x, $y, $color) {
	$rgbColor = explode(" ", $color);
	
	$image = imagecreatefrompng($GLOBALS['paintImagePath']);
	$tileColor = imagecolorallocate($image, $rgbColor[0], $rgbColor[1], $rgbColor[2]);
	
	imagesetpixel($image, $x, $y, $tileColor);
	
	imagepng($image, $GLOBALS['paintImagePath'], 9);
	
	imagedestroy($image);
	echo "success";
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
	if($_POST["Action"] == "getImage") {
		getImage();
	} else if($_POST["Action"] == "setTile") {
		$x = $_POST["x"];
		$y = $_POST["y"];
		$color = $_POST["color"];
		setPixel($x, $y, $color);
	}
}


?>

