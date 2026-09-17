# PRANA — Judge Q&A Preparation Sheet

> **Pitch Context:** Individual Software Solution · AI in Healthcare  
> **Core Value Thesis:** *"If the ambulance cannot beat the traffic, the treatment should not have to wait for it."*  
> **Tone:** Calm, clinically credible, technically precise, zero hype or unsupported medical claims.

---

## Question 1: "Why Hospital B and not the closer one?"

### The Spoken Answer:
> *"In trauma and critical envenomation, the closest hospital without the required surgical or toxicology capability is often fatal. PRANA's facility matching algorithm uses a transparent multi-factor suitability formula: **40% Clinical Fit, 30% Live Capacity, and 30% Transit ETA**.*
> 
> *For example, in our trauma case (Rahul Verma), Columbia Asia is physically closer at 5.1 km (11 min ETA), while Manipal Hospital is 7.2 km (14 min ETA). A naive navigation app routes to Columbia Asia. But PRANA selects Manipal because Rahul has a suspected pelvic fracture and internal hemorrhage requiring 24/7 interventional radiology (angio-embolization) and a certified Level-1 surgical suite—capabilities Columbia Asia lacks on this shift. The 40% clinical fit outweighs the 3-minute transit difference.*
> 
> *Furthermore, if Manipal's resuscitation bay suddenly fills up with an incoming case, PRANA recalculates live in under 200 milliseconds, showing judges exactly why the score flipped and re-routing the vehicle before it arrives at a blocked door."*

---

## Question 2: "Is this real AI or is it faked?"

### The Spoken Answer:
> *"It is transparent, deterministic clinical decision support computed live from streaming telemetry—and we deliberately chose explainable logic over a black-box machine learning model.*
> 
> *PRANA computes dynamic physiological markers in real time: Shock Index (Heart Rate ÷ Systolic BP), Pulse Pressure narrowing, hypoxia velocity, and domain-specific patterns such as the SLUDGE toxindrome in organophosphate poisoning. When vitals cross clinical danger thresholds, PRANA detects the pattern and synthesizes observable signals for the physician.*
> 
> *In emergency medicine, black-box deep learning models are notoriously prone to hallucination, distribution shift, and unexplainable errors. For prehospital stabilization, explainable decision support grounded in established physiological formulas is not a compromise—it is the only responsible clinical engineering choice."*

---

## Question 3: "Does the AI ever prescribe or administer anything?"

### The Spoken Answer:
> *"No, by strict architectural design. PRANA is an intelligence and coordination surface, not an autonomous AI doctor.*
> 
> *Every clinical action in PRANA passes through an authoritative **Human-in-the-Loop Clinician Gate**. The AI identifies observable signals and surfaces recommended protocols. However, zero medications can be administered and zero orders executed until a credentialed remote tele-specialist actively reviews the multi-stream trends and clicks `CONFIRM`, logging their physician license ID and timestamp into the immutable event ledger.*
> 
> *The paramedic carries out field stabilization, the remote specialist provides medical oversight, and PRANA ensures the communication between them is unbroken."*

---

## Question 4: "What is simulated versus real in this demonstration?"

### The Spoken Answer:
> *"Here is the completely honest breakdown:*
> 
> 1. **Vitals Feed**: *Simulated via our deterministic in-memory drift engine for 100% offline competition resilience. In a field deployment, this is replaced by Bluetooth or serial HL7/FHIR streaming directly from existing prehospital monitors like Zoll X Series or Philips Tempus PRO.*
> 2. **GPS & Traffic**: *Simulated corridor progression with an injected congestion delay (+8 mins). In production, this integrates with Google Maps Platform or Mapbox Emergency Navigation APIs with live traffic layers.*
> 3. **Hospital Bed & Bay Status**: *Simulated catchment capacity states. In real-world hospital deployment, this connects to emergency department EHR bed-tracking interfaces (e.g., Epic BedTime, Cerner, or state-wide 108 EMS bed registries).*
> 
> *What is 100% real today is the multi-role coordination state machine, the synchronized derived ETA, the dynamic facility scoring engine, and the single-source Care Rail timeline."*

---

## Question 5: "What would it take to take PRANA from this competition prototype to real-world deployment?"

### The Spoken Answer:
> *"Our deployment roadmap rests on four concrete pillars:*
> 
> 1. **EMS Hardware Integration**: *Writing lightweight device drivers to ingest raw serial/Bluetooth data packets from standard ambulance defibrillator-monitors using open IEEE 11073 medical device standards.*
> 2. **Clinical Validation**: *Conducting a multi-center retrospective study with academic emergency medicine departments (e.g., NIMHANS or Manipal Emergency Medicine) benchmarking PRANA's deterioration sensitivity and facility match fit against historical prehospital case cohorts.*
> 3. **Regulatory Governance**: *Classifying PRANA under the CDSCO (Central Drugs Standard Control Organisation) Software as a Medical Device (SaMD) framework under the Indian Medical Device Rules (Class B/C clinical decision support).*
> 4. **Pilot Deployment Partner**: *Partnering with a state-level ambulance operator (such as GVK-EMRI 108) or private hospital network ambulance fleets for a 6-month geofenced corridor pilot along high-traffic arterial highways."*

---

## Quick-Fire Reference Card (Keep on Phone/Notepad)

| Judge Question | 1-Sentence Takeaway |
| :--- | :--- |
| **"Why Manipal over closer Columbia Asia?"** | *"Level-1 angio-embolization capability outweighs a 3-minute transit delta on our 40/30/30 clinical fit formula."* |
| **"Is this a black-box neural net?"** | *"No—it is explainable, real-time physiological decision support deliberately engineered for safety and clinical transparency."* |
| **"Can the AI administer atropine or antivenom?"** | *"Never. All protocols require explicit human tele-specialist endorsement with license ID and timestamp."* |
| **"How does the traffic delay matter?"** | *"Traffic delays the wheels, but PRANA ensures patient telemetry, specialist consultation, and ED prep continue unbroken."* |
| **"Does this app work without Wi-Fi?"** | *"Yes, 100% self-contained offline architecture running in browser memory with zero external cloud dependencies."* |
