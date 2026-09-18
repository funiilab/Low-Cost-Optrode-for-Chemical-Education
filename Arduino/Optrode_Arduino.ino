int mean = 0;
int nMeasures = 300;
long int totalMeasures = 0; 

void setup() {
  analogReadResolution(14); //set 14 bits of resolution (not able for all Arduino's boards)
  
  pinMode (A0, INPUT); //set A0 as sensor LED pin

  Serial.begin (9600);
}

void loop() {
  long int totalMeasures = 0; //reset total Measures

  //for-loop to add all measures in one variable
  for(int i = 0; i < nMeasures; i++){
    totalMeasures += analogRead (A0);
    delayMicroseconds(30);
  } 
  
  mean = totalMeasures / nMeasures; //mean calculation of all measures
  Serial.println(mean); //print mean value in seriar port
  
}
