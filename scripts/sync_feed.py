"""
BaeMeds Google Merchant Center Feed Automated Sync
Connects directly to Shopify Storefront GraphQL API to fetch all live products,
working Shopify CDN images, live pricing, and stock status.
Injects Google Shopping Title Attributes & Official Google Product Categories.
"""

import urllib.request
import json
import re
import xml.etree.ElementTree as ET

ENDPOINT = "https://ptya1n-k0.myshopify.com/api/2024-07/graphql.json"
ACCESS_TOKEN = "c1fb47a74eaec2fbafa70becac08f52b"
STORE_URL = "https://baemeds.com"

query = """
{
  products(first: 250) {
    edges {
      node {
        id
        title
        handle
        description
        productType
        vendor
        variants(first: 10) {
          edges {
            node {
              id
              sku
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
      }
    }
  }
}
"""

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
        if 'everflo' in t.lower() and 'filter' not in t.lower():
            t = "Philips Respironics EverFlo 5 LPM Oxygen Concentrator for Home Care"
        elif 'filter' in t.lower() and 'everflo' in t.lower():
            t = "Philips Respironics EverFlo Intake Air Filter — EverFlo & EverFlo Q Concentrators"
        elif '5s' in t.lower():
            t = "EVOX-5S 5 LPM Stationary Oxygen Concentrator for Home & Clinical Care"
        elif 'p2' in t.lower():
            t = "Oxymed P2 Ultra-Portable Oxygen Concentrator with Rechargeable Battery"
        elif 'mini' in t.lower() and '5lpm' in t.lower():
            t = "Oxymed Mini 5 LPM Medical Grade Oxygen Concentrator"
        elif '10lpm' in t.lower() or '10 lpm' in t.lower():
            t = "Oxymed 10 LPM High Flow Medical Oxygen Concentrator"
        elif 'olive' in t.lower():
            t = "Olive 5 LPM Medical Oxygen Concentrator for Home Care"
        elif 'bpl' in t.lower() and '5lpm' in t.lower():
            t = "BPL 5 LPM Stationary Oxygen Concentrator for Home Oxygen Therapy"
        elif 'dec mount' in t.lower():
            t = "DEC Mount Portable Oxygen Concentrator with Pulse Flow Battery"
        elif 'oxygen concentrator' not in t.lower():
            t = f"{t} — Oxygen Concentrator"

    # 2. BiPAP Machines
    elif any(k in t.lower() for k in ['bipap', 'vpap', 'lumis', 'b30vt', 'st30', 'st25', 'st 30', 'st 25', 'avaps']):
        p_type = "BiPAP Machine"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'lumis 150' in t.lower():
            t = "ResMed Lumis 150 VPAP ST with iVAPS (S10 Series) BiPAP Non-Invasive Ventilator"
        elif 'lumis 100' in t.lower():
            t = "ResMed Lumis 100 VPAP ST BiPAP Tripack with HumidAir Heated Humidifier"
        elif 'b30vt' in t.lower():
            t = "BMC Resmart G2S B30VT BiPAP Machine with Target Tidal Volume (VT)"
        elif 'st30' in t.lower() or 'st 30' in t.lower():
            t = "Oxymed AirSmart ST30 High Pressure BiPAP Machine with S/T Modes"
        elif 'st25' in t.lower() or 'st 25' in t.lower():
            t = "Oxymed AirSmart ST25 BiPAP Machine for COPD & Respiratory Support"
        elif 'iseries b5' in t.lower():
            t = "Oxymed iSeries B5 Auto BiPAP Machine with Dynamic Humidification"
        elif 'dreamstation' in t.lower() and 'bipap' in t.lower():
            t = "Philips Respironics DreamStation BiPAP AVAPS 25 Non-Invasive Ventilator"
        elif 'lc-bpap-30t' in t.lower() or 'topson' in t.lower():
            t = "Topson LC-BPAP-30T BiPAP Machine for Sleep Apnea & COPD Support"
        elif 'bipap' not in t.lower():
            t = f"{t} — BiPAP Machine"

    # 3. CPAP Machines
    elif any(k in t.lower() for k in ['cpap', 'apap', 'airsense', 'airstart']):
        p_type = "CPAP Machine"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'airsense 10' in t.lower():
            t = "ResMed AirSense 10 AutoSet CPAP Machine with Heated Humidifier — 2-Year Warranty"
        elif 'airsense 11' in t.lower():
            t = "ResMed AirSense 11 AutoSet Tri 4G Auto-CPAP with Cellular Connectivity"
        elif 'airstart' in t.lower():
            t = "ResMed AirStart 10 APAP Auto-Adjusting CPAP Machine"
        elif 'g2s auto' in t.lower() or ('g2s' in t.lower() and 'cpap' in t.lower()):
            t = "BMC Resmart G2S Auto CPAP Machine with Integrated Heated Humidifier"
        elif 'dreamstation' in t.lower() and 'cpap' in t.lower():
            t = "Philips Respironics DreamStation Auto CPAP Sleep Apnea Machine (IAX500S15)"
        elif 'iseries c5' in t.lower():
            t = "Oxymed iSeries C5 Auto CPAP Machine with Smart Humidifier (Sleep Easy)"
        elif 'cpap' not in t.lower():
            t = f"{t} — Auto CPAP Machine"

    # 4. CPAP / BiPAP Masks
    elif any(k in t.lower() for k in ['mask', 'airfit', 'dreamwear', 'comfortgel', 'amara', 'true blue', 'bestfit', 'easycura', 'f4', 'f6', 'n5', 'yn02', 'yf-03', 'yp 01']):
        p_type = "CPAP & BiPAP Mask"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'airfit f20' in t.lower():
            t = "ResMed AirFit F20 Full Face CPAP/BiPAP Mask with InfinitySeal Cushion (Size M)"
        elif 'airfit n20' in t.lower():
            t = "ResMed AirFit N20 Nasal CPAP Mask with Comfort Headgear (Size M)"
        elif 'airfit p10' in t.lower() or ('p10' in t.lower() and 'resmed' in t.lower()):
            t = "ResMed AirFit P10 Ultra-Quiet Nasal Pillows Mask System"
        elif 'dreamwear' in t.lower():
            t = "Philips Respironics DreamWear Under-the-Nose Nasal CPAP Mask"
        elif 'comfortgel' in t.lower():
            t = "Philips Respironics ComfortGel Blue Full Face CPAP Mask with Headgear"
        elif 'amara' in t.lower():
            t = "Philips Respironics Amara Gel Full Face CPAP Mask"
        elif 'true blue' in t.lower() or 'trueblue' in t.lower():
            t = "Philips Respironics TrueBlue Gel Nasal CPAP Mask with Auto Seal (Size M)"
        elif 'image3' in t.lower():
            t = "Philips Respironics Image3 Full Face CPAP Mask with Headgear"
        elif 'pheumo care' in t.lower() or 'pneumo care' in t.lower():
            t = "Pneumo Care Full Face CPAP/BiPAP Mask with Adjustable Ergonomic Seal"
        elif 'bmc n5a' in t.lower():
            t = "BMC N5A Auto-Adjusting Nasal CPAP Mask with Headgear"
        elif 'bmc n5' in t.lower():
            t = "BMC N5 Ultra-Light Nasal CPAP Mask with Silicone Cushion"
        elif 'bmc p2' in t.lower():
            t = "BMC P2 Nasal Pillows CPAP Mask with Multi-Size Pillows"
        elif 'bmc f6' in t.lower():
            t = "BMC F6 Full Face Mask for CPAP & BiPAP Therapy"
        elif 'yn02' in t.lower() or 'yn-02' in t.lower():
            t = "Yuwell YN-02 Nasal CPAP Mask with Silicone Forehead Support"
        elif 'yf-03' in t.lower() or 'yf03' in t.lower():
            t = "Yuwell YF-03 Full Face CPAP Mask with Breathable Headgear"
        elif 'yp 01' in t.lower() or 'yp-01' in t.lower():
            t = "Yuwell YP-01 Lightweight Nasal Pillows CPAP Mask"
        elif 'oxymed' in t.lower() and 'nasal' in t.lower():
            t = "Oxymed Silicone Nasal CPAP Mask with Adjustable Headgear"
        elif 'bestfit' in t.lower():
            t = "BestFit Full Face CPAP/BiPAP Mask with Quick Release Clips"
        elif 'easycura' in t.lower():
            t = "EasyCura PneumoCare Full Face CPAP Mask with Dual Silicone Cushion"
        elif 'vented' in t.lower():
            t = "Vented Full Face CPAP/BiPAP Hospital Mask with Exhalation Port"
        elif 'mask' not in t.lower():
            t = f"{t} — CPAP/BiPAP Mask"

    # 5. Patient Monitors & ECG
    elif any(k in t.lower() for k in ['monitor', 'cardiart', 'ecg', 'cms5100', 'pm30']):
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if 'cms5100' in t.lower():
            p_type = "Patient Monitor"
            t = "Contec CMS5100 Compact Vital Signs Patient Monitor (SpO2, NIBP, PR)"
        elif 'pm30' in t.lower():
            p_type = "Patient Monitor"
            t = "Yonker PM30 5-Parameter Multi-Para Patient Monitor for ICU & OT"
        elif 'cardiart 6208' in t.lower():
            p_type = "ECG Machine"
            t = "BPL Cardiart 6208 ViewPlus 3-Channel Digital ECG Machine with Interpretation"
        elif 'patient monitor' not in t.lower():
            t = f"{t} — Patient Monitor"

    # 6. Wheelchairs
    elif 'wheelchair' in t.lower() or 'wc-104' in t.lower() or 'wc-105' in t.lower():
        p_type = "Electric Wheelchair"
        g_cat = "Health & Beauty > Health Care > Mobility & Accessibility"
        if '104s' in t.lower():
            t = "EVOX WC-104S Standing Electric Wheelchair with Motorized Recline & Joystick"
        elif '105' in t.lower():
            t = "EVOX WC-105/105E Reclining Electric Wheelchair with Commode Facility"
        elif 'wheelchair' not in t.lower():
            t = f"{t} — Electric Wheelchair"

    # 7. Blood Pressure Monitors
    elif any(k in t.lower() for k in ['blood pressure', 'bp monitor', '8712', '7121j', '7143t', 'bm46', 'bm36', 'bm27', 'bpl-120', 'longlife595']):
        p_type = "Blood Pressure Monitor"
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if '8712' in t.lower():
            t = "Omron HEM-8712 Automatic Digital Blood Pressure Monitor with IntelliSense"
        elif '7121j' in t.lower():
            t = "Omron HEM-7121J Automatic Digital Blood Pressure Monitor with Cuff Wrapping Guide"
        elif '7143t' in t.lower():
            t = "Omron HEM-7143T1-A Bluetooth Wireless Automatic Blood Pressure Monitor"
        elif 'bm46' in t.lower():
            t = "Beurer BM46 Upper Arm Digital Blood Pressure Monitor with Illuminated Display"
        elif 'bm36' in t.lower():
            t = "Beurer BM36 Automatic Blood Pressure & Arrhythmia Detection Monitor"
        elif 'bm27' in t.lower():
            t = "Beurer BM27 Upper Arm Blood Pressure Monitor with Universal Cuff"
        elif 'dr trust' in t.lower() and '122' in t.lower():
            t = "Dr Trust Professional 122 Digital Blood Pressure Monitor with USB Port"
        elif 'bpl' in t.lower() and '120' in t.lower():
            t = "BPL 120 Fully Automatic Digital Blood Pressure Monitor"
        elif 'accusure' in t.lower():
            t = "AccuSure Automatic Digital Blood Pressure Monitor with Large LCD Display"
        elif 'longlife' in t.lower():
            t = "LongLife 595 Digital Upper Arm Blood Pressure Monitor"
        elif 'blood pressure' not in t.lower():
            t = f"{t} — Digital Blood Pressure Monitor"

    # 8. Glucometers
    elif any(k in t.lower() for k in ['gluco', 'instant', 'accusure simple']):
        p_type = "Glucometer"
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if 'gluco one' in t.lower():
            t = "Dr Morepen Gluco One BG-03 Blood Glucose Monitor (with 25 Test Strips)"
        elif 'instant s' in t.lower():
            t = "Accu-Chek Instant S Blood Glucose Meter (with 10 Strips & Lancing Device)"
        elif 'instant' in t.lower():
            t = "Accu-Chek Instant Blood Glucose Monitoring System (with 10 Strips)"
        elif 'accusure simple' in t.lower():
            t = "AccuSure Simple Blood Glucose Monitoring System (with 10 Strips)"
        elif 'glucometer' not in t.lower():
            t = f"{t} — Blood Glucose Monitor"

    # 9. Nebulizers
    elif 'nebulizer' in t.lower() or 'nebb045' in t.lower() or 'ex-1303' in t.lower() or 'cn-02' in t.lower() or 'cn-01' in t.lower():
        p_type = "Nebulizer"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'n8' in t.lower():
            t = "BPL N8 Compact Compressor Nebulizer for Child & Adult Respiratory Therapy"
        elif '409' in t.lower() or 'titanium' in t.lower():
            t = "Dr Trust Titanium 409 Heavy Duty Compressor Nebulizer with Mask Kit"
        elif 'ex-1303' in t.lower():
            t = "EZ Life Piston Compressor Nebulizer EX-1303 for Home Asthma Care"
        elif 'nebb045' in t.lower():
            t = "Life Line NEBB045 Portable Compressor Nebulizer Machine"
        elif 'cn-02mc' in t.lower():
            t = "Comfo Care CN-02MC Compressor Nebulizer System with Medication Cup"
        elif 'cn-01wa' in t.lower():
            t = "Comfo Care CN-01WA Piston Compressor Nebulizer Machine"
        elif 'nebulizer' not in t.lower():
            t = f"{t} — Compressor Nebulizer"

    # 10. Suction Machines
    elif 'suction' in t.lower():
        p_type = "Suction Machine"
        g_cat = "Health & Beauty > Health Care > Respiratory Care"
        if 'oxymed' in t.lower():
            t = "Oxymed Portable Electric Phlegm Suction Machine for Home Care & Clinics"
        elif 'life line' in t.lower():
            t = "Life Line Portable Medical Suction Apparatus for Airway Management"
        elif 'm care' in t.lower():
            t = "M Care Portable Medical Phlegm Suction Unit"
        elif 'comfo care' in t.lower():
            t = "Comfo Care Portable Phlegm Suction Unit with Overflow Protection"
        elif 'suction' not in t.lower():
            t = f"{t} — Medical Suction Machine"

    # 11. Thermometers
    elif 'thermometer' in t.lower():
        p_type = "Thermometer"
        g_cat = "Health & Beauty > Health Care > Medical Tests & Monitors"
        if 'contec' in t.lower():
            t = "Contec Non-Contact Infrared Forehead Thermometer"
        elif 'gilma' in t.lower():
            t = "Gilma Digital Non-Contact Infrared Forehead Thermometer"
        elif 'ez life' in t.lower() and 'infrared' in t.lower():
            t = "EZ Life Non-Contact Infrared Digital Body Thermometer"
        elif 'dr trust' in t.lower() and '604' in t.lower():
            t = "Dr Trust 604 Waterproof Digital Clinical Thermometer"
        elif 'ez life' in t.lower() and 'digital' in t.lower():
            t = "EZ Life Flexible Tip Digital Clinical Thermometer"
        elif 'thermometer' not in t.lower():
            t = f"{t} — Digital Thermometer"

    # 12. Physiotherapy & TENS
    elif any(k in t.lower() for k in ['tens', 'ms combo', 'mini ms', 'ultrasound']):
        p_type = "Physiotherapy Device"
        g_cat = "Health & Beauty > Health Care > Alternative & Holistic Health"
        if '4-ch' in t.lower() or '4 channel' in t.lower():
            t = "4-Channel TENS with Ultrasound Digital Physiotherapy Pain Relief Machine"
        elif '2-ch' in t.lower() or '2 channel' in t.lower():
            t = "2-Channel TENS with Ultrasound Electrotherapy Physiotherapy Unit"
        elif 'combo mini' in t.lower():
            t = "TENS MS Combo Mini Portable Muscle Stimulator for Physiotherapy"
        elif 'mini ms' in t.lower():
            t = "Mini MS Electro-Muscle Stimulator Unit for Physical Therapy"

    # 13. Incontinence / Diapers
    elif 'diaper' in t.lower():
        p_type = "Adult Diaper"
        g_cat = "Health & Beauty > Personal Care > Incontinence Aids"
        t = "Medis Large Adult Diapers (High Absorbency & Anti-Bacterial Leak Guard)"

    t = re.sub(r'\s+', ' ', t).strip()
    return t, p_type, g_cat

def sync():
    print("[*] Connecting to Shopify API...")
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps({"query": query}).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': ACCESS_TOKEN,
            'Accept': 'application/json'
        }
    )

    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        products_edges = res.get('data', {}).get('products', {}).get('edges', [])

    print(f"[*] Fetched {len(products_edges)} live products from Shopify!")

    feed_items = []

    for edge in products_edges:
        node = edge['node']
        raw_title = node['title']
        handle = node['handle']
        raw_vendor = node.get('vendor') or 'BaeMeds'
        raw_type = node.get('productType') or 'Medical Equipment'
        
        # Optimize title and official categories
        title, product_type, google_category = optimize_title_and_category(raw_title, raw_vendor, raw_type)
        
        desc = node.get('description', '') or f"{title} - High quality medical equipment available at BaeMeds."
        desc = re.sub(r'<[^>]+>', ' ', desc)
        desc = re.sub(r'\s+', ' ', desc).strip()
        if len(desc) < 10:
            desc = f"{title} available with authorized warranty and express nationwide delivery from BaeMeds."
            
        vendor = raw_vendor
        if vendor.lower() in ['mohsinsurgicals-web', 'baemeds-main', 'default']:
            vendor = 'BaeMeds'
            
        link = f"{STORE_URL}/products/{handle}"
        
        images = node.get('images', {}).get('edges', [])
        image_url = images[0]['node']['url'] if len(images) > 0 else ''
        
        variants = node.get('variants', {}).get('edges', [])
        if len(variants) > 0:
            v_node = variants[0]['node']
            sku = v_node.get('sku')
            price_val = float(v_node['price']['amount'])
            curr = v_node['price']['currencyCode']
            available = v_node.get('availableForSale', True)
            
            compare_at = v_node.get('compareAtPrice')
            compare_val = float(compare_at['amount']) if compare_at else None
            
            if compare_val and compare_val > price_val:
                price_str = f"{compare_val:.2f} {curr}"
                sale_price_str = f"{price_val:.2f} {curr}"
            else:
                price_str = f"{price_val:.2f} {curr}"
                sale_price_str = None
                
            avail_str = "in_stock" if available else "out_of_stock"
        else:
            sku = None
            price_str = "1000.00 INR"
            sale_price_str = None
            avail_str = "in_stock"
            
        if not sku:
            clean_handle_id = re.sub(r'[^a-zA-Z0-9-]', '', handle.upper())
            item_id = f"BAE-{clean_handle_id[:25]}"
        else:
            item_id = re.sub(r'\s+', '', sku)
            
        feed_items.append({
            'id': item_id,
            'title': title,
            'description': desc,
            'link': link,
            'image_link': image_url,
            'availability': avail_str,
            'price': price_str,
            'sale_price': sale_price_str,
            'brand': vendor,
            'condition': 'new',
            'mpn': item_id,
            'identifier_exists': 'no',
            'product_type': product_type,
            'google_product_category': google_category
        })

    def xml_escape(val):
        return (str(val)
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&apos;'))

    xml_lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
        '  <channel>',
        '    <title>BAE Meds Product Feed</title>',
        '    <link>https://baemeds.com</link>',
        '    <description>Live Google Merchant Center feed with optimized Shopping Title attributes and categories</description>'
    ]

    field_order = [
        'id',
        'title',
        'description',
        'link',
        'image_link',
        'availability',
        'price',
        'sale_price',
        'brand',
        'condition',
        'mpn',
        'identifier_exists',
        'product_type',
        'google_product_category'
    ]

    for item in feed_items:
        if not item['image_link']:
            continue
        xml_lines.append('    <item>')
        for field in field_order:
            if field in item and item[field]:
                val_escaped = xml_escape(item[field])
                xml_lines.append(f'      <g:{field}>{val_escaped}</g:{field}>')
        xml_lines.append('    </item>')

    xml_lines.append('  </channel>')
    xml_lines.append('</rss>\n')

    final_xml = '\n'.join(xml_lines)

    with open("Book1.xml", "w", encoding="utf-8") as f:
        f.write(final_xml)

    with open("../../Book1.xml", "w", encoding="utf-8") as f:
        f.write(final_xml)

    tree = ET.fromstring(final_xml)
    count = len(tree.find('channel').findall('item'))
    print(f"[SUCCESS] Synchronized {count} products with optimized Shopping Titles & Categories to Book1.xml!")

if __name__ == "__main__":
    sync()
