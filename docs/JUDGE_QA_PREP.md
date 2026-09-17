# PRANA — Judge Q&A Preparation Sheet

> **Pitch Context:** Individual Software Solution · AI in Healthcare  
> **Core Value Thesis:** *"If the ambulance cannot beat the traffic, the treatment should not have to wait for it."*  
> **Tone:** Calm, clinically credible, technically precise, zero hype or unsupported medical claims.

---

## Question 1: "Why Hospital B and not the closer one?"

### The Spoken Answer:
> *"PRANA does not simply choose the geographically closest facility. In this prototype, it considers clinical capability, current capacity, and estimated transit time using a transparent multi-factor suitability formula: **40% Clinical Fit, 30% Live Capacity, and 30% Transit ETA**. The demonstration uses simulated facility data to show how the recommendation can change when readiness changes.
> 
> For example, in our simulated trauma case (Rahul Verma), Columbia Asia is modeled with a simulated distance of 5.1 km (11 min ETA), while Manipal Hospital is modeled at 7.2 km (14 min ETA). A naive navigation app routes strictly by distance to Columbia Asia. But PRANA recommends Manipal based on the simulated scenario parameters: Rahul presents with suspected pelvic trauma and internal hemorrhage requiring 24/7 interventional radiology (angio-embolization) and a certified Level-1 surgical suite—capabilities not configured for Columbia Asia in this simulation profile. The 40% clinical fit weighting offsets the 3-minute transit difference.
> 
> Furthermore, if Manipal's resuscitation bay capacity state shifts to full during transit, PRANA recalculates immediately within the prototype interaction, showing judges exactly why the score flipped and updating the recommendation before arrival."*

---

## Question 2: "Is this real AI or is it faked?"

### The Spoken Answer:
> *"For this prototype, PRANA uses deterministic, explainable decision-support logic over simulated telemetry. The architecture is designed so validated clinical models can be introduced later under clinician oversight. We deliberately chose transparent, explainable logic over a black-box machine learning model.
> 
> PRANA computes simulated physiological indicators: Shock Index (Heart Rate ÷ Systolic BP), pulse-pressure narrowing, hypoxia velocity, and pattern detection for toxic syndromes such as organophosphate SLUDGE. When vitals cross defined demonstration thresholds, PRANA surfaces observable signals and suggested protocols for the remote physician.
> 
> All clinical thresholds in this competition build are deterministic demonstration logic, not validated clinical decision rules. In prehospital stabilization, explainability, auditability, and predictability are non-negotiable safety requirements."*

---

## Question 3: "Does the AI ever prescribe or administer anything?"

### The Spoken Answer:
> *"No, by strict architectural design. PRANA is a coordination and simulated decision-support surface, not an autonomous diagnostic or prescriptive system.
> 
> Every clinical action in PRANA requires an authoritative **Human-in-the-Loop Clinician Gate**. The software surfaces observable signals and protocol suggestions. However, zero medications can be administered and zero orders executed until a credentialed remote tele-specialist reviews the streaming trends and explicitly clicks `CONFIRM`, logging their clinician ID and timestamp into the immutable event ledger.
> 
> The field paramedic provides hands-on stabilization, the remote specialist maintains clinical oversight, and PRANA ensures the coordination channel between them and the receiving facility remains unbroken."*

---

## Question 4: "What is simulated versus real in this demonstration?"

### The Spoken Answer:
> *"Here is the transparent breakdown:
> 
> 1. **Vitals & Telemetry Feed**: *Simulated via our deterministic in-memory drift engine for 100% offline competition resilience. In a field deployment, this would be ingested via Bluetooth or serial HL7/FHIR streaming from standard prehospital monitors (e.g., Zoll or Philips).*
> 2. **GPS & Traffic Corridor**: *Simulated route progression with an injected congestion delay (+8 mins). In production, this would connect to emergency navigation mapping APIs with live traffic.*
> 3. **Hospital Facilities & Bay Readiness**: *Simulated facility profiles and catchment capacity states designed for competition demonstration. In real-world deployment, this would integrate with hospital emergency department bed-management systems (EHR/EMS registries).*
> 
> What is implemented and demonstrated in the offline prototype is the multi-role coordination state machine, the single-source derived ETA calculation, the multi-factor facility scoring engine, and the unified Care Rail audit ledger."*

---

## Question 5: "What would it take to take PRANA from this competition prototype to real-world deployment?"

### The Spoken Answer:
> *"Our deployment roadmap rests on four concrete pillars:
> 
> 1. **EMS Hardware Integration**: *Ingesting telemetry data packets from standard ambulance defibrillator-monitors using open medical device communication standards (e.g., IEEE 11073).*
> 2. **Clinical Validation**: *Conducting retrospective observational studies with academic emergency medicine partners to evaluate sensitivity, specificity, and facility-matching models against historical prehospital case records.*
> 3. **Regulatory Governance**: *Pursuing Software as a Medical Device (SaMD) regulatory pathways (such as CDSCO / Indian Medical Device Rules for clinical decision support systems), establishing clinical risk management and audit controls.*
> 4. **Corridor Pilot Validation**: *Partnering with an emergency ambulance service provider or regional hospital network for a controlled, geofenced transit corridor pilot.*"

---

## Quick-Fire Reference Card (Keep on Phone/Notepad)

| Judge Question | 1-Sentence Takeaway |
| :--- | :--- |
| **"Why Manipal over closer Columbia Asia?"** | *"In our simulated profile, Level-1 surgical capability outweighs a 3-minute transit difference on the 40/30/30 suitability score."* |
| **"Is this a black-box neural net?"** | *"No—it is explainable, deterministic decision-support logic over simulated telemetry, engineered for clinical transparency and safety."* |
| **"Can the AI administer atropine or antivenom?"** | *"Never. All actions require explicit human tele-specialist endorsement with clinician ID and timestamp before administration."* |
| **"How does the traffic delay matter?"** | *"Traffic delays transit, but PRANA ensures patient telemetry, specialist coordination, and hospital bay readiness continue synchronously."* |
| **"Does this app work without Wi-Fi?"** | *"Yes, 100% self-contained offline architecture running in browser memory with zero external cloud dependencies."* |
