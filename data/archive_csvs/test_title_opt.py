import re

def optimize_title_and_category(raw_title, raw_vendor, raw_type):
    t = raw_title.replace('\ufffd', '–').strip()
    v = raw_vendor.strip() if raw_vendor else 'BaeMeds'
    if v.lower() in ['mohsinsurgicals-web', 'baemeds-main', 'default']:
        v = 'BaeMeds'
        
    g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
    p_type = raw_type if raw_type else "Medical Equipment"
    
    # 1. Oxygen Concentrators
    if any(k in t.lower() for k in ['oxygen concentrator', 'everflo', '5s', '10lpm', 'p2', 'olive', 'o2conc']):
        p_type = "Oxygen Concentrator"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'everflo' in t.lower() and 'philips' not in t.lower():
            t = f"Philips Respironics EverFlo 5 LPM Oxygen Concentrator for Home Care"
        elif 'filter' in t.lower() and 'everflo' in t.lower():
            t = f"Philips Respironics EverFlo Intake Air Filter — EverFlo & EverFlo Q Concentrators"
        elif '5s' in t.lower():
            t = f"EVOX-5S 5 LPM Stationary Oxygen Concentrator for Home & Clinical Care"
        elif 'p2' in t.lower():
            t = f"Oxymed P2 Ultra-Portable Oxygen Concentrator with Rechargeable Battery"
        elif 'mini' in t.lower() and '5lpm' in t.lower():
            t = f"Oxymed Mini 5 LPM Medical Grade Oxygen Concentrator"
        elif '10lpm' in t.lower() or '10 lpm' in t.lower():
            t = f"Oxymed 10 LPM High Flow Medical Oxygen Concentrator"
        elif 'olive' in t.lower():
            t = f"Olive 5 LPM Medical Oxygen Concentrator for Home Care"
        elif 'bpl' in t.lower() and '5lpm' in t.lower():
            t = f"BPL 5 LPM Stationary Oxygen Concentrator for Home Oxygen Therapy"
        elif 'dec mount' in t.lower():
            t = f"DEC Mount Portable Oxygen Concentrator with Pulse Flow Battery"
        elif 'oxygen concentrator' not in t.lower():
            t = f"{t} — Oxygen Concentrator"

    # 2. BiPAP Machines
    elif any(k in t.lower() for k in ['bipap', 'vpap', 'lumis', 'b30vt', 'st30', 'st25', 'st 30', 'st 25', 'avaps']):
        p_type = "BiPAP Machine"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'lumis 150' in t.lower():
            t = f"ResMed Lumis 150 VPAP ST with iVAPS (S10 Series) BiPAP Non-Invasive Ventilator"
        elif 'lumis 100' in t.lower():
            t = f"ResMed Lumis 100 VPAP ST BiPAP Tripack with HumidAir Heated Humidifier"
        elif 'b30vt' in t.lower():
            t = f"BMC Resmart G2S B30VT BiPAP Machine with Target Tidal Volume (VT)"
        elif 'st30' in t.lower() or 'st 30' in t.lower():
            t = f"Oxymed AirSmart ST30 High Pressure BiPAP Machine with S/T Modes"
        elif 'st25' in t.lower() or 'st 25' in t.lower():
            t = f"Oxymed AirSmart ST25 BiPAP Machine for COPD & Respiratory Support"
        elif 'iseries b5' in t.lower():
            t = f"Oxymed iSeries B5 Auto BiPAP Machine with Dynamic Humidification"
        elif 'dreamstation' in t.lower() and 'bipap' in t.lower():
            t = f"Philips Respironics DreamStation BiPAP AVAPS 25 Non-Invasive Ventilator"
        elif 'lc-bpap-30t' in t.lower() or 'topson' in t.lower():
            t = f"Topson LC-BPAP-30T BiPAP Machine for Sleep Apnea & COPD Support"
        elif 'bipap' not in t.lower():
            t = f"{t} — BiPAP Machine"

    # 3. CPAP Machines
    elif any(k in t.lower() for k in ['cpap', 'apap', 'airsense', 'airstart']):
        p_type = "CPAP Machine"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'airsense 10' in t.lower():
            t = f"ResMed AirSense 10 AutoSet CPAP Machine with Heated Humidifier — 2-Year Warranty"
        elif 'airsense 11' in t.lower():
            t = f"ResMed AirSense 11 AutoSet Tri 4G Auto-CPAP with Cellular Connectivity"
        elif 'airstart' in t.lower():
            t = f"ResMed AirStart 10 APAP Auto-Adjusting CPAP Machine"
        elif 'g2s auto' in t.lower() or ('g2s' in t.lower() and 'cpap' in t.lower()):
            t = f"BMC Resmart G2S Auto CPAP Machine with Integrated Heated Humidifier"
        elif 'dreamstation' in t.lower() and 'cpap' in t.lower():
            t = f"Philips Respironics DreamStation Auto CPAP Sleep Apnea Machine (IAX500S15)"
        elif 'iseries c5' in t.lower():
            t = f"Oxymed iSeries C5 Auto CPAP Machine with Smart Humidifier (Sleep Easy)"
        elif 'cpap' not in t.lower():
            t = f"{t} — Auto CPAP Machine"

    # 4. CPAP / BiPAP Masks
    elif any(k in t.lower() for k in ['mask', 'airfit', 'dreamwear', 'comfortgel', 'amara', 'true blue', 'bestfit', 'easycura', 'f4', 'f6', 'n5', 'yn02', 'yf-03', 'yp 01']):
        p_type = "CPAP & BiPAP Mask"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'airfit f20' in t.lower():
            t = f"ResMed AirFit F20 Full Face CPAP/BiPAP Mask with InfinitySeal Cushion (Size M)"
        elif 'airfit n20' in t.lower():
            t = f"ResMed AirFit N20 Nasal CPAP Mask with Comfort Headgear (Size M)"
        elif 'airfit p10' in t.lower() or 'p10' in t.lower() and 'resmed' in t.lower():
            t = f"ResMed AirFit P10 Ultra-Quiet Nasal Pillows Mask System"
        elif 'dreamwear' in t.lower():
            t = f"Philips Respironics DreamWear Under-the-Nose Nasal CPAP Mask"
        elif 'comfortgel' in t.lower():
            t = f"Philips Respironics ComfortGel Blue Full Face CPAP Mask with Headgear"
        elif 'amara' in t.lower():
            t = f"Philips Respironics Amara Gel Full Face CPAP Mask"
        elif 'true blue' in t.lower() or 'trueblue' in t.lower():
            t = f"Philips Respironics TrueBlue Gel Nasal CPAP Mask with Auto Seal (Size M)"
        elif 'image3' in t.lower():
            t = f"Philips Respironics Image3 Full Face CPAP Mask with Headgear"
        elif 'pheumo care' in t.lower() or 'pneumo care' in t.lower():
            t = f"Pneumo Care Full Face CPAP/BiPAP Mask with Adjustable Ergonomic Seal"
        elif 'bmc n5a' in t.lower():
            t = f"BMC N5A Auto-Adjusting Nasal CPAP Mask with Headgear"
        elif 'bmc n5' in t.lower():
            t = f"BMC N5 Ultra-Light Nasal CPAP Mask with Silicone Cushion"
        elif 'bmc p2' in t.lower():
            t = f"BMC P2 Nasal Pillows CPAP Mask with Multi-Size Pillows"
        elif 'bmc f6' in t.lower():
            t = f"BMC F6 Full Face Mask for CPAP & BiPAP Therapy"
        elif 'yn02' in t.lower() or 'yn-02' in t.lower():
            t = f"Yuwell YN-02 Nasal CPAP Mask with Silicone Forehead Support"
        elif 'yf-03' in t.lower() or 'yf03' in t.lower():
            t = f"Yuwell YF-03 Full Face CPAP Mask with Breathable Headgear"
        elif 'yp 01' in t.lower() or 'yp-01' in t.lower():
            t = f"Yuwell YP-01 Lightweight Nasal Pillows CPAP Mask"
        elif 'oxymed' in t.lower() and 'nasal' in t.lower():
            t = f"Oxymed Silicone Nasal CPAP Mask with Adjustable Headgear"
        elif 'bestfit' in t.lower():
            t = f"BestFit Full Face CPAP/BiPAP Mask with Quick Release Clips"
        elif 'easycura' in t.lower():
            t = f"EasyCura PneumoCare Full Face CPAP Mask with Dual Silicone Cushion"
        elif 'vented' in t.lower():
            t = f"Vented Full Face CPAP/BiPAP Hospital Mask with Exhalation Port"
        elif 'mask' not in t.lower():
            t = f"{t} — CPAP/BiPAP Mask"

    # 5. Patient Monitors & ECG
    elif any(k in t.lower() for k in ['monitor', 'cardiart', 'ecg', 'cms5100', 'pm30']):
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if 'cms5100' in t.lower():
            p_type = "Patient Monitor"
            t = f"Contec CMS5100 Compact Vital Signs Patient Monitor (SpO2, NIBP, PR)"
        elif 'pm30' in t.lower():
            p_type = "Patient Monitor"
            t = f"Yonker PM30 5-Parameter Multi-Para Patient Monitor for ICU & OT"
        elif 'cardiart 6208' in t.lower():
            p_type = "ECG Machine"
            t = f"BPL Cardiart 6208 ViewPlus 3-Channel Digital ECG Machine with Interpretation"
        elif 'patient monitor' not in t.lower():
            t = f"{t} — Patient Monitor"

    # 6. Wheelchairs
    elif 'wheelchair' in t.lower() or 'wc-104' in t.lower() or 'wc-105' in t.lower():
        p_type = "Electric Wheelchair"
        g_cat = "Health & Beauty > Health Care > Mobility & Accessibility"
        if '104s' in t.lower():
            t = f"EVOX WC-104S Standing Electric Wheelchair with Motorized Recline & Joystick"
        elif '105' in t.lower():
            t = f"EVOX WC-105/105E Reclining Electric Wheelchair with Commode Facility"
        elif 'wheelchair' not in t.lower():
            t = f"{t} — Electric Wheelchair"

    # 7. Blood Pressure Monitors
    elif any(k in t.lower() for k in ['blood pressure', 'bp monitor', '8712', '7121j', '7143t', 'bm46', 'bm36', 'bm27', 'bpl-120', 'longlife595']):
        p_type = "Blood Pressure Monitor"
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if '8712' in t.lower():
            t = f"Omron HEM-8712 Automatic Digital Blood Pressure Monitor with IntelliSense"
        elif '7121j' in t.lower():
            t = f"Omron HEM-7121J Automatic Digital Blood Pressure Monitor with Cuff Wrapping Guide"
        elif '7143t' in t.lower():
            t = f"Omron HEM-7143T1-A Bluetooth Wireless Automatic Blood Pressure Monitor"
        elif 'bm46' in t.lower():
            t = f"Beurer BM46 Upper Arm Digital Blood Pressure Monitor with Illuminated Display"
        elif 'bm36' in t.lower():
            t = f"Beurer BM36 Automatic Blood Pressure & Arrhythmia Detection Monitor"
        elif 'bm27' in t.lower():
            t = f"Beurer BM27 Upper Arm Blood Pressure Monitor with Universal Cuff"
        elif 'dr trust' in t.lower() and '122' in t.lower():
            t = f"Dr Trust Professional 122 Digital Blood Pressure Monitor with USB Port"
        elif 'bpl' in t.lower() and '120' in t.lower():
            t = f"BPL 120 Fully Automatic Digital Blood Pressure Monitor"
        elif 'accusure' in t.lower():
            t = f"AccuSure Automatic Digital Blood Pressure Monitor with Large LCD Display"
        elif 'longlife' in t.lower():
            t = f"LongLife 595 Digital Upper Arm Blood Pressure Monitor"
        elif 'blood pressure' not in t.lower():
            t = f"{t} — Digital Blood Pressure Monitor"

    # 8. Glucometers
    elif any(k in t.lower() for k in ['gluco', 'instant', 'accusure simple']):
        p_type = "Glucometer"
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if 'gluco one' in t.lower():
            t = f"Dr Morepen Gluco One BG-03 Blood Glucose Monitor (with 25 Test Strips)"
        elif 'instant s' in t.lower():
            t = f"Accu-Chek Instant S Blood Glucose Meter (with 10 Strips & Lancing Device)"
        elif 'instant' in t.lower():
            t = f"Accu-Chek Instant Blood Glucose Monitoring System (with 10 Strips)"
        elif 'accusure simple' in t.lower():
            t = f"AccuSure Simple Blood Glucose Monitoring System (with 10 Strips)"
        elif 'glucometer' not in t.lower():
            t = f"{t} — Blood Glucose Monitor"

    # 9. Nebulizers
    elif 'nebulizer' in t.lower() or 'nebb045' in t.lower() or 'ex-1303' in t.lower() or 'cn-02' in t.lower() or 'cn-01' in t.lower():
        p_type = "Nebulizer"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'n8' in t.lower():
            t = f"BPL N8 Compact Compressor Nebulizer for Child & Adult Respiratory Therapy"
        elif '409' in t.lower() or 'titanium' in t.lower():
            t = f"Dr Trust Titanium 409 Heavy Duty Compressor Nebulizer with Mask Kit"
        elif 'ex-1303' in t.lower():
            t = f"EZ Life Piston Compressor Nebulizer EX-1303 for Home Asthma Care"
        elif 'nebb045' in t.lower():
            t = f"Life Line NEBB045 Portable Compressor Nebulizer Machine"
        elif 'cn-02mc' in t.lower():
            t = f"Comfo Care CN-02MC Compressor Nebulizer System with Medication Cup"
        elif 'cn-01wa' in t.lower():
            t = f"Comfo Care CN-01WA Piston Compressor Nebulizer Machine"
        elif 'nebulizer' not in t.lower():
            t = f"{t} — Compressor Nebulizer"

    # 10. Suction Machines
    elif 'suction' in t.lower():
        p_type = "Suction Machine"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'oxymed' in t.lower():
            t = f"Oxymed Portable Electric Phlegm Suction Machine for Home Care & Clinics"
        elif 'life line' in t.lower():
            t = f"Life Line Portable Medical Suction Apparatus for Airway Management"
        elif 'm care' in t.lower():
            t = f"M Care Portable Medical Phlegm Suction Unit"
        elif 'comfo care' in t.lower():
            t = f"Comfo Care Portable Phlegm Suction Unit with Overflow Protection"
        elif 'suction' not in t.lower():
            t = f"{t} — Medical Suction Machine"

    # 11. Thermometers
    elif 'thermometer' in t.lower():
        p_type = "Thermometer"
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if 'contec' in t.lower():
            t = f"Contec Non-Contact Infrared Forehead Thermometer"
        elif 'gilma' in t.lower():
            t = f"Gilma Digital Non-Contact Infrared Forehead Thermometer"
        elif 'ez life' in t.lower() and 'infrared' in t.lower():
            t = f"EZ Life Non-Contact Infrared Digital Body Thermometer"
        elif 'dr trust' in t.lower() and '604' in t.lower():
            t = f"Dr Trust 604 Waterproof Digital Clinical Thermometer"
        elif 'ez life' in t.lower() and 'digital' in t.lower():
            t = f"EZ Life Flexible Tip Digital Clinical Thermometer"
        elif 'thermometer' not in t.lower():
            t = f"{t} — Digital Thermometer"

    # 12. Physiotherapy & TENS
    elif any(k in t.lower() for k in ['tens', 'ms combo', 'mini ms', 'ultrasound']):
        p_type = "Physiotherapy Device"
        g_cat = "Health & Beauty > Health Care > Alternative & Holistic Health"
        if '4-ch' in t.lower() or '4 channel' in t.lower():
            t = f"4-Channel TENS with Ultrasound Digital Physiotherapy Pain Relief Machine"
        elif '2-ch' in t.lower() or '2 channel' in t.lower():
            t = f"2-Channel TENS with Ultrasound Electrotherapy Physiotherapy Unit"
        elif 'combo mini' in t.lower():
            t = f"TENS MS Combo Mini Portable Muscle Stimulator for Physiotherapy"
        elif 'mini ms' in t.lower():
            t = f"Mini MS Electro-Muscle Stimulator Unit for Physical Therapy"

    # 13. Incontinence / Diapers
    elif 'diaper' in t.lower():
        p_type = "Adult Diaper"
        g_cat = "Health & Beauty > Personal Care > Incontinence Aids"
        t = f"Medis Large Adult Diapers (High Absorbency & Anti-Bacterial Leak Guard)"

    # Clean up double dashes or formatting
    t = re.sub(r'\s+', ' ', t).strip()
    return t, p_type, g_cat

print("Title optimization function defined successfully!")
