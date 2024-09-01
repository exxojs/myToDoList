// Pin definitions
const int motorLeftForward = 5; // A1-A
const int motorLeftBackward = 9; // A1-B
const int motorRightForward = 6; // B1-A
const int motorRightBackward = 10; // B1-B

void setup() {
  // Set all the motor control pins to output
  pinMode(motorLeftForward, OUTPUT);
  pinMode(motorLeftBackward, OUTPUT);
  pinMode(motorRightForward, OUTPUT);
  pinMode(motorRightBackward, OUTPUT);
}

void loop() {
  // Example commands to demonstrate movement
  moveForward();
  delay(2000); // Move forward for 2 seconds

  moveReverse();
  delay(2000); // Move reverse for 2 seconds

  turnLeft();
  delay(1000); // Turn left for 1 second

  turnRight();
  delay(1000); // Turn right for 1 second

  stopMovement();
  delay(2000); // Stop for 2 seconds
}

void moveForward() {
  analogWrite(motorLeftForward, 113); 
  analogWrite(motorLeftBackward, 0);     
  analogWrite(motorRightForward, 113);  
  analogWrite(motorRightBackward, 0);     
}

void moveReverse() {
  analogWrite(motorLeftForward, 0);  
  analogWrite(motorLeftBackward, 113);    
  analogWrite(motorRightForward, 0);  
  analogWrite(motorRightBackward, 113);  
}

void turnLeft() {
  analogWrite(motorLeftForward, 0);  
  analogWrite(motorLeftBackward, 113);   
  analogWrite(motorRightForward, 113); 
  analogWrite(motorRightBackward, 0);   
}

void turnRight() {
  analogWrite(motorLeftForward, 113);  
  analogWrite(motorLeftBackward, 0);    
  analogWrite(motorRightForward, 0);   
  analogWrite(motorRightBackward, 113);    
}

void stopMovement() {
  analogWrite(motorLeftForward, 0); 
  analogWrite(motorLeftBackward, 0); 
  analogWrite(motorRightForward, 0); 
  analogWrite(motorRightBackward, 0); 
}