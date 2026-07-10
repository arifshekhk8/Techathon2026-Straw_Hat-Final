/*
 * Team Straw Hat — 7-servo robotic-arm firmware (Wokwi simulation, ESP32)
 *
 * DRAFT — author-generated to match the spec; MUST be verified in Wokwi before
 * the demo (load hardware/diagram.json + this sketch, run, confirm the sweep).
 *
 * Board: ESP32 DevKit-C. Uses the ESP32Servo library (Arduino Servo API on the
 * ESP32 LEDC PWM peripheral). Add "ESP32Servo" via the Wokwi Library Manager
 * (or hardware/libraries.txt).
 *
 * Joint order mirrors src/core/chain.ts exactly:
 *   1 base yaw · 2 shoulder · 3 elbow · 4 forearm roll · 5 wrist pitch ·
 *   6 tool roll · 7 stylus pitch
 *
 * Serial protocol @ 115200 baud:
 *   Send a joint vector in RADIANS as a JSON array (the same q[] the web app
 *   prints), e.g.:  [0.0, 1.15, 0.75, 0.0, 0.95, 0.0, 0.45]
 *   Each joint is mapped from its [lower, upper] limit onto the servo's 0-180°.
 *   With no serial input the arm runs a slow sine sweep so the servos visibly
 *   move (matches the "servos sweeping" demo beat in PLAN.md).
 */
#include <ESP32Servo.h>

const int NJ = 7;
// ESP32 output-capable PWM GPIOs. Avoids input-only pins (34/35/36/39) and
// boot-strapping pins (0/2/5/12/15) so a connected servo can't block reset.
const int PINS[NJ] = { 13, 32, 14, 27, 26, 25, 33 };

// Joint limits (radians) — transcribed from src/core/chain.ts.
const float LOWER[NJ] = { -3.1416f, -2.0944f, -2.6180f, -3.1416f, -2.0944f, -3.1416f, -2.0944f };
const float UPPER[NJ] = {  3.1416f,  2.0944f,  2.6180f,  3.1416f,  2.0944f,  3.1416f,  2.0944f };
const char* LABEL[NJ] = { "base", "shoulder", "elbow", "forearm", "wrist", "tool", "stylus" };

Servo servos[NJ];
float q[NJ] = { 0, 0, 0, 0, 0, 0, 0 };
bool haveTarget = false;

// Map a joint angle (rad) within its limits onto a 0-180° servo command.
int toServoDeg(int j, float rad) {
  float v = rad;
  if (v < LOWER[j]) v = LOWER[j];
  if (v > UPPER[j]) v = UPPER[j];
  float t = (v - LOWER[j]) / (UPPER[j] - LOWER[j]); // 0..1
  return (int)(t * 180.0f + 0.5f);
}

void applyQ() {
  for (int j = 0; j < NJ; j++) servos[j].write(toServoDeg(j, q[j]));
}

// Parse "[a, b, c, d, e, f, g]" (radians) into q[]. Returns true on 7 values.
bool parseVector(const String& line) {
  int idx = 0, i = 0, n = line.length();
  while (i < n && idx < NJ) {
    while (i < n && !(isDigit(line[i]) || line[i] == '-' || line[i] == '+' || line[i] == '.')) i++;
    if (i >= n) break;
    int start = i;
    while (i < n && (isDigit(line[i]) || line[i] == '-' || line[i] == '+' ||
                     line[i] == '.' || line[i] == 'e' || line[i] == 'E')) i++;
    q[idx++] = line.substring(start, i).toFloat();
  }
  return idx == NJ;
}

void setup() {
  Serial.begin(115200);
  // ESP32Servo needs LEDC timers allocated before attach (4 timers → up to 16 servos).
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  for (int j = 0; j < NJ; j++) {
    servos[j].setPeriodHertz(50);          // standard 50 Hz servo frame
    servos[j].attach(PINS[j], 500, 2400);  // min/max pulse width (µs)
  }
  applyQ();
  Serial.println(F("Straw Hat arm ready (ESP32). Send [j1..j7] radians, or watch the sweep."));
}

unsigned long lastMove = 0;
float phase = 0;

void loop() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    if (parseVector(line)) {
      haveTarget = true;
      applyQ();
      Serial.print(F("set:"));
      for (int j = 0; j < NJ; j++) {
        Serial.print(' '); Serial.print(LABEL[j]);
        Serial.print('='); Serial.print(toServoDeg(j, q[j]));
      }
      Serial.println();
    } else {
      Serial.println(F("parse error — expected 7 numbers, e.g. [0,1.15,0.75,0,0.95,0,0.45]"));
    }
  }

  // Idle sweep demo until a target vector arrives.
  if (!haveTarget && millis() - lastMove > 20) {
    lastMove = millis();
    phase += 0.02f;
    for (int j = 0; j < NJ; j++) {
      float mid = (LOWER[j] + UPPER[j]) * 0.5f;
      float amp = (UPPER[j] - LOWER[j]) * 0.35f;
      q[j] = mid + amp * sin(phase + j * 0.6f);
    }
    applyQ();
  }
}
