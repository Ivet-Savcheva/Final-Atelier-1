let myRec;
let resultText = "";



function setup() 
{
    myRec = new p5.SpeechRec('en-US', gotSpeech);

    // Create a microphone object
    mic = new p5.AudioIn();
    enableMicTap("tap the screen to enable mic");   
	
    createCanvas(800, 800);
    myRec.continuous = true; 
    myRec.interimResults = true;
    myRec.start();
}

function draw()
{
    background(220);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("Say something…", width/2, 50);
    text(resultText, width/2, height/2);
}

function gotSpeech() {
  if (myRec.resultValue) {
    resultText = myRec.resultString.toLowerCase();

    // Trigger only once per sentence
    if (!triggered && resultText.includes("i am")) {
      console.log("Triggered: 'I am'");
      triggered = true; // mark as triggered
    }
  }
}
