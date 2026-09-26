import asyncio
import json
import os
import subprocess
import time
import base64
import urllib.request
import websockets

ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity-ide\brain\b4be2c7b-4f21-45b7-a03a-54ef9c9a4f0a"

async def run_e2e():
    print("================================================================================")
    print("  PRANA — Real Headless Chrome Full 9-Stage Lifecycle E2E Walkthrough & Audit  ")
    print("================================================================================")
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    import tempfile
    user_data = os.path.join(tempfile.gettempdir(), f"prana_chrome_e2e_{int(time.time())}")

    # Launch Chrome
    chrome_proc = subprocess.Popen([
        chrome_path,
        "--remote-debugging-port=9222",
        "--headless=new",
        "--window-size=1600,1050",
        f"--user-data-dir={user_data}",
        "--no-first-run",
        "--no-default-browser-check",
        "http://localhost:5173"
    ])

    try:
        # Wait for Chrome to listen on 9222
        time.sleep(2)
        print("[CDP] Discovering target page from Chrome...")
        target_ws_url = None
        for _ in range(10):
            try:
                with urllib.request.urlopen("http://localhost:9222/json") as resp:
                    pages = json.loads(resp.read().decode())
                    for p in pages:
                        if p.get("type") == "page" and "5173" in p.get("url", ""):
                            target_ws_url = p.get("webSocketDebuggerUrl")
                            break
                        if not target_ws_url and p.get("type") == "page":
                            target_ws_url = p.get("webSocketDebuggerUrl")
                    if target_ws_url:
                        break
            except Exception:
                time.sleep(1)

        if not target_ws_url:
            raise RuntimeError("Could not find WebSocket debugger URL from Chrome!")

        print(f"[CDP] Connected: {target_ws_url}")

        async with websockets.connect(target_ws_url, max_size=25 * 1024 * 1024) as ws:
            req_id = 0
            console_messages = []
            uncaught_errors = []

            async def send_cmd(method, params=None):
                nonlocal req_id
                req_id += 1
                msg = {"id": req_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(msg))
                while True:
                    res = json.loads(await ws.recv())
                    if "method" in res:
                        if res["method"] == "Runtime.consoleAPICalled":
                            args = [str(a.get("value", a.get("description", ""))) for a in res["params"].get("args", [])]
                            text = " ".join(args)
                            c_type = res["params"].get("type", "log")
                            console_messages.append((c_type, text))
                        elif res["method"] == "Runtime.exceptionThrown":
                            details = res["params"].get("exceptionDetails", {})
                            uncaught_errors.append(details.get("text", "") + " " + str(details.get("exception", {})))
                        continue
                    if res.get("id") == req_id:
                        if "error" in res:
                            raise RuntimeError(f"CDP Error in {method}: {res['error']}")
                        return res.get("result", {})

            # Enable CDP domains
            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")
            await send_cmd("DOM.enable")

            async def eval_js(expression):
                res = await send_cmd("Runtime.evaluate", {
                    "expression": expression,
                    "returnByValue": True,
                    "awaitPromise": True
                })
                return res.get("result", {}).get("value")

            async def save_screenshot(name):
                res = await send_cmd("Page.captureScreenshot", {"format": "png"})
                img_data = base64.b64decode(res["data"])
                path = os.path.join(ARTIFACT_DIR, name)
                with open(path, "wb") as f:
                    f.write(img_data)
                print(f"[CDP Screenshot] Captured: {name}")
                return path

            # Wait for React to render
            print("[CDP] Waiting for DOM complete...")
            await asyncio.sleep(2)
            for _ in range(15):
                ready = await eval_js("document.readyState === 'complete' && !!document.body.innerText")
                if ready:
                    break
                await asyncio.sleep(1)

            initial_text = await eval_js("document.body.innerText")
            print(f"  -> Initial Page Text: {initial_text[:200]}...")

            # -------------------------------------------------------------------------
            # 1. NAVIGATE TO MISSION PORTAL
            # -------------------------------------------------------------------------
            print("\n[STEP 1] Navigating to Mission Portal...")
            # Click the PRANA monogram or portal button
            await eval_js("""
                (() => {
                    const btn = document.querySelector('button[title="PRANA Mission Portal"]') ||
                                document.querySelector('button[title="Mission Overview & Scenarios"]') ||
                                Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Portal') || (b.title || '').includes('Portal'));
                    if (btn) btn.click();
                })()
            """)
            await asyncio.sleep(1)

            has_create_case = False
            for _ in range(10):
                has_create_case = await eval_js("!!Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('CREATE CASE'))")
                if has_create_case:
                    break
                await asyncio.sleep(0.5)

            print(f"  -> Reached Mission Portal with CREATE CASE button: {has_create_case}")
            assert has_create_case, "Could not navigate to Mission Portal with CREATE CASE button"

            # -------------------------------------------------------------------------
            # 2. OPEN INTAKE MODAL & SUBMIT RADHA SHARMA TEXT NOTES
            # -------------------------------------------------------------------------
            print("\n[STEP 2] Opening Case Intake Modal...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const intakeBtn = buttons.find(b => (b.innerText || '').includes('CREATE CASE'));
                    if (intakeBtn) intakeBtn.click();
                })()
            """)

            print("  -> Waiting for modal dialog to appear...")
            modal_appeared = False
            for _ in range(10):
                modal_appeared = await eval_js("!!document.querySelector('[role=\"dialog\"]')")
                if modal_appeared:
                    break
                await asyncio.sleep(0.5)
            print(f"  -> Modal appeared: {modal_appeared}")
            assert modal_appeared, "Case intake modal dialog did not appear"

            print("  -> Selecting 'TEXT NOTES' tab inside dialog...")
            tab_clicked = await eval_js("""
                (() => {
                    const modal = document.querySelector('[role=\"dialog\"]');
                    if (!modal) return false;
                    const textTab = Array.from(modal.querySelectorAll('button')).find(b => (b.textContent || '').includes('TEXT NOTES'));
                    if (textTab) {
                        textTab.click();
                        return true;
                    }
                    return false;
                })()
            """)
            print(f"  -> Clicked TEXT NOTES tab: {tab_clicked}")

            print("  -> Waiting for textarea to render...")
            has_ta = False
            for _ in range(10):
                has_ta = await eval_js("!!document.querySelector('[role=\"dialog\"] textarea')")
                if has_ta:
                    break
                await asyncio.sleep(0.5)
            print(f"  -> Textarea element rendered: {has_ta}")
            assert has_ta, "Textarea not found inside intake modal"

            clinical_text = "52-year-old female Radha Sharma, acute respiratory distress, severe dyspnea, history of COPD. SpO2 86%, RR 32, HR 108, BP 135/88. High-flow oxygen started."
            print(f"  -> Entering clinical intake text: '{clinical_text}'...")

            # Set value and trigger native input event
            await eval_js(f"""
                (() => {{
                    const ta = document.querySelector('[role="dialog"] textarea');
                    if (!ta) return false;
                    ta.focus();
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    nativeSetter.call(ta, {json.dumps(clinical_text)});
                    ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    ta.dispatchEvent(new Event('change', {{ bubbles: true }}));
                }})()
            """)
            await asyncio.sleep(0.5)

            btn_state = await eval_js("""
                (() => {
                    const ta = document.querySelector('[role="dialog"] textarea');
                    const extractBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => (b.innerText || '').includes('EXTRACT CASE DATA'));
                    return {
                        valLen: ta ? ta.value.length : 0,
                        btnDisabled: extractBtn ? extractBtn.disabled : true
                    };
                })()
            """)
            print(f"  -> Textarea and Extract Button State: {btn_state}")

            print("  -> Clicking 'EXTRACT CASE DATA'...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const extractBtn = buttons.find(b => b.innerText.includes('EXTRACT CASE DATA'));
                    if (extractBtn) extractBtn.click();
                })()
            """)

            print("  -> Awaiting clinical candidate extraction and review state...")
            has_review = False
            for _ in range(25):
                has_review = await eval_js("document.body.innerText.includes('CONFIRM & ACTIVATE EMERGENCY CASE')")
                if has_review:
                    break
                await asyncio.sleep(1)
            print(f"  -> Reached REVIEW state: {has_review}")
            if not has_review:
                modal_state = await eval_js("document.body.innerText")
                print(f"  -> MODAL STATE TEXT ON TIMEOUT: {modal_state[:600]}")
                print(f"  -> ALL CONSOLE MESSAGES: {console_messages}")
                print(f"  -> ALL UNCAUGHT ERRORS: {uncaught_errors}")
            assert has_review, "Intake extraction timed out or failed to reach REVIEW state"

            extraction_state = await eval_js("""
                (() => {
                    const text = document.body.innerText;
                    return {
                        hasRadha: text.includes('Radha Sharma'),
                        hasAge52: text.includes('52'),
                        hasRespiratory: text.includes('RESPIRATORY') || text.includes('Respiratory'),
                        hasSpo2_86: text.includes('86')
                    };
                })()
            """)
            print(f"  -> Candidate Extraction Verified: {extraction_state}")
            assert extraction_state["hasRadha"], "Radha Sharma was not parsed from intake"
            assert extraction_state["hasRespiratory"], "Respiratory distress domain was not assigned"

            # -------------------------------------------------------------------------
            # 3. CONFIRM & ACTIVATE FRESH EMERGENCY CASE
            # -------------------------------------------------------------------------
            print("\n[STEP 3] Authorizing and activating emergency case...")
            confirm_clicked = await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const confirmBtn = buttons.find(b => b.innerText.includes('CONFIRM & ACTIVATE EMERGENCY CASE'));
                    if (confirmBtn) {
                        confirmBtn.click();
                        return true;
                    }
                    return false;
                })()
            """)
            print(f"  -> Confirm button clicked: {confirm_clicked}")
            await asyncio.sleep(3)

            modal_error = await eval_js("""
                (() => {
                    const err = document.querySelector('.text-rose-600, .bg-rose-50');
                    return err ? err.innerText : null;
                })()
            """)
            print(f"  -> Modal error text (if any): {modal_error}")
            print(f"  -> Recent console logs: {console_messages[-8:]}")
            print(f"  -> Recent uncaught errors: {uncaught_errors}")

            # Ensure we are in Field Medic Command
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
                    const medicBtn = buttons.find(b => (b.title || '').includes('Ambulance'));
                    if (medicBtn) medicBtn.click();
                })()
            """)
            await asyncio.sleep(1.5)

            # -------------------------------------------------------------------------
            # 4. ASSERT INITIAL CASE STATE & ISOLATION
            # -------------------------------------------------------------------------
            print("\n[STEP 4] Verifying Initial Case Isolation & Projections...")
            initial_check = await eval_js("""
                (() => {
                    const body = document.body.innerText;
                    const topHeader = document.querySelector('header') ? document.querySelector('header').innerText : '';
                    return {
                        hasRadha: body.includes('Radha Sharma'),
                        topHeader: topHeader,
                        notHospitalReady: !topHeader.includes('HOSPITAL READY'),
                        notArrived: !topHeader.includes('PATIENT ARRIVED'),
                        notCompleted: !topHeader.includes('TRANSFER COMPLETED'),
                        hasNoTraumaBay1: !body.includes('Bay 1') && !body.includes('Level-1 Trauma Suite'),
                        hasNoSnakebite: !body.includes('20WBCT') && !body.includes('Sunita Gowda'),
                        hasNoPoisoning: !body.includes('SLUDGE') && !body.includes('Manoj Kumar'),
                        assignedBayText: body.includes('Awaiting Assignment') || body.includes('Unassigned') || body.includes('Awaiting')
                    };
                })()
            """)
            print(f"  -> Patient Radha Sharma present: {initial_check['hasRadha']}")
            print(f"  -> Top Header Status: {initial_check['topHeader'].replace('\\n', ' · ')}")
            print(f"  -> Zero premature Hospital Ready: {initial_check['notHospitalReady']}")
            print(f"  -> Zero premature Patient Arrived: {initial_check['notArrived']}")
            print(f"  -> Zero premature Transfer Completed: {initial_check['notCompleted']}")
            print(f"  -> Zero Trauma / Snakebite / Poisoning Leakage: {initial_check['hasNoTraumaBay1'] and initial_check['hasNoSnakebite'] and initial_check['hasNoPoisoning']}")

            assert initial_check["hasRadha"], "Radha Sharma not present in workspace"
            assert initial_check["notHospitalReady"], "Premature Hospital Ready status detected!"
            assert initial_check["notArrived"], "Premature Arrived status detected!"
            assert initial_check["notCompleted"], "Premature Completed status detected!"
            assert initial_check["hasNoSnakebite"] and initial_check["hasNoPoisoning"], "Cross-scenario leakage detected!"

            # Define persona switch helper
            async def switch_persona(name_substr):
                print(f"  -> Switching operational persona to '{name_substr}'...")
                await eval_js("""
                    (() => {
                        const badgeBtn = document.querySelector('button[title="Authenticated session profile & role switch"]');
                        if (badgeBtn) badgeBtn.click();
                    })()
                """)
                await asyncio.sleep(0.5)
                await eval_js(f"""
                    (() => {{
                        const btns = Array.from(document.querySelectorAll('button'));
                        const pBtn = btns.find(b => (b.innerText || '').includes({json.dumps(name_substr)}));
                        if (pBtn) pBtn.click();
                    }})()
                """)
                await asyncio.sleep(1)

            await save_screenshot("e2e_1_fresh_case_active.png")

            # -------------------------------------------------------------------------
            # 5. SWITCH TO CLINICIAN & ESCALATE FOR URGENT REVIEW
            # -------------------------------------------------------------------------
            print("\n[STEP 5] Switching to Clinician Review Console & Escalating...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
                    const clinicianBtn = buttons.find(b => (b.title || '').includes('Clinician'));
                    if (clinicianBtn) clinicianBtn.click();
                })()
            """)
            await asyncio.sleep(1.5)

            # Switch persona to Dr. Sunita Rao (Clinician)
            await switch_persona("Sunita")

            clinician_ready = await eval_js("""
                (() => {
                    const text = document.body.innerText;
                    return {
                        hasRadha: text.includes('Radha Sharma'),
                        hasEscalateBtn: !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ESCALATE FOR URGENT REVIEW'))
                    };
                })()
            """)
            print(f"  -> Clinician console ready for Radha Sharma: {clinician_ready}")
            assert clinician_ready["hasRadha"] and clinician_ready["hasEscalateBtn"], "Clinician console not ready"

            print("  -> Triggering 'ESCALATE FOR URGENT REVIEW'...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const escalateBtn = buttons.find(b => b.innerText.includes('ESCALATE FOR URGENT REVIEW'));
                    if (escalateBtn) escalateBtn.click();
                })()
            """)
            await asyncio.sleep(1.5)

            escalation_verified = await eval_js("""
                (() => {
                    const body = document.body.innerText;
                    return {
                        hasToast: body.includes('Specialist Escalation Dispatched') || body.includes('Hospital Command alerted'),
                        hasEscalatedBadge: body.includes('SPECIALIST ESCALATED') || body.includes('ESCALATED FOR URGENT SPECIALIST REVIEW')
                    };
                })()
            """)
            print(f"  -> Escalation Toast & Status: {escalation_verified}")
            assert escalation_verified["hasToast"] or escalation_verified["hasEscalatedBadge"], "Escalation failed to reflect"
            await save_screenshot("e2e_2_clinician_escalation.png")

            # -------------------------------------------------------------------------
            # 6. SWITCH TO HOSPITAL COMMAND & ACKNOWLEDGE ESCALATION + CONFIRM BAY READY
            # -------------------------------------------------------------------------
            print("\n[STEP 6] Switching to Hospital Command & Acknowledging Escalation...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
                    const hospBtn = buttons.find(b => (b.title || '').includes('Hospital'));
                    if (hospBtn) hospBtn.click();
                })()
            """)
            await asyncio.sleep(1.5)

            # Switch persona to Sister Philomina (Hospital Command)
            await switch_persona("Philomina")

            hosp_ready = await eval_js("""
                (() => {
                    const text = document.body.innerText;
                    return {
                        hasRadha: text.includes('Radha Sharma'),
                        hasEscalationBanner: text.includes('URGENT SPECIALIST ESCALATION') || text.includes('Acknowledge Escalation'),
                        hasBayReadyBtn: !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm Bay Ready'))
                    };
                })()
            """)
            print(f"  -> Hospital Command Received Escalation: {hosp_ready}")
            assert hosp_ready["hasRadha"], "Radha Sharma not active in Hospital view"

            if hosp_ready["hasEscalationBanner"]:
                print("  -> Hospital clicking 'Acknowledge Escalation'...")
                await eval_js("""
                    (() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const ackBtn = buttons.find(b => b.innerText.includes('Acknowledge Escalation'));
                        if (ackBtn) ackBtn.click();
                    })()
                """)
                await asyncio.sleep(1)

            print("  -> Hospital clicking 'Confirm Bay Ready'...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const bayBtn = buttons.find(b => b.innerText.includes('Confirm Bay Ready'));
                    if (bayBtn) bayBtn.click();
                })()
            """)
            await asyncio.sleep(1)

            hospital_ready_verified = await eval_js("""
                (() => {
                    const body = document.body.innerText;
                    return {
                        hasBayVerified: body.includes('Bay Verified Ready') || body.includes('HOSPITAL READY'),
                        hasToast: body.includes('Resuscitation Bay Ready') || body.includes('Bay ready confirmed')
                    };
                })()
            """)
            print(f"  -> Hospital Bay Readiness: {hospital_ready_verified}")
            await save_screenshot("e2e_3_hospital_bay_ready.png")

            # -------------------------------------------------------------------------
            # 7. SWITCH TO FIELD MEDIC & MARK ARRIVED
            # -------------------------------------------------------------------------
            print("\n[STEP 7] Switching to Field Medic & Marking Patient Arrived...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
                    const medicBtn = buttons.find(b => (b.title || '').includes('Ambulance'));
                    if (medicBtn) medicBtn.click();
                })()
            """)
            await asyncio.sleep(1.5)

            # Switch persona to Paramedic Rajesh Kumar (Medic)
            await switch_persona("Rajesh")

            print("  -> Clicking 'MARK PATIENT ARRIVED'...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const arriveBtn = buttons.find(b => b.innerText.includes('MARK PATIENT ARRIVED'));
                    if (arriveBtn) arriveBtn.click();
                })()
            """)
            await asyncio.sleep(1)

            arrived_verified = await eval_js("""
                (() => {
                    const body = document.body.innerText;
                    return {
                        hasArrivedStatus: body.includes('PATIENT ARRIVED'),
                        hasHandoverPatientBtn: !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('HANDOVER PATIENT')),
                        hasToast: body.includes('Patient Marked Arrived') || body.includes('Vehicle reached')
                    };
                })()
            """)
            print(f"  -> Arrival State: {arrived_verified}")
            assert arrived_verified["hasArrivedStatus"], "Status did not update to PATIENT ARRIVED"
            assert arrived_verified["hasHandoverPatientBtn"], "HANDOVER PATIENT button not surfaced after arrival"
            await save_screenshot("e2e_4_patient_arrived.png")

            # -------------------------------------------------------------------------
            # 8. INITIATE OPERATIONAL HANDOVER (FIELD MEDIC)
            # -------------------------------------------------------------------------
            print("\n[STEP 8] Field Medic Initiating Bedside Handover...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const handoverBtn = buttons.find(b => b.innerText.includes('HANDOVER PATIENT'));
                    if (handoverBtn) handoverBtn.click();
                })()
            """)
            await asyncio.sleep(0.5)

            print("  -> Confirming Handover in WHO SBAR Modal...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const confirmHandoverBtn = buttons.find(b => b.innerText.includes('CONFIRM HANDOVER'));
                    if (confirmHandoverBtn) confirmHandoverBtn.click();
                })()
            """)
            await asyncio.sleep(1.5)

            handover_initiated_verified = await eval_js("""
                (() => {
                    const body = document.body.innerText;
                    return {
                        hasHandoverPending: body.includes('HANDOVER PENDING') || body.includes('HANDOVER IN PROGRESS'),
                        hasToast: body.includes('Transfer of Care Initiated') || body.includes('WHO SBAR briefing transmitted')
                    };
                })()
            """)
            print(f"  -> Handover Initiated State: {handover_initiated_verified}")
            assert handover_initiated_verified["hasHandoverPending"], "Handover did not transition to pending"
            await save_screenshot("e2e_5_handover_pending.png")

            # -------------------------------------------------------------------------
            # 9. HOSPITAL ACCEPTS HANDOVER & CARE CLOSURE
            # -------------------------------------------------------------------------
            print("\n[STEP 9] Hospital Command Accepting Handover...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
                    const hospBtn = buttons.find(b => (b.title || '').includes('Hospital'));
                    if (hospBtn) hospBtn.click();
                })()
            """)
            await asyncio.sleep(1.5)

            # Switch persona to Sister Philomina (Hospital)
            await switch_persona("Philomina")

            hosp_accept_ready = await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return {
                        hasAcceptBtn: !!buttons.find(b => b.innerText.includes('Accept Handover & Assume Care') || b.innerText.includes('Accept Handover'))
                    };
                })()
            """)
            print(f"  -> Hospital Accept Handover Button Surfaced: {hosp_accept_ready}")
            assert hosp_accept_ready["hasAcceptBtn"], "Accept Handover button not found in Hospital Command"

            print("  -> Hospital clicking 'Accept Handover & Assume Care'...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const acceptBtn = buttons.find(b => b.innerText.includes('Accept Handover & Assume Care') || b.innerText.includes('Accept Handover'));
                    if (acceptBtn) acceptBtn.click();
                })()
            """)
            await asyncio.sleep(2)

            # -------------------------------------------------------------------------
            # 10. FINAL LIFECYCLE CLOSURE VERIFICATION
            # -------------------------------------------------------------------------
            print("\n[STEP 10] Final Complete Lifecycle Verification...")
            final_check = await eval_js("""
                (() => {
                    const body = document.body.innerText;
                    return {
                        hasTransferCompletedBadge: body.includes('TRANSFER COMPLETED'),
                        hasTransferCompletedCard: body.includes('Transfer of Care Completed') || body.includes('Authoritative transfer of care executed'),
                        conduitAllCheckmarks: document.querySelectorAll('.text-emerald-500, .bg-emerald-500').length >= 5
                    };
                })()
            """)
            print(f"  -> Final Transfer Completion Assertions: {final_check}")
            assert final_check["hasTransferCompletedBadge"], "Top badge does not show TRANSFER COMPLETED"

            await save_screenshot("e2e_6_transfer_completed.png")

            # Return to Field Medic to check Care Rail
            print("  -> Checking Care Rail in Field Medic...")
            await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('aside button, nav button'));
                    const medicBtn = buttons.find(b => (b.title || '').includes('Ambulance'));
                    if (medicBtn) medicBtn.click();
                })()
            """)
            await asyncio.sleep(1)

            care_rail = await eval_js("""
                (() => {
                    const text = document.body.innerText;
                    return {
                        hasArrival: text.includes('PATIENT ARRIVED') || text.includes('Arrival'),
                        hasHandover: text.includes('HANDOVER') || text.includes('Handover'),
                        hasCompleted: text.includes('TRANSFER COMPLETED')
                    };
                })()
            """)
            print(f"  -> Care Rail Events: {care_rail}")
            assert care_rail["hasCompleted"], "Care Rail does not display TRANSFER COMPLETED"

            print(f"\n[CDP Console] Uncaught browser errors: {len(uncaught_errors)}")
            for err in uncaught_errors:
                print(f"  [ERROR] {err}")
            assert len(uncaught_errors) == 0, f"Found {len(uncaught_errors)} uncaught errors in browser console"

            print("\n================================================================================")
            print("  *** REAL BROWSER E2E WALKTHROUGH 100% SUCCESSFUL - ZERO DEFECTS ***  ")
            print("================================================================================\n")

    finally:
        chrome_proc.terminate()
        chrome_proc.wait()
        print("[CDP] Headless Chrome terminated.")

if __name__ == "__main__":
    asyncio.run(run_e2e())
