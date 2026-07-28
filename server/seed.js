require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Project = require('./models/Project');
const Batch = require('./models/Batch');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stem_edu');
    console.log('MongoDB Connected for Seeding');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear db
    await User.deleteMany();
    await Course.deleteMany();
    await Project.deleteMany();
    await Batch.deleteMany();

    // Create users
    const admin = await User.create({ name: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'admin' });
    const tutor = await User.create({ name: 'Expert Tutor', email: 'tutor@test.com', password: 'password123', role: 'tutor', avatar: 'https://ui-avatars.com/api/?name=Expert+Tutor&background=10b981&color=fff' });
    const student = await User.create({ name: 'name here...', email: 'student@test.com', password: 'password123', role: 'student' });

    // Create courses
    const course1 = await Course.create({
      title: 'Ultimate Robotics for Beginners',
      slug: 'ultimate-robotics-beginners',
      description: 'Learn to build and program robots from scratch. Perfect for absolute beginners.',
      shortDescription: 'Learn to build and program robots from scratch.',
      thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
      category: 'Robotics',
      level: 'Beginner',
      instructor: tutor._id,
      isFree: true,
      rating: 4.8,
      studentsEnrolled: [student._id],
      totalLessons: 12,
      totalDuration: 360,
      isPublished: true,
      whatYouLearn: ['Understanding basic electronics', 'Programming Arduino', 'Building your first robot', 'Motor control basics'],
      requirements: ['No prior experience needed', 'A computer with internet access'],
      curriculum: [
        {
          title: 'Introduction to Robotics',
          lessons: [
            { title: 'What is a Robot? (Video)', type: 'video', isFree: true, duration: 15, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Robotics History (PPT)', type: 'ppt', isFree: true, duration: 10, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { title: 'Basic Electronics', type: 'video', isFree: true, duration: 25, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          ]
        },
        {
          title: 'Hands-on Practice',
          lessons: [
            { title: 'Component Identification Activity', type: 'activity', isFree: true, duration: 20, url: 'https://www.example.com/activity' },
            { title: 'Circuit Diagram Guide (PDF)', type: 'pdf', isFree: true, duration: 5, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          ]
        }
      ]
    });

    const course2 = await Course.create({
      title: 'Advanced Game Development with Unity',
      slug: 'advanced-game-dev-unity',
      description: 'Master 3D game development and create your own multiplayer games.',
      shortDescription: 'Master 3D game development and create multiplayer games.',
      thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800',
      category: 'Game Development',
      level: 'Advanced',
      instructor: tutor._id,
      isFree: false,
      price: 2999,
      discountPrice: 1999,
      rating: 4.9,
      isPublished: true,
      whatYouLearn: ['Advanced C# scripting', 'Multiplayer networking', '3D math for games'],
      curriculum: [
        {
          title: 'Getting Started with Unity',
          lessons: [
            { title: 'Installing Unity Hub', type: 'video', isFree: true, duration: 12, url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { title: 'Unity Interface Overview', type: 'ppt', isFree: false, duration: 15, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { title: 'Your First Script', type: 'activity', isFree: false, duration: 30, url: 'https://www.example.com/activity' },
            { title: 'C# Cheatsheet', type: 'pdf', isFree: false, duration: 5, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ]
        }
      ]
    });

    // Create projects
    await Project.create([
      {
        title: 'Line Following Robot',
        slug: 'line-following-robot',
        description: 'Build an autonomous robot that follows a black line on a white surface using IR sensors.',
        shortDescription: 'Build a robot that follows a line using IR sensors.',
        thumbnail: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&q=80&w=800',
        category: 'Robotics',
        difficulty: 'Beginner',
        estimatedTime: '2-3 hours',
        isFree: true,
        isPublished: true,
        views: 1240,
        components: [
          { name: 'Arduino Uno', quantity: 1 },
          { name: 'IR Sensors', quantity: 2 },
          { name: 'L298N Motor Driver', quantity: 1 },
          { name: 'DC Motors with Wheels', quantity: 2 },
          { name: 'Chassis', quantity: 1 }
        ],
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Example video
        githubUrl: 'https://github.com/example/line-follower',
        steps: [
          {
            stepNumber: 1,
            title: 'Assemble the Chassis',
            description: 'Begin by attaching the DC motors to the base of the chassis. Ensure they are aligned perfectly parallel so the robot drives straight. Mount the caster wheel at the front to provide a stable third point of contact.',
            images: ['https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&q=80&w=600'],
            tip: 'Make sure the motors are aligned properly for straight movement. A slight misalignment will cause the robot to drift.'
          },
          {
            stepNumber: 2,
            title: 'Mount the Components',
            description: 'Place the Arduino Uno and L298N Motor Driver on top of the chassis. Mount the two IR sensors at the very front of the chassis, facing downwards towards the floor. The sensors should be about 1-2 cm above the ground for optimal line detection.',
            images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600']
          },
          {
            stepNumber: 3,
            title: 'Upload Code',
            description: 'Connect the Arduino to your PC via USB. Open the Arduino IDE, paste the following code, and hit upload. This code constantly reads the left and right IR sensors and adjusts motor speeds to keep the robot centered on the line.',
            codeSnippet: `void setup() {\n  pinMode(LEFT_SENSOR, INPUT);\n  pinMode(RIGHT_SENSOR, INPUT);\n  pinMode(MOTOR_L1, OUTPUT);\n  pinMode(MOTOR_L2, OUTPUT);\n  pinMode(MOTOR_R1, OUTPUT);\n  pinMode(MOTOR_R2, OUTPUT);\n}\n\nvoid loop() {\n  int left = digitalRead(LEFT_SENSOR);\n  int right = digitalRead(RIGHT_SENSOR);\n  \n  if(left == LOW && right == LOW) {\n    // Move Forward\n  } else if(left == HIGH && right == LOW) {\n    // Turn Right\n  } else if(left == LOW && right == HIGH) {\n    // Turn Left\n  }\n}`,
            codeLanguage: 'cpp',
            warning: 'Ensure your motor driver is powered by the battery pack, not directly from the Arduino 5V pin, to avoid drawing too much current.'
          }
        ]
      },
      {
        title: 'Smart IoT Weather Station',
        slug: 'smart-iot-weather-station',
        description: 'Create a WiFi-enabled weather station that reads temperature and humidity and displays it on a web dashboard.',
        shortDescription: 'Build a WiFi weather station using ESP8266.',
        thumbnail: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&q=80&w=800',
        category: 'IoT',
        difficulty: 'Intermediate',
        estimatedTime: '3-4 hours',
        isFree: true,
        isPublished: true,
        views: 850,
        components: [
          { name: 'ESP8266 WiFi Module', quantity: 1 },
          { name: 'DHT11 Sensor', quantity: 1 },
          { name: 'OLED Display', quantity: 1 },
          { name: 'Jumper Wires', quantity: 10 },
          { name: 'Breadboard', quantity: 1 }
        ],
        videoUrl: 'https://www.youtube.com/watch?v=k_Zt4Hq5h78',
        steps: [
          {
            stepNumber: 1,
            title: 'Wiring the DHT11',
            description: 'The DHT11 sensor requires 3 pins: VCC, GND, and Data. Connect the VCC of DHT11 to 3.3V on the ESP8266, GND to GND, and the Data pin to D4. This sensor will capture ambient temperature and humidity.',
            images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600'],
            tip: 'Use a 10k pull-up resistor between VCC and the data line if your DHT11 module doesn\'t have one built-in on the breakout board.'
          },
          {
            stepNumber: 2,
            title: 'Connecting the OLED',
            description: 'The OLED display communicates via the I2C protocol. Connect VCC to 3.3V, GND to GND. Connect the SDA pin to D2 and the SCL pin to D1 on the ESP8266. This allows the microcontroller to draw text on the screen.',
            images: ['https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&q=80&w=600']
          },
          {
            stepNumber: 3,
            title: 'Writing the Code',
            description: 'Install the "DHT sensor library" and "Adafruit SSD1306" library via the Arduino IDE Library Manager. The code below initializes the sensor and prints the values over the serial monitor. You can easily extend this to connect to WiFi and send data to an IoT platform like ThingSpeak.',
            codeSnippet: `#include <ESP8266WiFi.h>\n#include <DHT.h>\n#define DHTPIN 2\n#define DHTTYPE DHT11\nDHT dht(DHTPIN, DHTTYPE);\n\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n}\n\nvoid loop() {\n  float h = dht.readHumidity();\n  float t = dht.readTemperature();\n  Serial.print("Temp: ");\n  Serial.print(t);\n  Serial.println("C");\n  delay(2000);\n}`,
            codeLanguage: 'cpp'
          }
        ]
      },
      {
        title: 'Arduino Traffic Light System',
        slug: 'arduino-traffic-light',
        description: 'Simulate a real-world traffic light intersection using LEDs and an Arduino.',
        shortDescription: 'Learn basic Arduino programming with a traffic light project.',
        thumbnail: 'https://images.unsplash.com/photo-1533036417711-4091a10cd2d9?auto=format&fit=crop&q=80&w=800',
        category: 'Electronics',
        difficulty: 'Beginner',
        estimatedTime: '1 hour',
        isFree: true,
        isPublished: true,
        views: 2100,
        components: [
          { name: 'Arduino Uno', quantity: 1 },
          { name: 'LEDs (Red, Yellow, Green)', quantity: 3 },
          { name: '330 Ohm Resistors', quantity: 3 },
          { name: 'Breadboard', quantity: 1 },
          { name: 'Jumper Wires', quantity: 5 }
        ],
        videoUrl: 'https://www.youtube.com/watch?v=F_fK3mKIf6k',
        steps: [
          {
            stepNumber: 1,
            title: 'Place LEDs on Breadboard',
            description: 'Insert the Red, Yellow, and Green LEDs into the breadboard in a row, resembling a real traffic light. Connect the short leg (cathode) of each LED to the common ground rail on the breadboard.',
            images: ['https://images.unsplash.com/photo-1533036417711-4091a10cd2d9?auto=format&fit=crop&q=80&w=600']
          },
          {
            stepNumber: 2,
            title: 'Add Resistors & Connect to Arduino',
            description: 'To prevent the LEDs from burning out, place a 330 ohm resistor in series with the long leg (anode) of each LED. Run a jumper wire from the resistor of the Red LED to digital pin 13, Yellow to pin 12, and Green to pin 11. Finally, connect the ground rail of the breadboard to the GND pin on the Arduino.',
            images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600']
          },
          {
            stepNumber: 3,
            title: 'Program the Sequence',
            description: 'Open your Arduino IDE. This code will configure pins 11, 12, and 13 as outputs. In the loop, it sequentially turns on the Green LED, waits, switches to Yellow, waits, and then switches to Red, mimicking an actual intersection.',
            codeSnippet: `int red = 13;\nint yellow = 12;\nint green = 11;\n\nvoid setup() {\n  pinMode(red, OUTPUT);\n  pinMode(yellow, OUTPUT);\n  pinMode(green, OUTPUT);\n}\n\nvoid loop() {\n  // Green light on for 5 seconds\n  digitalWrite(green, HIGH);\n  delay(5000);\n  digitalWrite(green, LOW);\n\n  // Yellow light on for 2 seconds\n  digitalWrite(yellow, HIGH);\n  delay(2000);\n  digitalWrite(yellow, LOW);\n\n  // Red light on for 5 seconds\n  digitalWrite(red, HIGH);\n  delay(5000);\n  digitalWrite(red, LOW);\n}`,
            codeLanguage: 'cpp',
            warning: 'Make sure the orientation of your LEDs is correct! LEDs are polarized; power must flow from the anode (long leg) to the cathode (short leg).'
          }
        ]
      }
    ]);

    // Create batches
    await Batch.create([
      {
        title: 'Drone Building & Piloting Bootcamp',
        description: 'A 1-week intensive batch covering drone mechanics, flight controllers, assembly, and piloting basics.',
        price: 2999,
        discountPrice: 1499,
        validityDays: 7,
        courses: [], // Can link to drone course if available
        features: ['Day 1-2: Drone Mechanics', 'Day 3-4: Assembly & Wiring', 'Day 5: Flight Controllers', 'Day 6-7: Piloting & Safety'],
        badge: 'New',
        isActive: true,
        studyMaterials: [
          { title: 'Drone Assembly Guide PDF', chapter: 'Day 1: Drone Mechanics', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { title: 'Flight Controller Setup PPT', chapter: 'Day 5: Flight Controllers', type: 'ppt', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { title: 'Simulation Flight Training', chapter: 'Day 6: Piloting Basics', type: 'activity', url: 'https://www.example.com' }
        ]
      },
      {
        title: 'Python & AI Fundamentals',
        description: 'Learn Python programming from scratch and build your first Artificial Intelligence model in just one week.',
        price: 3499,
        discountPrice: 1999,
        validityDays: 7,
        courses: [], 
        features: ['Day 1-3: Python Basics & Data Structures', 'Day 4: Libraries (NumPy, Pandas)', 'Day 5-6: Machine Learning Basics', 'Day 7: AI Project Deployment'],
        badge: 'Trending',
        isActive: true,
        studyMaterials: [
          { title: 'Python Basics PPT', chapter: 'Day 1: Basics', type: 'ppt', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { title: 'Variables & Data Types Quiz', chapter: 'Day 1: Basics', type: 'activity', url: 'https://www.example.com/quiz' },
          { title: 'Data Structures PDF', chapter: 'Day 2: Data Structures', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { title: 'Intro to AI PPT', chapter: 'Day 5: Machine Learning', type: 'ppt', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ]
      },
      {
        title: 'Robotics Masterclass',
        description: 'One week to master Arduino, sensors, motor drivers, and build your own autonomous robot.',
        price: 2499,
        discountPrice: 1299,
        validityDays: 7,
        courses: [course1._id],
        features: ['Day 1: Intro to Microcontrollers', 'Day 2-3: Sensors & Actuators', 'Day 4-5: Building the Chassis', 'Day 6-7: Programming & Testing'],
        badge: 'Best Seller',
        isActive: true,
        studyMaterials: [
          { title: 'Intro to Microcontrollers PPT', chapter: 'Day 1: Microcontrollers', type: 'ppt', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { title: 'Blinking LED Challenge', chapter: 'Day 1: Microcontrollers', type: 'activity', url: 'https://www.example.com' },
          { title: 'Sensors Guide PDF', chapter: 'Day 2: Sensors', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { title: 'Robot Chassis Diagram', chapter: 'Day 4: Building', type: 'link', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ]
      },
      {
        title: 'Tech Entrepreneurship 101',
        description: 'Learn how to turn your technical skills and STEM projects into a profitable startup within a week.',
        price: 4999,
        discountPrice: 2499,
        validityDays: 7,
        courses: [],
        features: ['Day 1-2: Ideation & Market Research', 'Day 3: Prototyping (MVP)', 'Day 4-5: Business Models & Pricing', 'Day 6-7: Pitching & Fundraising'],
        badge: 'Premium',
        isActive: true,
        studyMaterials: [
          { title: 'Ideation Brainstorming Activity', chapter: 'Day 1: Ideation', type: 'activity', url: 'https://www.example.com' },
          { title: 'Business Model Canvas PPT', chapter: 'Day 4: Business Models', type: 'ppt', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { title: 'Startup Pitch Deck Template', chapter: 'Day 6: Pitching', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ]
      }
    ]);

    console.log('✅ Data Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
