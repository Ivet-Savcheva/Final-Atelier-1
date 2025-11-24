/*
ML5 FaceMesh Detection - Multiple Points with Velocity (Phone Adapted)

This script uses ML5 FaceMesh with p5-phone for automatic coordinate mapping.
It tracks 5 face points: eyes, lips, and nose with velocity tracking.
Works on both phone and desktop with portrait orientation.

Key Variables:
- cam: PhoneCamera instance for video feed
- faceMesh: ML5 FaceMesh detection model
- faces: Array to store detected faces
- facePointIndex1-5: Indices of face points to track (two-variable method)
- facePointData1-5: Global variables storing face point data (two-variable method)
- distance1_2, angle1_2: Global measurement variables for eyes
- distance3_4, angle3_4: Global measurement variables for lips
- velocity5: Global velocity data for nose (x, y, speed)

Key Functions:
- setup(): Initializes canvas and PhoneCamera
- gotFaces(): Callback function when faces are detected
- showPoint(): Highlights a specific keypoint with given color and index
- getKeypoint(): Helper function to safely get keypoint data
- measureDistance(point1, point2): Calculates and shows distance between two points in pixels
- measureAngle(basePoint, endPoint): Calculates and shows angle from horizontal in degrees
- measureVelocity(current, previous): Calculates and shows velocity in x, y directions and speed

Common FaceMesh Keypoint Indices (468 points total):
Key landmarks:
1: Right eye inner corner
4: Nose tip
13: Upper lip center
14: Lower lip center
152: Chin
234: Left eye outer corner
454: Right eye outer corner

Example - Using the two-variable method with global measurements:
// Global variables are declared at top for indices, data, and measurements
// In draw(), data and measurements are automatically updated each frame:
facePointData1 = getKeypoint(facePointIndex1, 0);
distance1_2 = measureDistance(facePointData1, facePointData2);
angle1_2 = measureAngle(facePointData1, facePointData2);
velocity5 = measureVelocity(facePointData5, facePointData5Prev);

Controls:
- Touch screen: Toggle video visibility
- Change showData variable (true/false) to toggle measurement visualization
*/

// ==============================================
// GLOBAL VARIABLES
// ==============================================
let cam;                // PhoneCamera instance
let faceMesh;           // ML5 FaceMesh model
let faces = [];         // Detected faces
let showVideo = false;   // Toggle video display
let showData = false;    // Toggle measurement visualization (lines, arcs, text)

// Two-variable method: Define which points to track and store their data
let facePointData0 = { x: 0, y: 0 };  // Center reference point

let facePointIndex1 = 234;  // Left eye outer corner 
let facePointData1 = null;  // Stores mapped left eye data

let facePointIndex2 = 454;  // Right eye outer corner
let facePointData2 = null;  // Stores mapped right eye data

let facePointIndex3 = 13;   // Upper lip center
let facePointData3 = null;  // Stores mapped upper lip data

let facePointIndex4 = 14;   // Lower lip center
let facePointData4 = null;  // Stores mapped lower lip data

let facePointIndex5 = 4;    // Nose tip
let facePointData5 = null;  // Stores mapped nose data
let facePointData5Prev = null; // Previous frame data for velocity

// Global measurement variables
let distance1_2 = 0;  // Distance between eyes
let angle1_2 = 0;     // Angle between eyes
let distance3_4 = 0;  // Distance between lips
let angle3_4 = 0;     // Angle between lips
let angle5_0 = 0;     // Angle of nose and imaginare center point
let velocity5 = { x: 0, y: 0, speed: 0 }; // Nose velocity

let crtTVModel;
let crtTVIndex = 0;
let crtTVImages = [];
let crtTVNames = [];  // New array for flower names and synonyms
let pg;
let pgClosed;
let pgOpen;
let pgStarting;   // added graphic for "Starting camera..."
let pgShowFace;   // added graphic for "Show your face to start tracking"

let mouthOpen = false;
let mouthClose = false;
let mouthOpenTime = 0;
let mouthCloseTime = 0;

let myRec; // Speech recognition object

function preload() {
  crtTVModel = loadModel('kurty.obj', true);
  
  // Load array of flower images with corresponding names and synonyms
  crtTVImages.push(loadImage('daffodil.jpg'));
  crtTVNames.push(['daffodil', 'narcissus', 'jonquil']);
  
  crtTVImages.push(loadImage('daisy.jpg'));
  crtTVNames.push(['daisy', 'ox-eye', 'bellis']);
  
  crtTVImages.push(loadImage('forgetmenot.jpg'));
  crtTVNames.push(['forget me not', 'myosotis', 'mouse ear']);
  
  crtTVImages.push(loadImage('hibiscus.jpg'));
  crtTVNames.push(['hibiscus', 'rose of sharon', 'rosemallow']);
  
  crtTVImages.push(loadImage('iris.jpg'));
  crtTVNames.push(['iris', 'flag iris', 'sword lily']);
  
  crtTVImages.push(loadImage('jasmine.jpg'));
  crtTVNames.push(['jasmine', 'jessamine', 'carolina jasmine']);
  
  crtTVImages.push(loadImage('lavander.jpg'));
  crtTVNames.push(['lavender', 'lavandula', 'purple sage']);
  
  crtTVImages.push(loadImage('lilyofthevalley.jpg'));
  crtTVNames.push(['lily of the valley', 'convallaria', 'may lily']);
  
  crtTVImages.push(loadImage('lotus.jpg'));
  crtTVNames.push(['lotus', 'water lily', 'sacred lotus']);
  
  crtTVImages.push(loadImage('morningglory.jpg'));
  crtTVNames.push(['morning glory', 'ipomoea', 'bindweed']);
  
  crtTVImages.push(loadImage('orchid.jpg'));
  crtTVNames.push(['orchid', 'orchidaceae', 'phalaenopsis']);
  
  crtTVImages.push(loadImage('peony.jpg'));
  crtTVNames.push(['peony', 'paeonia', 'pioney']);
  
  crtTVImages.push(loadImage('poppy.jpg'));
  crtTVNames.push(['poppy', 'papaver', 'corn poppy']);
  
  crtTVImages.push(loadImage('rose.jpg'));
  crtTVNames.push(['rose', 'rosa', 'queen of flowers']);
  
  crtTVImages.push(loadImage('sunflower.jpg'));
  crtTVNames.push(['sunflower', 'helianthus', 'sun disk']);
  
  crtTVImages.push(loadImage('tulip.jpg'));
  crtTVNames.push(['tulip', 'tulipa', 'lady tulip']);
  
  crtTVImages.push(loadImage('violet.jpg'));
  crtTVNames.push(['violet', 'viola', 'sweet violet']);
  
  crtTVImages.push(loadImage('wisteria.jpg'));
  crtTVNames.push(['wisteria', 'wistaria', 'glycine']);

  pgOpen = createGraphics(400, 400); // 2D graphics buffer
  pgOpen.textSize(26);
  pgOpen.fill(0x56, 0x36, 0x5C); // Lilac shadow
  pgOpen.textAlign(CENTER, CENTER);
  pgOpen.text("Listening", pgOpen.width / 2, pgOpen.height / 2);

  pgClosed = createGraphics(400, 400); // 2D graphics buffer
  pgClosed.textSize(26);
  pgClosed.fill(0x56, 0x36, 0x5C); // Lilac shadow
  pgClosed.textAlign(CENTER, CENTER);
  pgClosed.text("Start speaking", pgClosed.width / 2, pgClosed.height / 2);

  // New graphics for status texts
  pgStarting = createGraphics(400, 400);
  pgStarting.textSize(26);
  pgStarting.fill(0x56, 0x36, 0x5C);
  pgStarting.textAlign(CENTER, CENTER);
  pgStarting.text("Starting camera...", pgStarting.width / 2, pgStarting.height / 2);

  pgShowFace = createGraphics(400, 400);
  pgShowFace.textSize(22);
  pgShowFace.fill(0x56, 0x36, 0x5C);
  pgShowFace.textAlign(CENTER, CENTER);
  pgShowFace.text("Show your face to start tracking", pgShowFace.width / 2, pgShowFace.height / 2);
}

// ==============================================
// SETUP - Runs once when page loads
// ==============================================
function setup() {
  // Create portrait canvas (typical phone proportions: 9:16)
  createCanvas(405, 720, WEBGL);
  lockGestures;  // Prevent phone gestures (zoom, refresh)
  
  // Create camera: front camera, mirrored, fit to canvas height
  cam = createPhoneCamera('user', true, 'fitHeight');
  
  // Enable camera tap to toggle video
  enableCameraTap();
  
  // Wait for camera to initialize, then create model and start detection
  cam.onReady(() => {
    // Configure ML5 FaceMesh AFTER camera is ready
    let options = {
      maxFaces: 1,           // Only detect 1 face
      refineLandmarks: false,// Skip detailed landmarks (faster)
      runtime: 'mediapipe',  // Use MediaPipe runtime
      flipHorizontal: false  // Don't flip in ML5 - cam.mapKeypoint() handles mirroring
    };
    
    // Create FaceMesh model and start detection when ready
    faceMesh = ml5.faceMesh(options, () => {
      faceMesh.detectStart(cam.videoElement, gotFaces);
    });
  });

  myRec = new p5.SpeechRec('en-US'); // new P5.SpeechRec object
  myRec.onResult = showResult; // assign callback function
}

// ==============================================
// DRAW - Runs continuously
// ==============================================
function draw() {
  background(255);
  
  // Display the video feed
  if (showVideo && cam.ready) {
    image(cam, 0, 0);  // PhoneCamera handles positioning and mirroring
  }
  
  // Update global point data and measure between the specified points
  if (faces.length > 0) {
    // Update global variables with current point data (index, face number)
    facePointData1 = getKeypoint(facePointIndex1, 0);
    facePointData2 = getKeypoint(facePointIndex2, 0);
    facePointData3 = getKeypoint(facePointIndex3, 0);
    facePointData4 = getKeypoint(facePointIndex4, 0);
    
    // Store previous nose position for velocity calculation
    facePointData5Prev = facePointData5;
    facePointData5 = getKeypoint(facePointIndex5, 0);
    
    // Calculate global measurements
    distance1_2 = measureDistance(facePointData1, facePointData2);
    angle1_2 = measureAngle(facePointData1, facePointData2);
    distance3_4 = measureDistance(facePointData3, facePointData4);
    angle3_4 = measureAngle(facePointData3, facePointData4);
    angle5_0 = measureAngle(facePointData5, facePointData0);
    //velocity5 = measureVelocity(facePointData5, facePointData5Prev);
    
    // Eyes: Check if both points are valid and display
    if (facePointData1 && facePointData2) {
      // Show the points in different colors
      //showPoint(facePointData1, color(255, 0, 0));  // Red
      //showPoint(facePointData2, color(0, 0, 255));  // Blue
    }
    
    // Lips: Check if both points are valid and display
    if (facePointData3 && facePointData4) {
      // Show the points in different colors
      showPoint(facePointData3, color(0, 255, 0));  // Green
      showPoint(facePointData4, color(255, 0, 255));  // Magenta
    }
    
    // Nose: Check if point is valid and display
    if (facePointData5) {
      // Show the nose point in yellow
      showPoint(facePointData5, color(255, 255, 0));  // Yellow
    }
  }
  
  // Draw UI
  drawUI();
}

// ==============================================
// CALLBACK - When faces are detected
// ==============================================
function gotFaces(results) {
  faces = results || [];
}

// ==============================================
// HELPER - Get keypoint with mapped coordinates
// ==============================================
// Function to get a specific keypoint with coordinate mapping
function getKeypoint(index, faceNumber = 0) {
  if (!faces || faces.length <= faceNumber) return null;
  
  const face = faces[faceNumber];
  if (!face || !face.keypoints) return null;
  
  const point = face.keypoints[index];
  if (!point) return null;
  
  // Map the keypoint using PhoneCamera for coordinate transformation
  return cam.mapKeypoint(point);
}

// ==============================================
// DISPLAY - Show a point with its coordinates
// ==============================================
function showPoint(point, pointColor) {
  if (!isValidPoint(point)) return;

  // Draw point circle at screen coordinates
  fill(pointColor);
  noStroke();
  circle(point.x, point.y, 20);
  
  // Draw point index number
  if (point.index != null) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(point.index, point.x, point.y);
  }
  
  // Draw point coordinates only if showData is true
  if (showData) {
    fill(255, 255, 0);
    textAlign(CENTER, TOP);
    textSize(8);
    let displayText = `(${Math.round(point.x)}, ${Math.round(point.y)})`;
    text(displayText, point.x, point.y + 15);
  }
}

// ==============================================
// MEASURE - Distance between two points
// ==============================================
function measureDistance(point1, point2) {
  if (!point1 || !point2) return null;
  
  // Calculate distance
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Draw visualization only if showData is true
  if (showData) {
    // Draw line between points
    stroke(255, 165, 0); // Orange
    strokeWeight(2);
    line(point1.x, point1.y, point2.x, point2.y);
    
    // Show distance text at midpoint
    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;
    noStroke();
    fill(255, 165, 0);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(`${Math.round(distance)}px`, midX, midY);
  }

  return distance;
}

// ==============================================
// MEASURE - Angle from horizontal
// ==============================================
function measureAngle(basePoint, endPoint) {
  if (!basePoint || !endPoint) return null;
  
  // Calculate angle
  const dx = endPoint.x - basePoint.x;
  const dy = endPoint.y - basePoint.y;
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  
  // Draw visualization only if showData is true
  if (showData) {
    // Draw angle arc
    noFill();
    stroke(255, 165, 0);
    strokeWeight(2);
    const arcRadius = 30;
    arc(basePoint.x, basePoint.y, arcRadius*2, arcRadius*2, 0, angle * PI/180);
    
    // Draw small line at 0 degrees for reference
    stroke(255, 165, 0, 127); // Semi-transparent orange
    line(basePoint.x, basePoint.y, basePoint.x + arcRadius, basePoint.y);
    
    // Show angle text near base point
    noStroke();
    fill(255, 165, 0);
    textAlign(LEFT, CENTER);
    textSize(12);
    text(`${Math.round(angle)}°`, basePoint.x + arcRadius + 5, basePoint.y);
  }

  return angle;
}

// ==============================================
// MEASURE - Velocity in x and y directions
// ==============================================
function measureVelocity(currentPoint, previousPoint) {
  // Return zero velocity if either point is missing
  if (!currentPoint || !previousPoint) {
    return { x: 0, y: 0, speed: 0 };
  }
  
  // Calculate velocity components
  const vx = currentPoint.x - previousPoint.x;
  const vy = currentPoint.y - previousPoint.y;
  const speed = Math.sqrt(vx * vx + vy * vy);
  
  // Draw visualization only if showData is true
  if (showData) {
    // Draw velocity vector from current point
    if (speed > 1) { // Only draw if there's noticeable movement
      stroke(255, 255, 0);
      strokeWeight(3);
      
      // Draw velocity arrow (scaled for visibility)
      const scale = 2;
      const endX = currentPoint.x + vx * scale;
      const endY = currentPoint.y + vy * scale;
      
      // Arrow line
      line(currentPoint.x, currentPoint.y, endX, endY);
      
      // Arrow head
      push();
      translate(endX, endY);
      rotate(atan2(vy, vx));
      fill(255, 255, 0);
      noStroke();
      triangle(-10, -5, -10, 5, 0, 0);
      pop();
    }
    
    // Show velocity text
    noStroke();
    fill(255, 255, 0);
    textAlign(CENTER, BOTTOM);
    textSize(12);
    text(`vx: ${vx.toFixed(1)} vy: ${vy.toFixed(1)} speed: ${speed.toFixed(1)}`, 
         currentPoint.x, currentPoint.y - 20);
  }
  
  return { x: vx, y: vy, speed: speed };
}

// ==============================================
// HELPER - Check if point has valid coordinates
// ==============================================
function isValidPoint(point) {
  return point && 
         typeof point.x === 'number' && 
         typeof point.y === 'number';
}

// ==============================================
// UI - Display status and instructions
// ==============================================
function drawUI() {
  background(220, 173, 237);

  push();
  
  // Show status at top of screen
  if (!cam.ready) {
    pg = pgStarting;
    rotateZ(PI);
    rotateY(PI);
  } else if (faces.length === 0) {
    pg = pgShowFace;
    rotateZ(PI);
    rotateY(PI);
  } else {
    let nowTime = millis();
    if (distance3_4 > 2.5) {
      if (!mouthOpen) {
        // Start speech recognition
        myRec.start();
        // Update graphic
        pg = pgOpen;
        // Update open mouth state only once
        mouthOpen = true;
        mouthOpenTime = nowTime;
      }
      if (mouthClose && (nowTime - mouthCloseTime) > 100) {
        mouthClose = false;
        crtTVIndex = floor(random(crtTVImages.length));
      }
      //pg = pgOpen;
    } else {
      if (!mouthOpen && !mouthClose) {
        // Update graphic
        pg = pgClosed;
      }
      mouthClose = true;
      mouthCloseTime = nowTime;
      if (mouthOpen && (nowTime - mouthOpenTime) > 10000) {
        // Stop speech recognition after 10 seconds of open mouth
        myRec.stop();
        // Update graphic
        pg = pgClosed;
        // Update open mouth states
        mouthOpen = false;
      }
      //pg = pgClosed;
    }

    // Click and drag to look around the shape
    orbitControl();

    angleLat = angle1_2 * PI/180;
    angleLon = angle5_0 * PI/180;
   
    // Convert polar coordinates to rotation angles
    let rotY = -sin(angleLat) * PI;
    let rotX = cos(angleLon) * PI;
    let rotZ = atan2(sin(angleLon), cos(angleLat));

    // This adds color to the model according to the angle of the surface
    normalMaterial();
    lights();
    noStroke();
    specularMaterial(50);
    shininess(100);
    rotateX(-PI / 1.8 - rotX);
    rotateY(-PI / 2 + rotY);
    rotateZ(rotZ);
    scale(1.5);
    model(crtTVModel);

    texture(crtTVImages[crtTVIndex]);

    rotateZ(-2 * PI / 180);
    rotateY(PI / 2);
    translate(0, 4, -63); // Position the sprite
    plane(160, 130); // Width and height of the sprite
  }
  
  // Instructions at bottom
  //textSize(14);
  //text('Tap screen to toggle video', width/2, height - 40);

  texture(pg); // Use the 2D graphics as a texture
  rotateX(PI);
  translate(0, 150, 0); // Move the plane forward
  plane(400, 400); // Draw a plane with the text texture
  
  pop();
}

function showResult() {
  if (myRec.resultValue==true) {
    pg = pgClosed;
    mouthOpen = false;
    console.log(myRec.resultString);
    // Split resultString by space and special symbols
    let words = myRec.resultString.split(/[ +\-_`'\.\?!]+/);
    console.log(words);
  }
}

// ==============================================
// INTERACTION - Toggle video on touch
// ==============================================
function mousePressed() {
  //showVideo = !showVideo;
}